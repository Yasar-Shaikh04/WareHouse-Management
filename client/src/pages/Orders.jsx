import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const Orders = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, hasPrev: false, hasNext: false });
  const [loading, setLoading] = useState(true);

  // Filters
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.getAll({
        search,
        status: statusFilter,
        page,
        limit: 10,
      });
      setOrders(res.orders || []);
      setPagination(res.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      showToast(err.message || 'Failed to load orders.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Customer Orders</h2>
          <p className="text-muted small mb-0">Track order fulfillment, dispatches, and inventory deduction lifecycle</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/orders/new" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <i className="bi bi-plus-lg"></i> Create New Order
          </Link>
          <a
            href="/api/v1/reports/orders/export"
            download
            className="btn btn-outline-secondary btn-sm"
          >
            <i className="bi bi-download me-1"></i> Export Orders CSV
          </a>
        </div>
      </div>

      {/* Filter and Search Card */}
      <div className="card wms-card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by Order #..."
                  value={search}
                  onChange={(e) => updateParam('search', e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => updateParam('status', e.target.value)}
              >
                <option value="">All Order Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="col-6 col-md-5 text-md-end">
              {(search || statusFilter) && (
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setSearchParams({})}>
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="card wms-card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Fetching customer orders..." />
          ) : orders.length === 0 ? (
            <EmptyState
              icon="bi-cart"
              title="No Orders Found"
              message="No orders match your current filters or none have been placed yet."
              actionText="Create New Order"
              onAction={() => setSearchParams({})}
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-secondary">
                  <tr>
                    <th>Order #</th>
                    <th>Customer Name</th>
                    <th>Items</th>
                    <th>Total Value</th>
                    <th>Order Status</th>
                    <th>Created By</th>
                    <th>Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td className="font-monospace fw-bold text-primary">{o.orderNumber}</td>
                      <td>
                        <div className="fw-semibold text-dark">{o.customer?.name || 'Walk-in'}</div>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {o.customer?.companyName || o.customer?.phone}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {o.items?.length || 0} line item(s)
                        </span>
                      </td>
                      <td className="fw-bold fs-6 text-dark">${o.totalAmount?.toFixed(2)}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td>{o.createdBy?.name || 'Staff'}</td>
                      <td className="text-muted">{new Date(o.orderDate || o.createdAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        <Link to={`/orders/${o._id}`} className="btn btn-outline-secondary btn-sm py-0 px-2">
                          View Invoice
                        </Link>
                      </td>
                    </tr>
                  ))}
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
            onPageChange={(p) => updateParam('page', p)}
          />
        </div>
      </div>
    </div>
  );
};

export default Orders;
