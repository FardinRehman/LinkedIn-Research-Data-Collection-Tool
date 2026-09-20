import { jobManager } from '../services/jobManager.js';
import { ProviderFactory } from '../providers/ProviderFactory.js';
import { ValidationError } from '../utils/errors.js';

export const createJob = (req, res, next) => {
  try {
    const { query, limit, fields, category, provider } = req.body;
    const result = jobManager.createJob({ query, limit, fields, category, provider });
    res.status(201).json({
      success: true,
      message: 'Research job initiated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getJobStatus = (req, res, next) => {
  try {
    const { id } = req.params;
    const job = jobManager.getJob(id);
    res.json({
      success: true,
      data: {
        id: job.id,
        query: job.query,
        limit: job.limit,
        fields: job.fields,
        category: job.category,
        provider: job.providerName,
        status: job.status,
        progress: job.progress,
        metrics: job.metrics,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        recentLogs: job.logs.slice(-15),
        error: job.error
      }
    });
  } catch (error) {
    next(error);
  }
};

export const streamJobEvents = (req, res, next) => {
  try {
    const { id } = req.params;
    const job = jobManager.getJob(id);

    // Set standard SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx proxy buffering
    res.flushHeaders?.();

    // Send immediate initial state
    const initialPayload = {
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
    res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);

    // If job is already settled, finish SSE
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      res.end();
      return;
    }

    // Subscribe to live events
    const unsubscribe = jobManager.subscribe(id, (update) => {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
      if (update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled') {
        unsubscribe();
        res.end();
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      unsubscribe();
    });
  } catch (error) {
    next(error);
  }
};

export const cancelJob = (req, res, next) => {
  try {
    const { id } = req.params;
    const result = jobManager.cancelJob(id);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const listJobs = (req, res, next) => {
  try {
    const jobs = jobManager.getAllJobs();
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    next(error);
  }
};

export const getProviders = async (req, res, next) => {
  try {
    const providers = await ProviderFactory.getAvailableProviders();
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    next(error);
  }
};
