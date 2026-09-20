import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { ProviderFactory } from '../providers/ProviderFactory.js';
import { NormalizationService } from './normalizationService.js';
import { JobDeduplicationRegistry } from './deduplicationService.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

/**
 * Job Manager
 * Orchestrates background data collection tasks, tracks state, dispatches SSE updates.
 */
export class JobManager {
  constructor() {
    this.jobs = new Map(); // jobId -> JobState
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(200);
  }

  /**
   * Create and immediately launch a research collection job
   * @param {Object} params
   * @param {string} params.query - Search keywords
   * @param {number} params.limit - Max records to collect
   * @param {Array<{ key: string, label: string, isCustom?: boolean }>} params.fields - Dynamic fields
   * @param {string} [params.category] - 'people' | 'companies' | 'auto'
   * @param {string} [params.provider] - 'mock' | 'authorized_linkedin'
   * @returns {Object} Job metadata
   */
  createJob({ query, limit = 50, fields = [], category = 'auto', provider = null }) {
    if (!query || !query.trim()) {
      throw new ValidationError('Search query is required');
    }
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      throw new ValidationError('At least one output field must be selected');
    }

    const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 50, 500)); // Cap limit between 1 and 500
    const jobId = `job_${uuidv4()}`;
    const activeProvider = provider || config.dataProvider || 'simulation';

    const job = {
      id: jobId,
      query: query.trim(),
      limit: parsedLimit,
      fields: fields.map(f => typeof f === 'string' ? { key: f, label: f } : f),
      category: category || 'auto',
      providerName: activeProvider,
      status: 'pending', // 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      progress: {
        totalTarget: parsedLimit,
        processedRecords: 0,
        uniqueRecords: 0,
        duplicateRecords: 0,
        failedRecords: 0,
        currentPage: 0,
        percent: 0
      },
      metrics: {
        totalRawFetched: 0,
        unique: 0,
        duplicates: 0,
        failed: 0,
        pagesProcessed: 0
      },
      results: [],
      failedItems: [],
      logs: [],
      error: null
    };

    this.jobs.set(jobId, job);
    this._addLog(job, 'info', `Job initialized for query "${job.query}" targeting ${job.limit} records.`);

    // Launch background asynchronous worker
    setImmediate(() => {
      this._runJob(jobId);
    });

    return {
      jobId: job.id,
      status: job.status,
      query: job.query,
      limit: job.limit,
      fields: job.fields,
      createdAt: job.createdAt
    };
  }

  getJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundError(`Job with ID ${jobId} not found`);
    }
    return job;
  }

  getAllJobs() {
    return Array.from(this.jobs.values()).map(j => ({
      id: j.id,
      query: j.query,
      limit: j.limit,
      status: j.status,
      createdAt: j.createdAt,
      completedAt: j.completedAt,
      uniqueCount: j.progress.uniqueRecords,
      fieldsCount: j.fields.length
    }));
  }

  cancelJob(jobId) {
    const job = this.getJob(jobId);
    if (job.status === 'in_progress' || job.status === 'pending') {
      job.status = 'cancelled';
      job.completedAt = new Date().toISOString();
      this._addLog(job, 'warn', 'Job was cancelled by user.');
      this._emitUpdate(job);
      return { success: true, message: 'Job cancelled' };
    }
    return { success: false, message: `Job is already in status "${job.status}"` };
  }

  /**
   * Subscribe to real-time SSE updates for a specific job
   */
  subscribe(jobId, listener) {
    const eventName = `job:${jobId}`;
    this.emitter.on(eventName, listener);
    return () => this.emitter.off(eventName, listener);
  }

  /**
   * Core background execution loop
   */
  async _runJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'in_progress';
    job.startedAt = new Date().toISOString();
    this._emitUpdate(job);

    try {
      const provider = ProviderFactory.getProvider(job.providerName);
      const dedupRegistry = new JobDeduplicationRegistry(job.category);
      const pageSize = 15;
      let currentPage = 1;
      let hasMore = true;

      this._addLog(job, 'info', `Using data adapter: ${provider.name}. Beginning collection...`);

      while (hasMore && job.results.length < job.limit && job.status === 'in_progress') {
        job.progress.currentPage = currentPage;
        this._addLog(job, 'debug', `Fetching page ${currentPage} (batch size: ${pageSize})...`);
        this._emitUpdate(job);

        let pageData;
        try {
          pageData = await provider.fetchPage({
            query: job.query,
            page: currentPage,
            pageSize: pageSize,
            category: job.category
          });
        } catch (pageErr) {
          this._addLog(job, 'error', `Page ${currentPage} fetch encountered error: ${pageErr.message}`);
          job.progress.failedRecords += 1;
          job.metrics.failed += 1;
          if (job.results.length === 0) {
            job.status = 'failed';
            job.error = pageErr.message;
            job.completedAt = new Date().toISOString();
          }
          break; // Stop pagination on fatal network/provider failure
        }

        const rawRecords = pageData.records || [];
        job.metrics.totalRawFetched += rawRecords.length;

        if (rawRecords.length === 0) {
          this._addLog(job, 'info', `No more records returned from provider on page ${currentPage}.`);
          break;
        }

        for (const rawItem of rawRecords) {
          // If job was cancelled mid-iteration, break
          if (job.status !== 'in_progress') break;

          job.progress.processedRecords++;

          // 1. Deduplication check
          const dedupResult = dedupRegistry.isDuplicate(rawItem);
          if (dedupResult.isDup) {
            job.progress.duplicateRecords++;
            job.metrics.duplicates++;
            this._addLog(job, 'debug', `Duplicate record detected & filtered (strategy: ${dedupResult.strategy}).`);
            continue;
          }

          // 2. Normalization & dynamic field projection
          const projectionResult = NormalizationService.projectRecord(rawItem, job.fields);

          if (!projectionResult.success) {
            job.progress.failedRecords++;
            job.metrics.failed++;
            job.failedItems.push({
              raw: rawItem,
              reason: projectionResult.error || 'Record validation failed'
            });
            this._addLog(job, 'warn', `Skipped invalid record: ${projectionResult.error}`);
            continue;
          }

          // 3. Store valid record
          const cleanRecord = {
            _id: `rec_${job.results.length + 1}`,
            ...projectionResult.record
          };

          job.results.push(cleanRecord);
          job.progress.uniqueRecords = job.results.length;
          job.metrics.unique = job.results.length;

          // Recalculate percent
          job.progress.percent = Math.min(100, Math.round((job.results.length / job.limit) * 100));

          if (job.results.length >= job.limit) {
            this._addLog(job, 'info', `Target limit of ${job.limit} records reached.`);
            break;
          }
        }

        job.metrics.pagesProcessed = currentPage;
        this._emitUpdate(job);

        hasMore = pageData.hasNextPage && job.results.length < job.limit;
        currentPage++;
      }

      if (job.status === 'in_progress') {
        job.status = 'completed';
        job.progress.percent = 100;
        job.completedAt = new Date().toISOString();
        this._addLog(job, 'info', `Job completed successfully! Total unique collected: ${job.results.length}, Duplicates removed: ${job.metrics.duplicates}, Failed: ${job.metrics.failed}`);
      }
    } catch (err) {
      logger.error(`Job ${jobId} failed with critical error:`, err);
      job.status = 'failed';
      job.error = err.message || 'Fatal error during collection process';
      job.completedAt = new Date().toISOString();
      this._addLog(job, 'error', `Job aborted due to error: ${job.error}`);
    } finally {
      this._emitUpdate(job);
    }
  }

  _addLog(job, level, message) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    job.logs.push(entry);
    // Keep max 100 recent logs in memory
    if (job.logs.length > 100) {
      job.logs.shift();
    }
  }

  _emitUpdate(job) {
    const payload = {
      jobId: job.id,
      status: job.status,
      query: job.query,
      limit: job.limit,
      progress: job.progress,
      metrics: job.metrics,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      recentLogs: job.logs.slice(-10),
      error: job.error
    };
    this.emitter.emit(`job:${job.id}`, payload);
  }
}

// Singleton instance
export const jobManager = new JobManager();
