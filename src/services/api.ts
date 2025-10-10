// services/api.ts - GÜNCELLENMİŞ
import axios from 'axios';

const API_URL = 'https://erp-crm-aksandestek-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor - token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  verify: () => 
    api.get('/auth/verify'),
};

export const ticketsAPI = {
  getTickets: () => api.get('/tickets'),
  getTicket: (id: number) => api.get(`/tickets/${id}`),
  createTicket: (data: any) => api.post('/tickets', data),
  updateTicket: (id: number, data: any) => api.put(`/tickets/${id}`, data),
  deleteTicket: (id: number) => api.delete(`/tickets/${id}`),
  
  // Dosya işlemleri - TicketFilesTbl için
  uploadFiles: (ticketId: number, formData: FormData) =>
    api.post(`/tickets/${ticketId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getFiles: (ticketId: number) =>
    api.get(`/tickets/${ticketId}/files`),
  
  downloadFile: (fileId: number) =>
    api.get(`/tickets/files/download?fileId=${fileId}`, {
      responseType: 'blob'
    }),
  
  deleteFile: (fileId: number) =>
    api.delete(`/tickets/files/${fileId}`),
};

export const companiesAPI = {
  getCompanies: () => 
    api.get('/companies'),
};

// services/api.ts - DASHBOARD ENDPOINT EKLE
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const usersAPI = {
  getSupportUsers: () => 
    api.get('/users/support'),
  createUser: (data: any) => api.post('/users', data),
};

export const systemAPI = {
  getModules: () => 
    api.get('/modules'),
  
  getStatuses: () => 
    api.get('/statuses'),
  
  getPriorities: () => 
    api.get('/priorities'),
};

// API health check
export const healthCheck = () => api.get('/health');

export default api;