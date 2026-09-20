import axios from 'axios';
import { clientEngine } from './clientProvider';

const api = axios.create({
  baseURL: '/api',
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let isBackendAvailable = null;

export const checkBackend = async () => {
  if (isBackendAvailable !== null) return isBackendAvailable;
  try {
    const res = await api.get('/health', { timeout: 1500 });
    isBackendAvailable = res.status === 200;
  } catch {
    isBackendAvailable = false;
  }
  return isBackendAvailable;
};

export const createJob = async (jobPayload) => {
  const hasBackend = await checkBackend();
  if (hasBackend) {
    try {
      const response = await api.post('/jobs', jobPayload);
      return response.data;
    } catch (err) {
      if (err.response) throw err;
    }
  }

  // Standalone client fallback (for GitHub Pages github.io)
  const clientJob = clientEngine.createJob(jobPayload);
  return { success: true, data: { jobId: clientJob.jobId, status: 'in_progress' } };
};

export const getJobStatus = async (jobId) => {
  const hasBackend = await checkBackend();
  if (hasBackend) {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      return response.data;
    } catch (err) {
      if (err.response) throw err;
    }
  }

  const job = clientEngine.getJob(jobId);
  if (!job) return { success: false, data: null };
  return {
    success: true,
    data: {
      id: job.id,
      query: job.query,
      limit: job.limit,
      fields: job.fields,
      status: job.status,
      progress: job.progress,
      metrics: job.metrics,
      recentLogs: job.recentLogs
    }
  };
};

export const cancelJob = async (jobId) => {
  const hasBackend = await checkBackend();
  if (hasBackend) {
    const response = await api.post(`/jobs/${jobId}/cancel`);
    return response.data;
  }
  const job = clientEngine.getJob(jobId);
  if (job) job.status = 'cancelled';
  return { success: true, message: 'Job cancelled' };
};

export const getJobResults = async (jobId, { page = 1, limit = 25, search = '' } = {}) => {
  const hasBackend = await checkBackend();
  if (hasBackend) {
    try {
      const response = await api.get(`/jobs/${jobId}/results`, {
        params: { page, limit, search }
      });
      return response.data;
    } catch (err) {
      if (err.response) throw err;
    }
  }

  const job = clientEngine.getJob(jobId);
  if (!job) return { success: true, data: { records: [], pagination: { total: 0 } } };

  let filtered = job.results;
  if (search) {
    filtered = filtered.filter(item => Object.values(item).some(v => v && String(v).toLowerCase().includes(search.toLowerCase())));
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const records = filtered.slice(start, start + limit);

  return {
    success: true,
    data: {
      jobId: job.id,
      query: job.query,
      fields: job.fields,
      records,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 }
    }
  };
};

export const getFailedRecords = async (jobId) => {
  const hasBackend = await checkBackend();
  if (hasBackend) {
    try {
      const response = await api.get(`/jobs/${jobId}/failed-records`);
      return response.data;
    } catch {
      return { success: true, data: { items: [] } };
    }
  }
  return { success: true, data: { items: [] } };
};

export const getProviders = async () => {
  const hasBackend = await checkBackend();
  if (hasBackend) {
    try {
      const response = await api.get('/jobs/providers');
      return response.data;
    } catch {
      // Fallback
    }
  }

  return {
    success: true,
    data: {
      activeProvider: 'simulation',
      providers: [
        {
          id: 'simulation',
          name: 'Client Simulation Engine',
          label: 'Data Source: Simulation (GitHub Pages)',
          isConfigured: true,
          status: 'connected'
        },
        {
          id: 'real',
          name: 'Authorized Real Provider',
          label: 'Data Source: Authorized Provider',
          isConfigured: false,
          status: 'not_configured',
          message: 'Backend server required for live API tokens.'
        }
      ]
    }
  };
};

export const getExportUrl = (jobId, format) => {
  return `/api/jobs/${jobId}/export/${format}`;
};

export const triggerExport = async (jobId, format, records, fields) => {
  const hasBackend = await checkBackend();
  if (hasBackend) {
    const url = getExportUrl(jobId, format);
    const link = document.createElement('a');
    link.href = url;
    link.download = `linkedin_research_${format}_${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Client-side direct file generator for GitHub Pages
  clientEngine.exportClientData(records, fields, format);
};

export default api;
