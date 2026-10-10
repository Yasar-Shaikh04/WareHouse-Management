import api from './api';

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
  exportInventoryUrl: '/api/v1/reports/inventory/export',
  exportMovementsUrl: '/api/v1/reports/stock-movements/export',
  exportOrdersUrl: '/api/v1/reports/orders/export',
};
