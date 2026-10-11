import React, { useState, useEffect, useCallback } from 'react';
import { supplierService } from '../services/supplierService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const Suppliers = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Supplier Products View Modal
  const [viewSupplier, setViewSupplier] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ show: false, supplier: null, loading: false });

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supplierService.getAll(search);
      setSuppliers(res.suppliers || []);
    } catch (err) {
      showToast(err.message || 'Failed to load suppliers.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({ name: '', companyName: '', email: '', phone: '', address: '', gstin: '' });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      companyName: s.companyName,
      email: s.email,
      phone: s.phone,
      address: s.address,
      gstin: s.gstin || 'N/A',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenView = async (s) => {
    setViewSupplier(s);
    setLoadingProducts(true);
    try {
      const res = await supplierService.getById(s._id);
      setSupplierProducts(res.products || []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch supplier products.', 'danger');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      if (editingSupplier) {
        await supplierService.update(editingSupplier._id, formData);
        showToast('Supplier updated successfully!', 'success');
      } else {
        await supplierService.create(formData);
        showToast('Supplier created successfully!', 'success');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      setFormError(err.message || 'Failed to save supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.supplier) return;
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await supplierService.delete(deleteModal.supplier._id);
      showToast('Supplier deleted successfully.', 'success');
      setDeleteModal({ show: false, supplier: null, loading: false });
      fetchSuppliers();
    } catch (err) {
      showToast(err.message || 'Failed to delete supplier.', 'danger');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Suppliers & Vendors</h2>
          <p className="text-muted small mb-0">Manage authorized suppliers, trade contacts, and catalog offerings</p>
        </div>
        {hasRole('Admin', 'Warehouse Manager') && (
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm" onClick={handleOpenCreate}>
            <i className="bi bi-plus-lg"></i> Add New Supplier
          </button>
        )}
      </div>

      {/* Search Bar */}
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
                  placeholder="Search by company, contact, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="card wms-card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Fetching suppliers..." />
          ) : suppliers.length === 0 ? (
            <EmptyState
              icon="bi-truck"
              title="No Suppliers Found"
              message="No suppliers match your search or none have been added yet."
              actionText={hasRole('Admin', 'Warehouse Manager') ? 'Add First Supplier' : null}
              onAction={handleOpenCreate}
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-secondary">
                  <tr>
                    <th>Company Name</th>
                    <th>Contact Person</th>
                    <th>Email & Phone</th>
                    <th>Address</th>
                    <th>GSTIN / Tax ID</th>
                    <th>Products</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {suppliers.map((s) => (
                    <tr key={s._id}>
                      <td className="fw-semibold text-dark">{s.companyName}</td>
                      <td>{s.name}</td>
                      <td>
                        <div>
                          <a href={`mailto:${s.email}`} className="text-decoration-none">
                            {s.email}
                          </a>
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {s.phone}
                        </span>
                      </td>
                      <td className="text-muted" style={{ maxWidth: '200px' }}>
                        {s.address}
                      </td>
                      <td>
                        <span className="font-monospace text-muted small">{s.gstin || 'N/A'}</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-light border py-0 px-2 small"
                          onClick={() => handleOpenView(s)}
                          title="View Supplied Products"
                        >
                          <span className="fw-semibold text-primary">{s.productCount}</span> items
                        </button>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm wms-action-group">
                          <button
                            className="btn btn-outline-secondary"
                            title="View Details"
                            onClick={() => handleOpenView(s)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {hasRole('Admin', 'Warehouse Manager') && (
                            <button
                              className="btn btn-outline-primary"
                              title="Edit Supplier"
                              onClick={() => handleOpenEdit(s)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {hasRole('Admin') && (
                            <button
                              className="btn btn-outline-danger"
                              title="Delete Supplier"
                              onClick={() => setDeleteModal({ show: true, supplier: s, loading: false })}
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

      {/* Add / Edit Supplier Modal */}
      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow border-0 rounded-3">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-dark">
                    {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
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
                        <label className="form-label small fw-semibold text-secondary">Company Name *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Apex Industrial Solutions"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6 mb-2">
                        <label className="form-label small fw-semibold text-secondary">Contact Person *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Michael Vance"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6 mb-2">
                        <label className="form-label small fw-semibold text-secondary">Email *</label>
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          placeholder="vance@apexindustrial.com"
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
                          placeholder="+1-555-019-2831"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 mb-2">
                        <label className="form-label small fw-semibold text-secondary">Address *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Industrial park address, city, state"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 mb-2">
                        <label className="form-label small fw-semibold text-secondary">GSTIN / Tax ID (Optional)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. 07AAAAA0000A1Z5"
                          value={formData.gstin}
                          onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
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
                      {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>
        </>
      )}

      {/* View Supplier Products Modal */}
      {viewSupplier && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content shadow border-0 rounded-3">
                <div className="modal-header border-0 pb-0">
                  <div>
                    <h5 className="modal-title fw-bold text-dark">{viewSupplier.companyName}</h5>
                    <span className="small text-muted">
                      Supplied Catalog Items &bull; Contact: {viewSupplier.name} ({viewSupplier.phone})
                    </span>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setViewSupplier(null)}></button>
                </div>
                <div className="modal-body py-3">
                  {loadingProducts ? (
                    <LoadingSpinner text="Fetching catalog items..." />
                  ) : supplierProducts.length === 0 ? (
                    <p className="text-muted text-center py-4 mb-0">No products linked to this supplier yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 small">
                        <thead className="table-light">
                          <tr>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Cost / Sell Price</th>
                            <th>Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplierProducts.map((p) => (
                            <tr key={p._id}>
                              <td className="font-monospace text-primary fw-semibold">{p.sku}</td>
                              <td className="fw-semibold text-dark">{p.name}</td>
                              <td>{p.category?.name || 'Unassigned'}</td>
                              <td>
                                ${p.purchasePrice?.toFixed(2)} / ${p.sellingPrice?.toFixed(2)}
                              </td>
                              <td className="fw-bold">{p.quantity} units</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewSupplier(null)}>
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
        title="Delete Supplier"
        message={
          deleteModal.supplier?.productCount > 0
            ? `Warning: This supplier currently supplies ${deleteModal.supplier.productCount} product(s). Server referential integrity rules prevent deleting suppliers with active inventory catalog dependencies.`
            : `Are you sure you want to delete supplier "${deleteModal.supplier?.companyName}"?`
        }
        confirmText="Delete Supplier"
        confirmVariant="danger"
        loading={deleteModal.loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ show: false, supplier: null, loading: false })}
      />
    </div>
  );
};

export default Suppliers;
