import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Status Change State
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Cancel order modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.getById(id);
      setOrder(res.order);
      setNewStatus(res.order.status);
    } catch (err) {
      showToast(err.message || 'Failed to load order invoice details.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await orderService.updateStatus(order._id, {
        status: newStatus,
        reason: statusReason,
      });
      showToast(`Order status updated to '${newStatus}'.`, 'success');
      setShowStatusModal(false);
      fetchOrder();
    } catch (err) {
      showToast(err.message || 'Failed to update order status.', 'danger');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    setCancelLoading(true);
    try {
      await orderService.updateStatus(order._id, {
        status: 'Cancelled',
        reason: 'Order cancelled via admin interface',
      });
      showToast('Order cancelled and reserved stock restored back to inventory!', 'success');
      setShowCancelModal(false);
      fetchOrder();
    } catch (err) {
      showToast(err.message || 'Failed to cancel order.', 'danger');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading invoice and order details..." />;
  }

  if (!order) {
    return (
      <div className="text-center py-5">
        <h4>Order Not Found</h4>
        <Link to="/orders" className="btn btn-primary btn-sm mt-2">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0" style={{ maxWidth: '960px' }}>
      {/* Top Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <Link to="/orders" className="text-decoration-none small text-muted mb-2 d-inline-block">
            <i className="bi bi-arrow-left me-1"></i> Back to Orders
          </Link>
          <div className="d-flex align-items-center gap-3">
            <h2 className="fw-bold text-dark font-monospace mb-0">{order.orderNumber}</h2>
            <StatusBadge status={order.status} />
          </div>
          <span className="text-muted small">
            Placed on {new Date(order.orderDate || order.createdAt).toLocaleDateString()} by{' '}
            <strong>{order.createdBy?.name || 'Staff'}</strong>
          </span>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i> Print Invoice
          </button>

          {hasRole('Admin', 'Warehouse Manager') && order.status !== 'Cancelled' && (
            <>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setNewStatus(order.status);
                  setStatusReason('');
                  setShowStatusModal(true);
                }}
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Update Status
              </button>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => setShowCancelModal(true)}
              >
                <i className="bi bi-x-circle me-1"></i> Cancel Order
              </button>
            </>
          )}
        </div>
      </div>

      {/* Invoice Card */}
      <div className="card wms-card border-0 shadow-sm mb-4">
        <div className="card-body p-4 p-md-5">
          {/* Header Info */}
          <div className="d-flex flex-column flex-sm-row justify-content-between pb-4 mb-4 border-bottom gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="bg-primary text-white p-2 rounded-3 d-inline-flex">
                  <i className="bi bi-boxes fs-4"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-0">WAREHOUSE MANAGEMENT SYSTEM</h5>
                  <span className="small text-muted">Official Dispatch & Shipping Invoice</span>
                </div>
              </div>
              <div className="small text-muted">Central Logistics Warehouse Hub</div>
            </div>

            <div className="text-sm-end">
              <div className="text-muted small">Invoice / Order #</div>
              <div className="fw-bold font-monospace fs-5 text-primary">{order.orderNumber}</div>
              <div className="text-muted small">
                Date: {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Customer & Billing Info */}
          <div className="row g-4 pb-4 mb-4 border-bottom">
            <div className="col-12 col-sm-6">
              <h6 className="fw-bold text-secondary text-uppercase small mb-2">Delivered To (Customer)</h6>
              <h5 className="fw-bold text-dark mb-1">{order.customer?.name}</h5>
              {order.customer?.companyName && (
                <div className="fw-semibold text-secondary mb-1">{order.customer.companyName}</div>
              )}
              <div className="text-muted small mb-1">{order.customer?.address}</div>
              <div className="text-muted small">
                Email: {order.customer?.email} &bull; Phone: {order.customer?.phone}
              </div>
            </div>

            <div className="col-12 col-sm-6 text-sm-end">
              <h6 className="fw-bold text-secondary text-uppercase small mb-2">Fulfillment Details</h6>
              <div className="small mb-1">
                <span className="text-muted">Order Status: </span>
                <StatusBadge status={order.status} />
              </div>
              <div className="small text-muted mb-1">
                Processed By: {order.createdBy?.name} ({order.createdBy?.role || 'Staff'})
              </div>
              {order.notes && (
                <div className="small mt-2 p-2 bg-light rounded text-start">
                  <strong>Memo / Notes:</strong> {order.notes}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="table-responsive mb-4">
            <table className="table align-middle mb-0">
              <thead className="table-light small text-secondary">
                <tr>
                  <th>Item #</th>
                  <th>Product Name & SKU</th>
                  <th className="text-end">Unit Price</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody className="small">
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="fw-semibold text-dark">{item.productName}</div>
                      <span className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                        SKU: {item.sku}
                      </span>
                    </td>
                    <td className="text-end">${item.unitPrice?.toFixed(2)}</td>
                    <td className="text-center fw-bold">{item.quantity}</td>
                    <td className="text-end fw-semibold text-dark">${item.subtotal?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light border-top">
                <tr>
                  <td colSpan="4" className="text-end fw-bold py-3 fs-6">
                    Total Order Value:
                  </td>
                  <td className="text-end fw-bold py-3 fs-5 text-primary">
                    ${order.totalAmount?.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Cancellation Notice if cancelled */}
          {order.status === 'Cancelled' && (
            <div className="alert alert-danger border-0 p-3 small mb-0">
              <i className="bi bi-info-circle-fill me-2"></i>
              <strong>Order Cancelled:</strong> The inventory units deducted for this order were automatically restored back to product catalog levels.
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow border-0 rounded-3">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-dark">Update Order Status</h5>
                  <button type="button" className="btn-close" onClick={() => setShowStatusModal(false)}></button>
                </div>
                <form onSubmit={handleStatusSubmit}>
                  <div className="modal-body py-3">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-secondary">New Status</label>
                      <select
                        className="form-select form-select-sm"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled (Restores stock)</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-secondary">Status Note / Reason</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Dispatched from Dock 2 or Verified payment"
                        value={statusReason}
                        onChange={(e) => setStatusReason(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-0 pt-0">
                    <button
                      type="button"
                      className="btn btn-light border btn-sm"
                      onClick={() => setShowStatusModal(false)}
                      disabled={updating}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={updating}>
                      {updating && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
                      Update Status
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>
        </>
      )}

      {/* Cancel Order Confirm Modal */}
      <ConfirmModal
        show={showCancelModal}
        title="Cancel Order"
        message={`Are you sure you want to cancel order "${order.orderNumber}"? All deducted inventory will be automatically restored back to the product catalog and recorded in the stock movements log.`}
        confirmText="Confirm Cancellation"
        confirmVariant="danger"
        loading={cancelLoading}
        onConfirm={handleCancelOrder}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
};

export default OrderDetails;
