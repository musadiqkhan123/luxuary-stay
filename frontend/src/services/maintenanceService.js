import api from './api.js';

export const getMaintenance = (params) => api.get('/maintenance', { params });
export const reportIssue = (data) => api.post('/maintenance', data);
export const updateMaintenance = (id, data) => api.patch(`/maintenance/${id}`, data);
