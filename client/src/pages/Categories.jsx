import React, { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const Categories = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal form state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ show: false, category: null, loading: false });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryService.getAll(search);
      setCategories(res.categories || []);
    } catch (err) {
      showToast(err.message || 'Failed to load categories.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (editingCategory) {
        await categoryService.update(editingCategory._id, formData);
        showToast('Category updated successfully!', 'success');
      } else {
        await categoryService.create(formData);
        showToast('Category created successfully!', 'success');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setFormError(err.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.category) return;
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await categoryService.delete(deleteModal.category._id);
      showToast('Category deleted successfully.', 'success');
      setDeleteModal({ show: false, category: null, loading: false });
      fetchCategories();
    } catch (err) {
      showToast(err.message || 'Failed to delete category.', 'danger');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Categories</h2>
          <p className="text-muted small mb-0">Organize products into distinct warehouse inventory groups</p>
        </div>
        {hasRole('Admin', 'Warehouse Manager') && (
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm" onClick={handleOpenCreate}>
            <i className="bi bi-plus-lg"></i> Add New Category
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
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="card wms-card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Fetching categories..." />
          ) : categories.length === 0 ? (
            <EmptyState
              icon="bi-tags"
              title="No Categories Found"
              message="No category matches your search or none have been created yet."
              actionText={hasRole('Admin', 'Warehouse Manager') ? 'Create First Category' : null}
              onAction={handleOpenCreate}
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-secondary">
                  <tr>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Linked Products</th>
                    <th>Created Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {categories.map((cat) => (
                    <tr key={cat._id}>
                      <td className="fw-semibold text-dark">{cat.name}</td>
                      <td className="text-muted" style={{ maxWidth: '350px' }}>
                        {cat.description || '—'}
                      </td>
                      <td>
                        <span className={`badge ${cat.productCount > 0 ? 'bg-primary' : 'bg-light text-muted border'}`}>
                          {cat.productCount} {cat.productCount === 1 ? 'Product' : 'Products'}
                        </span>
                      </td>
                      <td className="text-muted">{new Date(cat.createdAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {hasRole('Admin', 'Warehouse Manager') && (
                            <button
                              className="btn btn-outline-primary"
                              title="Edit Category"
                              onClick={() => handleOpenEdit(cat)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {hasRole('Admin') && (
                            <button
                              className="btn btn-outline-danger"
                              title="Delete Category"
                              onClick={() => setDeleteModal({ show: true, category: cat, loading: false })}
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

      {/* Create / Edit Category Modal */}
      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow border-0 rounded-3">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-dark">
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
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
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-secondary">Category Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Industrial Machinery"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-secondary">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Details about items belonging to this category..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer border-0 pt-0">
                    <button
                      type="button"
                      className="btn btn-light border"
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
                      {editingCategory ? 'Save Changes' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        title="Delete Category"
        message={
          deleteModal.category?.productCount > 0
            ? `Warning: This category currently has ${deleteModal.category.productCount} associated product(s). Server referential integrity rules prevent deleting categories with active products.`
            : `Are you sure you want to delete category "${deleteModal.category?.name}"?`
        }
        confirmText="Delete Category"
        confirmVariant="danger"
        loading={deleteModal.loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ show: false, category: null, loading: false })}
      />
    </div>
  );
};

export default Categories;
