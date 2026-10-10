import api from './api';

export const orderService = {
  getAll: async (params = {}) => {
    const res = await api.get('/orders', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/orders', data);
    return res.data;
  },
  updateStatus: async (id, statusData) => {
    const res = await api.patch(`/orders/${id}/status`, statusData);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/orders/${id}`);
    return res.data;
  },
};
