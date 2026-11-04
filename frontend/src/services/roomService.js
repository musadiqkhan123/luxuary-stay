import api from './api.js';

export const getRooms = (params) => api.get('/rooms', { params });
export const getRoom = (id) => api.get(`/rooms/${id}`);
export const checkAvailability = (params) => api.get('/rooms/availability', { params });
export const createRoom = (data) => api.post('/rooms', data);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`);
export const updateRoomStatus = (id, status) => api.patch(`/rooms/${id}/status`, { status });
