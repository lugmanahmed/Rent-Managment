import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('API Request - Token:', token ? 'Present' : 'Missing');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status, response.data);
    return response;
  },
  (error) => {
    console.log('API Error:', error.config?.url, error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please wait before making more requests.');
      // Don't automatically retry 429 errors
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Properties API
export const propertiesAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  create: (propertyData) => api.post('/properties', propertyData),
  update: (id, propertyData) => api.put(`/properties/${id}`, propertyData),
  delete: (id) => api.delete(`/properties/${id}`),
  getTenants: (id) => api.get(`/properties/${id}/tenants`),
  getPayments: (id) => api.get(`/properties/${id}/payments`),
};

// Tenants API
export const tenantsAPI = {
  getAll: (params) => api.get('/tenants', { params }),
  getById: (id) => api.get(`/tenants/${id}`),
  create: (tenantData) => api.post('/tenants', tenantData),
  update: (id, tenantData) => api.put(`/tenants/${id}`, tenantData),
  delete: (id) => api.delete(`/tenants/${id}`),
  addNote: (id, note) => api.post(`/tenants/${id}/notes`, { text: note }),
  getPayments: (id) => api.get(`/tenants/${id}/payments`),
  getByRentalUnit: (unitId) => api.get(`/tenants?rentalUnit=${unitId}`)
};

// Payments API
export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (paymentData) => api.post('/payments', paymentData),
  update: (id, paymentData) => api.put(`/payments/${id}`, paymentData),
  delete: (id) => api.delete(`/payments/${id}`),
  markPaid: (id, data) => api.post(`/payments/${id}/mark-paid`, data),
  getOverdue: () => api.get('/payments/overdue'),
};

// Assets API
export const assetsAPI = {
  getAll: (params) => api.get('/assets', { params }),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
  getCategories: () => api.get('/assets/categories'),
  getStats: () => api.get('/assets/stats'),
  recordMaintenance: (id, data) => api.post(`/assets/${id}/maintenance`, data),
  getByProperty: (propertyId) => api.get(`/assets/property/${propertyId}`),
};

// Maintenance API
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (requestData) => api.post('/maintenance', requestData),
  update: (id, requestData) => api.put(`/maintenance/${id}`, requestData),
  delete: (id) => api.delete(`/maintenance/${id}`),
  addNote: (id, note) => api.post(`/maintenance/${id}/notes`, { text: note }),
  getUrgent: () => api.get('/maintenance/urgent'),
  getByProperty: (propertyId) => api.get(`/maintenance/property/${propertyId}`),
};

// Reports API
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getIncome: (params) => api.get('/reports/income', { params }),
  getMaintenance: (params) => api.get('/reports/maintenance', { params }),
  getOccupancy: () => api.get('/reports/occupancy'),
};

// Companies API
export const companiesAPI = {
  getAll: () => api.get('/companies'),
  getById: (id) => api.get(`/companies/${id}`),
  create: (companyData) => api.post('/companies', companyData),
  update: (id, companyData) => api.put(`/companies/${id}`, companyData),
  delete: (id) => api.delete(`/companies/${id}`),
};

// Rental Units API
export const rentalUnitsAPI = {
  getAll: (params) => api.get('/rental-units', { params }),
  getById: (id) => api.get(`/rental-units/${id}`),
  create: (unitData) => api.post('/rental-units', unitData),
  update: (id, unitData) => api.put(`/rental-units/${id}`, unitData),
  delete: (id) => api.delete(`/rental-units/${id}`),
  getByProperty: (propertyId) => api.get(`/rental-units/property/${propertyId}`),
  getCapacityInfo: (propertyId) => api.get(`/rental-units/property/${propertyId}/capacity`),
  addAsset: (unitId, assetId) => api.post(`/rental-units/${unitId}/assets`, { assetId }),
  removeAsset: (unitId, assetId) => api.delete(`/rental-units/${unitId}/assets/${assetId}`),
  updateAssetStatus: (unitId, assetId, status, issueNotes) => 
    api.put(`/rental-units/${unitId}/assets/${assetId}/status`, { status, issueNotes }),
  getFaultyAssets: () => api.get('/rental-units/faulty-assets'),
  updateAsset: (unitId, assetId, assetData) => 
    api.put(`/rental-units/${unitId}/assets/${assetId}`, assetData),
  fixStatus: () => api.post('/rental-units/fix-status'),
  debugAll: () => api.get('/rental-units/debug/all'),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (settingsData) => api.put('/settings', settingsData),
  getDropdowns: () => api.get('/settings/dropdowns'),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (invoiceData) => api.post('/invoices', invoiceData),
  update: (id, invoiceData) => api.put(`/invoices/${id}`, invoiceData),
  delete: (id) => api.delete(`/invoices/${id}`),
  generateRent: (data) => api.post('/invoices/generate-rent', data),
  getOverdue: () => api.get('/invoices/overdue'),
  search: (query) => api.get('/invoices', { params: { search: query } }),
  downloadPDF: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  sendEmail: (id) => api.post(`/invoices/${id}/send-email`),
  triggerMonthlyGeneration: () => api.post('/invoices/trigger-monthly-generation'),
  getCronStatus: () => api.get('/invoices/cron-status'),
  getOccupiedUnitsCount: () => api.get('/invoices/occupied-units-count'),
};

