/**
 * Client-side Simulation Engine for GitHub Pages (github.io)
 * Allows visitors to run full research collections, dynamic fields,
 * and exports directly in their browser without requiring a backend.
 */
import { PRESETS } from '../types/fields';

export class ClientResearchEngine {
  constructor() {
    this.jobs = new Map();
  }

  createJob({ query, limit = 50, fields = [], category = 'people' }) {
    const jobId = `job_${Date.now()}`;
    const selectedFields = fields.filter(f => f.selected !== false);

    const job = {
      id: jobId,
      query,
      limit,
      fields: selectedFields,
      category,
      status: 'in_progress',
      progress: {
        totalTarget: limit,
        processedRecords: 0,
        uniqueRecords: 0,
        duplicateRecords: 0,
        failedRecords: 0,
        currentPage: 1,
        percent: 0
      },
      metrics: {
        totalRawFetched: 0,
        unique: 0,
        duplicates: 0,
        failed: 0,
        pagesProcessed: 1
      },
      results: [],
      failedItems: [],
      recentLogs: [
        { timestamp: new Date().toISOString(), level: 'info', message: `Job started for query "${query}" (${limit} target records)` }
      ]
    };

    this.jobs.set(jobId, job);
    this._simulateCollection(job);
    return { jobId, status: 'in_progress' };
  }

  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  async _simulateCollection(job) {
    const totalBatches = Math.min(Math.ceil(job.limit / 10), 10);
    const seenUrls = new Set();

    for (let batch = 1; batch <= totalBatches; batch++) {
      await new Promise(r => setTimeout(r, 400)); // Latency simulation
      job.progress.currentPage = batch;
      job.metrics.pagesProcessed = batch;

      const itemsInBatch = Math.min(10, job.limit - job.results.length);
      for (let i = 0; i < itemsInBatch; i++) {
        job.progress.processedRecords++;
        const index = (batch - 1) * 10 + i;

        // Simulate duplicate every 7th record
        const isDup = index > 3 && index % 7 === 0;
        const effectiveIndex = isDup ? Math.max(0, index - 3) : index;

        const raw = job.category === 'companies'
          ? this._generateCompany(effectiveIndex, job.query)
          : this._generatePerson(effectiveIndex, job.query);

        const canonicalUrl = (raw.profileUrl || raw.companyUrl || '').toLowerCase();
        if (seenUrls.has(canonicalUrl)) {
          job.progress.duplicateRecords++;
          job.metrics.duplicates++;
          job.recentLogs.push({
            timestamp: new Date().toISOString(),
            level: 'debug',
            message: `Duplicate filtered: ${canonicalUrl}`
          });
          continue;
        }
        seenUrls.add(canonicalUrl);

        // Project strictly to selected fields
        const projected = { _id: `rec_${job.results.length + 1}` };
        for (const f of job.fields) {
          projected[f.key] = raw[f.key] !== undefined ? raw[f.key] : (f.isCustom ? '' : '');
        }

        job.results.push(projected);
        job.progress.uniqueRecords = job.results.length;
        job.metrics.unique = job.results.length;
        job.progress.percent = Math.min(100, Math.round((job.results.length / job.limit) * 100));

        if (job.results.length >= job.limit) break;
      }

      job.recentLogs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Processed page ${batch} (${job.results.length}/${job.limit} unique records collected)`
      });

      if (job.results.length >= job.limit) break;
    }

    job.status = 'completed';
    job.progress.percent = 100;
    job.recentLogs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Data collection completed! Total: ${job.results.length} unique records.`
    });
  }

  _generatePerson(index, query) {
    const names = ['Arjun Sharma', 'Priya Patel', 'Rohan Verma', 'Ananya Gupta', 'Vikram Iyer', 'Neha Reddy', 'Aditya Mehta', 'Sneha Kapoor'];
    const titles = ['Chief Technology Officer', 'VP of Engineering', 'Head of AI', 'Founder & CTO', 'Lead Architect'];
    const companies = ['ZeptoFin Labs', 'RazorPay Technologies', 'KreditEase AI', 'BharatSaaS Tech', 'HyperScale Cloud'];
    const locations = ['Bengaluru, Karnataka, India', 'Mumbai, Maharashtra, India', 'Gurugram, Haryana, India', 'Hyderabad, Telangana, India'];
    const stages = ['Series A ($12M)', 'Series B ($35M)', 'Seed ($2.5M)', 'Bootstrapped', 'Profitable'];

    const fullName = names[index % names.length] + (index >= names.length ? ` ${Math.floor(index / names.length) + 1}` : '');
    const slug = fullName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const comp = companies[index % companies.length];

    return {
      name: fullName,
      jobTitle: titles[index % titles.length],
      company: comp,
      location: locations[index % locations.length],
      profileUrl: `https://www.linkedin.com/in/${slug}`,
      companyWebsite: `https://www.${comp.toLowerCase().replace(/[^a-z0-9]/g, '')}.io`,
      industry: 'FinTech / Software',
      fundingStage: stages[index % stages.length]
    };
  }

  _generateCompany(index, query) {
    const companies = [
      { name: 'KreditEase AI', ind: 'Financial Services & AI Lending' },
      { name: 'PaySprint Gateway', ind: 'Payment Gateway & Banking APIs' },
      { name: 'NexusWealth Robo-Advisory', ind: 'WealthTech & Asset Management' },
      { name: 'InnoInsurTech India', ind: 'InsurTech & Risk Analytics' }
    ];
    const comp = companies[index % companies.length];
    const compName = comp.name + (index >= companies.length ? ` ${Math.floor(index / companies.length) + 1}` : '');
    const slug = compName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    return {
      companyName: compName,
      companyUrl: `https://www.linkedin.com/company/${slug}`,
      industry: comp.ind,
      employeeCount: '51-200 employees',
      location: 'Bengaluru, Karnataka, India',
      website: `https://www.${slug.replace(/[^a-z0-9]/g, '')}.com`,
      fundingStage: 'Series A ($8.5M)'
    };
  }

  exportClientData(records, fields, format) {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), recordCount: records.length, results: records }, null, 2)], { type: 'application/json' });
      this._downloadBlob(blob, `linkedin_research_${Date.now()}.json`);
      return;
    }

    if (format === 'csv') {
      const headers = fields.map(f => `"${(f.label || f.key).replace(/"/g, '""')}"`).join(',');
      const rows = records.map(row => {
        return fields.map(f => {
          const val = row[f.key] !== undefined && row[f.key] !== null ? String(row[f.key]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        }).join(',');
      });
      const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      this._downloadBlob(blob, `linkedin_research_${Date.now()}.csv`);
      return;
    }

    // Default XLSX / TSV fallback for browser
    const headers = fields.map(f => f.label || f.key).join('\t');
    const rows = records.map(row => fields.map(f => row[f.key] || '').join('\t'));
    const tsvContent = [headers, ...rows].join('\n');
    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel' });
    this._downloadBlob(blob, `linkedin_research_${Date.now()}.xls`);
  }

  _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const clientEngine = new ClientResearchEngine();
