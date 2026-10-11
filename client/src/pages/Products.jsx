import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { supplierService } from '../services/supplierService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const Products = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, hasPrev: false, hasNext: false });
  const [loading, setLoading] = useState(true);

  // Filters state from URL search params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const supplier = searchParams.get('supplier') || '';
  const stockStatus = searchParams.get('stockStatus') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ show: false, product: null, loading: false });

  const fetchFiltersData = async () => {
    try {
      const [catsRes, supsRes] = await Promise.all([
        categoryService.getAll(),
        supplierService.getAll(),
      ]);
      setCategories(catsRes.categories || []);
      setSuppliers(supsRes.suppliers || []);
    } catch (err) {
      console.error('Failed to load filter metadata:', err);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getAll({
        search,
        category,
        supplier,
        stockStatus,
        sortBy,
        sortOrder,
        page,
        limit: 10,
      });
      setProducts(res.products || []);
      setPagination(res.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      showToast(err.message || 'Failed to load products.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [search, category, supplier, stockStatus, sortBy, sortOrder, page, showToast]);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.product) return;
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await productService.delete(deleteModal.product._id);
      showToast(`Product '${deleteModal.product.name}' deleted successfully.`, 'success');
      setDeleteModal({ show: false, product: null, loading: false });
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to delete product.', 'danger');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const getStockStatus = (p) => {
    if (p.quantity === 0) return 'Out of Stock';
    if (p.quantity <= p.minStockLevel) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Products Catalog</h2>
          <p className="text-muted small mb-0">Manage inventory items, SKUs, pricing, and storage locations</p>
        </div>
        {hasRole('Admin', 'Warehouse Manager') && (
          <Link to="/products/new" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <i className="bi bi-plus-lg"></i> Add New Product
          </Link>
        )}
      </div>

      <div className="card wms-card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-12 col-md-3">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={(e) => updateParam('search', e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={category}
                onChange={(e) => updateParam('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={supplier}
                onChange={(e) => updateParam('supplier', e.target.value)}
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={stockStatus}
                onChange={(e) => updateParam('stockStatus', e.target.value)}
              >
                <option value="">All Stock Statuses</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock (Alert)</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            <div className="col-6 col-md-3 d-flex gap-1">
              <select
                className="form-select form-select-sm"
                value={sortBy}
                onChange={(e) => updateParam('sortBy', e.target.value)}
              >
                <option value="createdAt">Sort: Created Date</option>
                <option value="name">Sort: Name</option>
                <option value="sku">Sort: SKU</option>
                <option value="sellingPrice">Sort: Price</option>
                <option value="quantity">Sort: Stock Quantity</option>
              </select>
              <button
                className="btn btn-sm btn-outline-secondary"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                onClick={() => updateParam('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <i className={`bi bi-sort-${sortOrder === 'asc' ? 'down' : 'up'}`}></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card wms-card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Fetching products list..." />
          ) : products.length === 0 ? (
            <EmptyState
              icon="bi-box"
              title="No Products Found"
              message="No products match your current filters or none have been added yet."
              actionText={hasRole('Admin', 'Warehouse Manager') ? 'Add New Product' : null}
              onAction={() => setSearchParams({})}
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-secondary">
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Supplier</th>
                    <th>Prices (Cost / Sell)</th>
                    <th>Available Stock</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {products.map((p) => {
                    const status = getStockStatus(p);
                    return (
                      <tr key={p._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="rounded border object-fit-cover"
                                style={{ width: '42px', height: '42px' }}
                              />
                            ) : (
                              <div
                                className="rounded bg-light border d-flex align-items-center justify-content-center text-muted"
                                style={{ width: '42px', height: '42px' }}
                              >
                                <i className="bi bi-image"></i>
                              </div>
                            )}
                            <div>
                              <Link to={`/products/${p._id}`} className="fw-semibold text-dark text-decoration-none">
                                {p.name}
                              </Link>
                              <div className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                                SKU: {p.sku}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{p.category?.name || 'Unassigned'}</td>
                        <td>{p.supplier?.companyName || 'Unassigned'}</td>
                        <td>
                          <div>
                            <span className="text-muted">${p.purchasePrice?.toFixed(2)}</span> /{' '}
                            <span className="fw-semibold text-dark">${p.sellingPrice?.toFixed(2)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="fw-bold fs-6">{p.quantity}</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            Min: {p.minStockLevel}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">{p.location || 'Bay A-01'}</span>
                        </td>
                        <td>
                          <StatusBadge status={status} />
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm wms-action-group">
                            <Link to={`/products/${p._id}`} className="btn btn-outline-secondary" title="View Details">
                              <i className="bi bi-eye"></i>
                            </Link>
                            {hasRole('Admin', 'Warehouse Manager') && (
                              <Link to={`/products/${p._id}/edit`} className="btn btn-outline-primary" title="Edit">
                                <i className="bi bi-pencil"></i>
                              </Link>
                            )}
                            {hasRole('Admin') && (
                              <button
                                className="btn btn-outline-danger"
                                title="Delete Product"
                                onClick={() => setDeleteModal({ show: true, product: p, loading: false })}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card-footer bg-white border-0 py-3">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            hasPrev={pagination.hasPrev}
            hasNext={pagination.hasNext}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      <ConfirmModal
        show={deleteModal.show}
        title="Delete Product"
        message={`Are you sure you want to delete product "${deleteModal.product?.name}" (SKU: ${deleteModal.product?.sku})? This will also remove associated stock records.`}
        confirmText="Delete Product"
        confirmVariant="danger"
        loading={deleteModal.loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ show: false, product: null, loading: false })}
      />
    </div>
  );
};

export default Products;
