import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const getDashboardCounts = () => API.get('/slots/dashboard-counts');
export const getAllSlots = (params) => API.get('/slots', { params });
export const updateSlotStatus = (id, status) => API.put(`/slots/${id}/status`, { status });
export const checkInVehicle = (sessionData) => API.post('/sessions/checkin', sessionData);
export const searchSession = (numberPlate) => API.get(`/sessions/search?numberPlate=${numberPlate}`);
export const seedSlots = () => API.post('/slots/seed');
export const checkOutVehicle = (sessionId) => API.put(`/sessions/checkout/${sessionId}`);