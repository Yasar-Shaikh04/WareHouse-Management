import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';
import { productService } from '../services/productService';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const StockMovements = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [movements, setMovements] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, hasPrev: false, hasNext: false });
  const [loading, setLoading] = useState(true);

  // Filters
  const productFilter = searchParams.get('product') || '';
  const typeFilter = searchParams.get('movementType') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product: '',
    movementType: 'IN',
    quantity: 1,
    reason: '',
    referenceNumber: '',
  });
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchProductsForSelect = async () => {
    try {
      const res = await productService.getAll({ limit: 100 });
      setProductsList(res.products || []);
    } catch (err) {
      console.error('Failed to load products for movement modal:', err);
    }
  };

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getMovements({
        product: productFilter,
        movementType: typeFilter,
        page,
        limit: 12,
      });
      setMovements(res.movements || []);
      setPagination(res.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      showToast(err.message || 'Failed to load stock movements.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [productFilter, typeFilter, page, showToast]);

  useEffect(() => {
    fetchProductsForSelect();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

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

  const handleOpenModal = () => {
    setFormData({
      product: productsList[0]?._id || '',
      movementType: 'IN',
      quantity: 1,
      reason: '',
      referenceNumber: '',
    });
    setSelectedProductDetails(productsList[0] || null);
    setFormError('');
    setShowModal(true);
  };

  const handleProductChange = (productId) => {
    const p = productsList.find((item) => item._id === productId);
    setSelectedProductDetails(p || null);
    setFormData((prev) => ({ ...prev, product: productId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    // Pre-check for OUT movement
    if (formData.movementType === 'OUT' && selectedProductDetails) {
      if (Number(formData.quantity) > selectedProductDetails.quantity) {
        setFormError(
          `Cannot deduct ${formData.quantity} units. Available stock is only ${selectedProductDetails.quantity}.`
        );
        setSubmitting(false);
        return;
      }
    }

    try {
      await inventoryService.recordMovement(formData);
      showToast('Stock movement recorded and inventory updated successfully!', 'success');
      setShowModal(false);
      fetchMovements();
      fetchProductsForSelect(); // refresh product quantities
    } catch (err) {
      setFormError(err.message || 'Failed to record stock movement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Stock Movements Log</h2>
          <p className="text-muted small mb-0">Complete audit trail of incoming, outgoing, and adjusted inventory</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm" onClick={handleOpenModal}>
            <i className="bi bi-plus-lg"></i> Record Stock Movement
          </button>
          <a
            href="/api/v1/reports/stock-movements/export"
            download
            className="btn btn-outline-secondary btn-sm"
          >
            <i className="bi bi-download me-1"></i> Export Movements CSV
          </a>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card wms-card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-12 col-md-5">
              <select
                className="form-select form-select-sm"
                value={productFilter}
                onChange={(e) => updateParam('product', e.target.value)}
              >
                <option value="">All Products</option>
                {productsList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={(e) => updateParam('movementType', e.target.value)}
              >
                <option value="">All Movement Types</option>
                <option value="IN">IN (Incoming Supply)</option>
                <option value="OUT">OUT (Outgoing / Dispatch)</option>
                <option value="ADJUSTMENT">ADJUSTMENT (Audit Reconciliation)</option>
              </select>
            </div>

            <div className="col-6 col-md-4 text-md-end">
              {(productFilter || typeFilter) && (
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setSearchParams({})}>
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="card wms-card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Fetching stock audit trail..." />
          ) : movements.length === 0 ? (
            <EmptyState
              icon="bi-arrow-left-right"
              title="No Movements Recorded"
              message="No movements match the criteria or no changes have occurred yet."
              actionText="Record First Movement"
              onAction={handleOpenModal}
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-secondary">
                  <tr>
                    <th>Type</th>
                    <th>Product & SKU</th>
                    <th>Qty</th>
                    <th>Previous Stock</th>
                    <th>New Stock</th>
                    <th>Reason</th>
                    <th>Reference #</th>
                    <th>Performed By</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {movements.map((m) => (
                    <tr key={m._id}>
                      <td>
                        <StatusBadge status={m.movementType} />
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{m.product?.name || 'Unknown Item'}</div>
                        <span className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                          {m.product?.sku}
                        </span>
                      </td>
                      <td className="fw-bold fs-6">{m.quantity}</td>
                      <td className="text-muted">{m.previousStock}</td>
                      <td className="fw-semibold text-dark">{m.newStock}</td>
                      <td className="text-muted" style={{ maxWidth: '240px' }}>
                        {m.reason}
                      </td>
                      <td>
                        <span className="font-monospace small text-primary">{m.referenceNumber || '—'}</span>
                      </td>
                      <td>{m.performedBy?.name || 'System Admin'}</td>
                      <td className="text-muted">{new Date(m.createdAt).toLocaleString()}</td>
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

      {/* Record Movement Modal */}
      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow border-0 rounded-3">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-dark">Record Stock Movement</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body py-3">
                    {formError && (
                      <div className="alert alert-danger py-2 small d-flex align-items-center mb-3">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        <div>{formError}</div>
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-secondary">Select Product *</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.product}
                        onChange={(e) => handleProductChange(e.target.value)}
                        required
                      >
                        {productsList.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} (SKU: {p.sku} | In Stock: {p.quantity})
                          </option>
                        ))}
                      </select>
                      {selectedProductDetails && (
                        <div className="small text-muted mt-1">
                          Current available quantity:{' '}
                          <strong className="text-dark">{selectedProductDetails.quantity} units</strong>
                        </div>
                      )}
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-secondary">Movement Type *</label>
                        <select
                          className="form-select form-select-sm"
                          value={formData.movementType}
                          onChange={(e) => setFormData({ ...formData, movementType: e.target.value })}
                        >
                          <option value="IN">IN (Stock Intake)</option>
                          <option value="OUT">OUT (Stock Dispatch)</option>
                          <option value="ADJUSTMENT">ADJUSTMENT (Audit / Correction)</option>
                        </select>
                      </div>

                      <div className="col-6">
                        <label className="form-label small fw-semibold text-secondary">Quantity *</label>
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-secondary">Reason / Description *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Received shipment PO-4091 or Audit reconciliation"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        required
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-secondary">Reference # (Optional)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. PO-9810 or DISPATCH-102"
                        value={formData.referenceNumber}
                        onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                      />
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
                      Record Movement
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>
        </>
      )}
    </div>
  );
};

export default StockMovements;
