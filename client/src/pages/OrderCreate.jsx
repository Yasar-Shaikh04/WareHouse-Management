import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const OrderCreate = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product: '', quantity: 1, unitPrice: 0, subtotal: 0, availableStock: 0, name: '', sku: '' },
  ]);

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          customerService.getAll(),
          productService.getAll({ limit: 100 }),
        ]);
        setCustomers(custRes.customers || []);
        const prods = prodRes.products || [];
        setProducts(prods);

        if (prods.length > 0) {
          const first = prods[0];
          setOrderItems([
            {
              product: first._id,
              quantity: 1,
              unitPrice: first.sellingPrice,
              subtotal: first.sellingPrice,
              availableStock: first.quantity,
              name: first.name,
              sku: first.sku,
            },
          ]);
        }
      } catch (err) {
        showToast(err.message || 'Failed to initialize order creation form.', 'danger');
      } finally {
        setLoading(false);
      }
    };

    loadDependencies();
  }, [showToast]);

  const handleProductChange = (index, productId) => {
    const prod = products.find((p) => p._id === productId);
    if (!prod) return;

    setOrderItems((prev) => {
      const updated = [...prev];
      const qty = updated[index].quantity || 1;
      updated[index] = {
        ...updated[index],
        product: prod._id,
        name: prod.name,
        sku: prod.sku,
        availableStock: prod.quantity,
        unitPrice: prod.sellingPrice,
        subtotal: prod.sellingPrice * qty,
      };
      return updated;
    });
  };

  const handleQuantityChange = (index, qty) => {
    const validQty = Math.max(1, parseInt(qty, 10) || 1);
    setOrderItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      updated[index] = {
        ...item,
        quantity: validQty,
        subtotal: item.unitPrice * validQty,
      };
      return updated;
    });
  };

  const handlePriceChange = (index, price) => {
    const validPrice = Math.max(0, parseFloat(price) || 0);
    setOrderItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      updated[index] = {
        ...item,
        unitPrice: validPrice,
        subtotal: validPrice * item.quantity,
      };
      return updated;
    });
  };

  const addItemRow = () => {
    const first = products[0];
    if (!first) return;
    setOrderItems((prev) => [
      ...prev,
      {
        product: first._id,
        quantity: 1,
        unitPrice: first.sellingPrice,
        subtotal: first.sellingPrice,
        availableStock: first.quantity,
        name: first.name,
        sku: first.sku,
      },
    ]);
  };

  const removeItemRow = (index) => {
    if (orderItems.length <= 1) {
      showToast('An order must contain at least one item.', 'warning');
      return;
    }
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculatedTotal = orderItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setServerError('Please select a customer for this order.');
      return;
    }

    // Validate available inventory
    for (const item of orderItems) {
      if (item.quantity > item.availableStock) {
        setServerError(
          `Insufficient stock for "${item.name}". Requested: ${item.quantity}, Available in warehouse: ${item.availableStock}.`
        );
        return;
      }
    }

    setSubmitting(true);
    setServerError('');

    try {
      const payload = {
        customer: selectedCustomerId,
        notes,
        items: orderItems.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const res = await orderService.create(payload);
      showToast(`Order ${res.order.orderNumber} placed and stock deducted successfully!`, 'success');
      navigate(`/orders/${res.order._id}`);
    } catch (err) {
      setServerError(err.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading products and customer directory..." />;
  }

  return (
    <div className="container-fluid px-0" style={{ maxWidth: '980px' }}>
      <div className="mb-4">
        <Link to="/orders" className="text-decoration-none small text-muted mb-2 d-inline-block">
          <i className="bi bi-arrow-left me-1"></i> Back to Orders
        </Link>
        <h2 className="fw-bold text-dark mb-1">Create Customer Order</h2>
        <p className="text-muted small">Select customer, assemble items from warehouse catalog, and issue dispatch</p>
      </div>

      {serverError && (
        <div className="alert alert-danger py-2 small d-flex align-items-center mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{serverError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Customer Selection Card */}
        <div className="card wms-card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3 border-bottom">
            <h6 className="fw-bold mb-0">Customer & Delivery Information</h6>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">Select Customer *</label>
                <select
                  className="form-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                >
                  <option value="">Choose a customer...</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''} - {c.phone}
                    </option>
                  ))}
                </select>
                <div className="form-text small">
                  Need a new customer?{' '}
                  <Link to="/customers" target="_blank" className="text-decoration-none">
                    Register customer here
                  </Link>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">Order Notes / Shipping Memo</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Expedited freight via Bay 4, Dock 2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Table Card */}
        <div className="card wms-card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0">Line Items</h6>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={addItemRow}>
              <i className="bi bi-plus-lg me-1"></i> Add Another Item
            </button>
          </div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light small text-secondary">
                <tr>
                  <th style={{ width: '40%' }}>Product Selection</th>
                  <th style={{ width: '15%' }}>Available</th>
                  <th style={{ width: '15%' }}>Quantity</th>
                  <th style={{ width: '15%' }}>Unit Price ($)</th>
                  <th style={{ width: '15%' }}>Subtotal ($)</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={item.product}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        required
                      >
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${item.availableStock > 0 ? 'bg-light text-dark border' : 'bg-danger'}`}>
                        {item.availableStock} in stock
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max={item.availableStock || 99999}
                        className={`form-control form-control-sm ${
                          item.quantity > item.availableStock ? 'is-invalid border-danger' : ''
                        }`}
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control form-control-sm"
                        value={item.unitPrice}
                        onChange={(e) => handlePriceChange(idx, e.target.value)}
                        required
                      />
                    </td>
                    <td className="fw-semibold text-dark">${item.subtotal?.toFixed(2)}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-link text-danger p-0"
                        title="Remove Item"
                        onClick={() => removeItemRow(idx)}
                      >
                        <i className="bi bi-x-circle fs-5"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light border-top">
                <tr>
                  <td colSpan="4" className="text-end fw-bold py-3">
                    Order Total Amount:
                  </td>
                  <td colSpan="2" className="fw-bold fs-5 text-primary py-3">
                    ${calculatedTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end gap-2 mb-5">
          <Link to="/orders" className="btn btn-light border px-4">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary px-4 shadow-sm d-flex align-items-center gap-2"
            disabled={submitting}
          >
            {submitting && <span className="spinner-border spinner-border-sm" role="status"></span>}
            Submit Order & Deduct Stock
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderCreate;
