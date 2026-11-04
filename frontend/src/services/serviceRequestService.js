import api from './api.js';

export const getServiceRequests = (params) => api.get('/services', { params });
export const createServiceRequest = (data) => api.post('/services', data);
export const updateServiceRequest = (id, data) => api.patch(`/services/${id}`, data);