// Payment Types API
export const paymentTypesAPI = {
  getAll: () => api.get('/payment-types'),
  getAllIncludingInactive: () => api.get('/payment-types/all'),
  getById: (id) => api.get(`/payment-types/${id}`),
  create: (paymentTypeData) => api.post('/payment-types', paymentTypeData),
  update: (id, paymentTypeData) => api.put(`/payment-types/${id}`, paymentTypeData),
  delete: (id) => api.delete(`/payment-types/${id}`),
  reorder: (paymentTypes) => api.post('/payment-types/reorder', { paymentTypes }),
};

// Currencies API
export const currenciesAPI = {
  getAll: () => api.get('/currencies'),
  getAllIncludingInactive: () => api.get('/currencies/all'),
  getDefault: () => api.get('/currencies/default'),
  getById: (id) => api.get(`/currencies/${id}`),
  create: (currencyData) => api.post('/currencies', currencyData),
  update: (id, currencyData) => api.put(`/currencies/${id}`, currencyData),
  delete: (id) => api.delete(`/currencies/${id}`),
  reorder: (currencies) => api.post('/currencies/reorder', { currencies }),
  setDefault: (id) => api.post(`/currencies/${id}/set-default`),
};

// Payment Modes API
export const paymentModesAPI = {
  getAll: () => api.get('/payment-modes'),
  getAllIncludingInactive: () => api.get('/payment-modes/all'),
  getById: (id) => api.get(`/payment-modes/${id}`),
  create: (paymentModeData) => api.post('/payment-modes', paymentModeData),
  update: (id, paymentModeData) => api.put(`/payment-modes/${id}`, paymentModeData),
  delete: (id) => api.delete(`/payment-modes/${id}`),
  reorder: (paymentModes) => api.post('/payment-modes/reorder', { paymentModes }),
};

// Roles API
export const rolesAPI = {
  getAll: () => api.get('/roles'),
  getAllIncludingInactive: () => api.get('/roles/all'),
  getById: (id) => api.get(`/roles/${id}`),
  create: (roleData) => api.post('/roles', roleData),
  update: (id, roleData) => api.put(`/roles/${id}`, roleData),
  delete: (id) => api.delete(`/roles/${id}`),
  getUsers: (id) => api.get(`/roles/${id}/users`),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getActive: () => api.get('/users/active'),
  getOnline: () => api.get('/users/online'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, newPassword) => api.post(`/users/${id}/reset-password`, { newPassword }),
  toggleStatus: (id) => api.post(`/users/${id}/toggle-status`),
  endSession: (id) => api.post(`/users/${id}/end-session`),
};

// Payment Records API
export const paymentRecordsAPI = {
  getAll: (params) => api.get('/payment-records', { params }),
  getById: (id) => api.get(`/payment-records/${id}`),
  create: (paymentRecordData) => api.post('/payment-records', paymentRecordData),
  update: (id, paymentRecordData) => api.put(`/payment-records/${id}`, paymentRecordData),
  delete: (id) => api.delete(`/payment-records/${id}`),
  getByUnit: (unitId) => api.get(`/payment-records/unit/${unitId}`),
  getSummary: () => api.get('/payment-records/summary'),
};


export default api;
