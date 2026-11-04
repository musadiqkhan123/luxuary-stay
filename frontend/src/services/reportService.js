import api from './api.js';

export const getDashboard = () => api.get('/reports/dashboard');
export const getAnalytics = (days) => api.get('/reports/analytics', { params: { days } });
