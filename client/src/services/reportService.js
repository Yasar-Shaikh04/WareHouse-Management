import api from './api';

// Export endpoints are opened directly by the browser (download links), so they
// must be absolute and use the same backend base URL as the Axios client
// (VITE_API_URL origin + /api/v1), not a hardcoded relative path.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const exportBase = `${API_URL}/api/v1/reports`;

export const reportService = {
  getDashboardStats: async () => {
    const res = await api.get('/reports/dashboard');
    return res.data;
  },
  getInventoryReport: async () => {
    const res = await api.get('/reports/inventory');
    return res.data;
  },
  getLowStockReport: async () => {
    const res = await api.get('/reports/low-stock');
    return res.data;
  },
  exportInventoryUrl: `${exportBase}/inventory/export`,
  exportMovementsUrl: `${exportBase}/stock-movements/export`,
  exportOrdersUrl: `${exportBase}/orders/export`,
};
