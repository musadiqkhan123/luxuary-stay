import api from './api.js';

export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const updateMe = (data) => api.put('/auth/me', data);
export const changePassword = (data) => api.put('/auth/me/password', data);
export const exportMyData = () => api.get('/auth/me/export');
export const closeMyAccount = () => api.delete('/auth/me');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post(`/auth/reset-password/${token}`, { password });
