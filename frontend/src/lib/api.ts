import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  signup: (email: string, password: string) =>
    api.post('/api/auth/signup', { email, password }),
  
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  getMe: () => api.get('/api/auth/me'),
};

export const casesApi = {
  list: () => api.get('/api/cases'),
  
  create: (case_name: string, description?: string) =>
    api.post('/api/cases', { case_name, description }),
  
  get: (id: string) => api.get(`/api/cases/${id}`),
};

export const documentsApi = {
  upload: (caseId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', caseId);
    
    return api.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  list: (caseId: string) => api.get(`/api/documents/${caseId}`),
  
  getStatus: (documentId: string) => api.get(`/api/documents/${documentId}/status`),
};

export const analysisApi = {
  runAnalysis: (caseId: string) => api.post(`/api/analysis/${caseId}/run`),
  
  getTimeline: (caseId: string) => api.get(`/api/analysis/${caseId}/timeline`),
  
  getContradictions: (caseId: string) => api.get(`/api/analysis/${caseId}/contradictions`),
  
  getImpeachment: (caseId: string) => api.get(`/api/analysis/${caseId}/impeachment`),
  
  getEvidence: (caseId: string) => api.get(`/api/analysis/${caseId}/evidence`),
  
  getDeposition: (caseId: string) => api.get(`/api/analysis/${caseId}/deposition`),
  
  getStrategy: (caseId: string) => api.get(`/api/analysis/${caseId}/strategy`),
};

export const searchApi = {
  search: (caseId: string, query: string, limit?: number) =>
    api.post('/api/search', { caseId, query, limit }),
};

export default api;
