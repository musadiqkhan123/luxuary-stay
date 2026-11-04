import api from './api.js';

export const getBookings = (params) => api.get('/bookings', { params });
export const getBooking = (id) => api.get(`/bookings/${id}`);
export const getTodayBoard = () => api.get('/bookings/today');
export const createBooking = (data) => api.post('/bookings', data);
export const updateBooking = (id, data) => api.put(`/bookings/${id}`, data);
export const cancelBooking = (id, data) => api.patch(`/bookings/${id}/cancel`, data);
export const checkIn = (id, data) => api.post(`/bookings/${id}/check-in`, data);
export const checkOut = (id, data) => api.post(`/bookings/${id}/check-out`, data);
export const getBill = (id) => api.get(`/bookings/${id}/bill`);
