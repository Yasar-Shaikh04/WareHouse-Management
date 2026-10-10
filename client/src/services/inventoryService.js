import api from './api';

export const inventoryService = {
  getOverview: async () => {
    const res = await api.get('/inventory');
    return res.data;
  },
  getMovements: async (params = {}) => {
    const res = await api.get('/stock-movements', { params });
    return res.data;
  },
  recordMovement: async (data) => {
    const res = await api.post('/stock-movements', data);
    return res.data;
  },
};
