import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('renew_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const projectAPI = {
  list: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
  get: (id) => api.get(`/projects/${id}`),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const dataAPI = {
  uploadCSV: (projectId, formData) => api.post(`/data/upload/${projectId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  launchDemo: () => api.post('/data/demo'),
  getStats: (projectId) => api.get(`/data/stats/${projectId}`),
  getRecords: (projectId, params) => api.get(`/data/records/${projectId}`, { params }),
};

export const forecastAPI = {
  train: (projectId) => api.post(`/forecast/train/${projectId}`),
  generate: (projectId, data) => api.post(`/forecast/generate/${projectId}`, data || {}),
  getLatest: (projectId) => api.get(`/forecast/${projectId}`),
};

export const simulateAPI = {
  simulate: (projectId, data) => api.post(`/simulate/${projectId}`, data),
};

export const alertsAPI = {
  getAlerts: (projectId) => api.get(`/alerts/${projectId}`),
  resolveAlert: (alertId) => api.patch(`/alerts/${alertId}/resolve`),
};

export const copilotAPI = {
  chat: (data) => api.post('/copilot/chat', data),
};

export default api;
