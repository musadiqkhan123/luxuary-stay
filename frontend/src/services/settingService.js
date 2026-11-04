import api from './api.js';

export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);
export const applyRoomRates = () => api.post('/settings/apply-room-rates');
