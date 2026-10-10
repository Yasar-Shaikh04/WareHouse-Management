import api from './api';

export const supplierService = {
  getAll: async (search = '') => {
    const res = await api.get('/suppliers', { params: { search } });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/suppliers/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/suppliers', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/suppliers/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/suppliers/${id}`);
    return res.data;
  },
};
