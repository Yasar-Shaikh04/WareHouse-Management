import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../services/customerService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const Customers = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    companyName: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Customer Order History Modal
  const [viewCustomer, setViewCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ show: false, customer: null, loading: false });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerService.getAll(search);
      setCustomers(res.customers || []);
    } catch (err) {
      showToast(err.message || 'Failed to load customers.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '', companyName: '' });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      companyName: c.companyName || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenOrders = async (c) => {
    setViewCustomer(c);
    setLoadingOrders(true);
    try {
      const res = await customerService.getById(c._id);
      setCustomerOrders(res.orders || []);
    } catch (err) {
      showToast(err.message || 'Failed to load order history.', 'danger');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer._id, formData);
        showToast('Customer updated successfully!', 'success');
      } else {
        await customerService.create(formData);
        showToast('Customer created successfully!', 'success');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      setFormError(err.message || 'Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.customer) return;
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await customerService.delete(deleteModal.customer._id);
      showToast('Customer deleted successfully.', 'success');
      setDeleteModal({ show: false, customer: null, loading: false });
      fetchCustomers();
    } catch (err) {
      showToast(err.message || 'Failed to delete customer.', 'danger');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Customers & Clients</h2>
          <p className="text-muted small mb-0">Manage customer accounts, delivery contacts, and purchase orders</p>
        </div>
        {hasRole('Admin', 'Warehouse Manager') && (
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm" onClick={handleOpenCreate}>
            <i className="bi bi-plus-lg"></i> Add New Customer
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="card wms-card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row">
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by customer name, company, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card wms-card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Fetching customers..." />
          ) : customers.length === 0 ? (
            <EmptyState
              icon="bi-people"
              title="No Customers Found"
              message="No customers match your search criteria or none have been added yet."
              actionText={hasRole('Admin', 'Warehouse Manager') ? 'Add First Customer' : null}
              onAction={handleOpenCreate}
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-secondary">
                  <tr>
                    <th>Customer Name</th>
                    <th>Company / Entity</th>
                    <th>Email & Phone</th>
                    <th>Delivery Address</th>
                    <th>Orders Placed</th>
                    <th>Total Spent</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {customers.map((c) => (
                    <tr key={c._id}>
                      <td className="fw-semibold text-dark">{c.name}</td>
                      <td>{c.companyName || <span className="text-muted">Individual</span>}</td>
                      <td>
                        <div>
                          <a href={`mailto:${c.email}`} className="text-decoration-none">
                            {c.email}
                          </a>
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {c.phone}
                        </span>
                      </td>
                      <td className="text-muted" style={{ maxWidth: '220px' }}>
                        {c.address}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-light border py-0 px-2 small"
                          onClick={() => handleOpenOrders(c)}
                        >
                          <span className="fw-semibold text-primary">{c.orderCount}</span> orders
                        </button>
                      </td>
                      <td className="fw-bold text-success">${c.totalSpent?.toFixed(2) || '0.00'}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            title="View Orders"
                            onClick={() => handleOpenOrders(c)}
                          >
                            <i className="bi bi-receipt"></i>
                          </button>
                          {hasRole('Admin', 'Warehouse Manager') && (
                            <button
                              className="btn btn-outline-primary"
                              title="Edit Customer"
                              onClick={() => handleOpenEdit(c)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {hasRole('Admin', 'Warehouse Manager') && (
                            <button
                              className="btn btn-outline-danger"
                              title="Delete Customer"
                              onClick={() => setDeleteModal({ show: true, customer: c, loading: false })}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow border-0 rounded-3">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-dark">
                    {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleFormSubmit}>
                  <div className="modal-body py-3">
                    {formError && (
                      <div className="alert alert-danger py-2 small d-flex align-items-center mb-3">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        <div>{formError}</div>
                      </div>
                    )}
                    <div className="row g-2">
                      <div className="col-12 col-md-6 mb-2">
                        <label className="form-label small fw-semibold text-secondary">Customer Name *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Marcus Brody"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6 mb-2">
                        <label className="form-label small fw-semibold text-secondary">Company Name (Optional)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Metro Distribution Hub"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-6 mb-2">
                        <label className="form-label small fw-semibold text-secondary">Email Address *</label>
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          placeholder="mbrody@metrohub.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6 mb-2">
                        <label className="form-label small fw-semibold text-secondary">Phone Number *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="+1-555-012-3489"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 mb-2">
                        <label className="form-label small fw-semibold text-secondary">Delivery Address *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Delivery address, city, state"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-0 pt-0">
                    <button
                      type="button"
                      className="btn btn-light border btn-sm"
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                      {submitting && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
                      {editingCustomer ? 'Save Changes' : 'Create Customer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>
        </>
      )}

      {/* Customer Order History Modal */}
      {viewCustomer && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content shadow border-0 rounded-3">
                <div className="modal-header border-0 pb-0">
                  <div>
                    <h5 className="modal-title fw-bold text-dark">{viewCustomer.name}</h5>
                    <span className="small text-muted">
                      {viewCustomer.companyName ? `${viewCustomer.companyName} • ` : ''}Order History & Invoices
                    </span>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setViewCustomer(null)}></button>
                </div>
                <div className="modal-body py-3">
                  {loadingOrders ? (
                    <LoadingSpinner text="Fetching order records..." />
                  ) : customerOrders.length === 0 ? (
                    <p className="text-muted text-center py-4 mb-0">No orders placed by this customer yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 small">
                        <thead className="table-light">
                          <tr>
                            <th>Order #</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerOrders.map((o) => (
                            <tr key={o._id}>
                              <td className="font-monospace text-primary fw-semibold">{o.orderNumber}</td>
                              <td className="text-muted">{new Date(o.orderDate || o.createdAt).toLocaleDateString()}</td>
                              <td>{o.items?.length || 0} product(s)</td>
                              <td className="fw-bold">${o.totalAmount?.toFixed(2)}</td>
                              <td>
                                <StatusBadge status={o.status} />
                              </td>
                              <td>
                                <Link
                                  to={`/orders/${o._id}`}
                                  className="btn btn-outline-secondary btn-sm py-0 px-2"
                                  onClick={() => setViewCustomer(null)}
                                >
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewCustomer(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        title="Delete Customer"
        message={
          deleteModal.customer?.orderCount > 0
            ? `Warning: Customer "${deleteModal.customer.name}" has ${deleteModal.customer.orderCount} existing order(s). Database integrity rules prevent deleting customer records with order dependencies.`
            : `Are you sure you want to delete customer "${deleteModal.customer?.name}"?`
        }
        confirmText="Delete Customer"
        confirmVariant="danger"
        loading={deleteModal.loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ show: false, customer: null, loading: false })}
      />
    </div>
  );
};

export default Customers;
