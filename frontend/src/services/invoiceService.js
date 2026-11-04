import api from './api.js';

export const getInvoices = (params) => api.get('/invoices', { params });
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const addPayment = (id, data) => api.post(`/invoices/${id}/payments`, data);
