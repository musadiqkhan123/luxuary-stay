import api from './api.js';

export const getUsers = (params) => api.get('/users', { params });
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const setUserStatus = (id, isActive) => api.patch(`/users/${id}/status`, { isActive });
export const getPermissions = () => api.get('/users/permissions');
export const sendPasswordReset = (id) => api.post(`/users/${id}/send-reset`);
