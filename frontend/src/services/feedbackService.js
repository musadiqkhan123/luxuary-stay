import api from './api.js';

export const getPublicFeedback = () => api.get('/feedback/public');
export const getFeedback = (params) => api.get('/feedback', { params });
export const createFeedback = (data) => api.post('/feedback', data);
export const respondToFeedback = (id, message) => api.patch(`/feedback/${id}/respond`, { message });
export const publishFeedback = (id, isPublished) => api.patch(`/feedback/${id}/publish`, { isPublished });
