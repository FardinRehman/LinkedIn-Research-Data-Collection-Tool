import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const createJob = async (jobPayload) => {
  const response = await api.post('/jobs', jobPayload);
  return response.data;
};

export const getJobStatus = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}`);
  return response.data;
};

export const cancelJob = async (jobId) => {
  const response = await api.post(`/jobs/${jobId}/cancel`);
  return response.data;
};

export const getJobResults = async (jobId, { page = 1, limit = 25, search = '' } = {}) => {
  const response = await api.get(`/jobs/${jobId}/results`, {
    params: { page, limit, search }
  });
  return response.data;
};

export const getFailedRecords = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}/failed-records`);
  return response.data;
};

export const getProviders = async () => {
  const response = await api.get('/jobs/providers');
  return response.data;
};

export const getExportUrl = (jobId, format) => {
  return `/api/jobs/${jobId}/export/${format}`;
};

export default api;
