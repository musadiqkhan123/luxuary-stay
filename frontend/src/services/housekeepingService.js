import api from './api.js';

export const getTasks = (params) => api.get('/housekeeping', { params });
export const getHousekeepers = () => api.get('/housekeeping/staff');
export const createTask = (data) => api.post('/housekeeping', data);
export const updateTask = (id, data) => api.patch(`/housekeeping/${id}`, data);
