import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProductDetails = () => {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await productService.getById(id);
        setProduct(res.product);
        setMovements(res.recentMovements || []);
      } catch (err) {
        showToast(err.message || 'Failed to load product details.', 'danger');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, showToast]);

  if (loading) {
    return <LoadingSpinner text="Loading product profile..." />;
  }

  if (!product) {
    return (
      <div className="text-center py-5">
        <h4>Product Not Found</h4>
        <Link to="/products" className="btn btn-primary btn-sm mt-2">
          Back to Products
        </Link>
      </div>
    );
  }

  const stockStatus =
    product.quantity === 0
      ? 'Out of Stock'
      : product.quantity <= product.minStockLevel
      ? 'Low Stock'
      : 'In Stock';

  const profitMargin =
    product.purchasePrice > 0
      ? (((product.sellingPrice - product.purchasePrice) / product.purchasePrice) * 100).toFixed(1)
      : 0;

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-2">
        <div>
          <Link to="/products" className="text-decoration-none small text-muted mb-2 d-inline-block">
            <i className="bi bi-arrow-left me-1"></i> Back to Products
          </Link>
          <div className="d-flex align-items-center gap-3">
            <h2 className="fw-bold text-dark mb-0">{product.name}</h2>
            <StatusBadge status={stockStatus} />
          </div>
          <span className="text-muted font-monospace small">SKU: {product.sku}</span>
        </div>
        {hasRole('Admin', 'Warehouse Manager') && (
          <div className="d-flex gap-2">
            <Link to={`/products/${product._id}/edit`} className="btn btn-outline-primary btn-sm">
              <i className="bi bi-pencil me-1"></i> Edit Product
            </Link>
            <Link to="/stock-movements" className="btn btn-primary btn-sm">
              <i className="bi bi-arrow-left-right me-1"></i> Adjust Stock
            </Link>
          </div>
        )}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card wms-card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-sm-row gap-4 mb-4">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="rounded-3 border object-fit-cover shadow-sm"
                    style={{ width: '140px', height: '140px' }}
                  />
                ) : (
                  <div
                    className="rounded-3 bg-light border d-flex flex-column align-items-center justify-content-center text-muted"
                    style={{ width: '140px', height: '140px' }}
                  >
                    <i className="bi bi-image fs-1 mb-1"></i>
                    <span className="small">No Image</span>
                  </div>
                )}
                <div className="flex-grow-1">
                  <h6 className="fw-bold text-secondary text-uppercase small">Description</h6>
                  <p className="text-dark mb-3">
                    {product.description || 'No description provided for this item.'}
                  </p>
                  <div className="row g-2 small">
                    <div className="col-6">
                      <span className="text-muted">Warehouse Bin: </span>
                      <strong className="text-dark">{product.location || 'Bay A-01'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Category: </span>
                      <strong className="text-dark">{product.category?.name || 'Unassigned'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3 pt-3 border-top">
                <div className="col-6 col-md-3">
                  <div className="p-3 bg-light rounded-3 text-center">
                    <div className="text-muted small">Purchase Price</div>
                    <div className="fs-5 fw-bold text-dark">${product.purchasePrice?.toFixed(2)}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 bg-light rounded-3 text-center">
                    <div className="text-muted small">Selling Price</div>
                    <div className="fs-5 fw-bold text-primary">${product.sellingPrice?.toFixed(2)}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 bg-light rounded-3 text-center">
                    <div className="text-muted small">Margin</div>
                    <div className="fs-5 fw-bold text-success">+{profitMargin}%</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 bg-light rounded-3 text-center">
                    <div className="text-muted small">Available Units</div>
                    <div className="fs-5 fw-bold text-dark">{product.quantity}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card wms-card border-0 shadow-sm">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">Stock Audit Trail</h6>
              <span className="badge bg-light text-muted border">Latest 10 movements</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Prev &rarr; New</th>
                    <th>Reason</th>
                    <th>Performed By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length > 0 ? (
                    movements.map((m) => (
                      <tr key={m._id}>
                        <td>
                          <StatusBadge status={m.movementType} />
                        </td>
                        <td className="fw-bold">{m.quantity}</td>
                        <td className="text-muted">
                          {m.previousStock} &rarr; <span className="fw-semibold text-dark">{m.newStock}</span>
                        </td>
                        <td>{m.reason}</td>
                        <td>{m.performedBy?.name || 'System'}</td>
                        <td className="text-muted">{new Date(m.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-3 text-muted">
                        No recorded movements for this product yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card wms-card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3 border-bottom">
              <h6 className="fw-bold mb-0">Supplier Profile</h6>
            </div>
            <div className="card-body p-3">
              {product.supplier ? (
                <div>
                  <h6 className="fw-bold text-dark mb-1">{product.supplier.companyName}</h6>
                  <p className="small text-muted mb-3">Contact: {product.supplier.name}</p>
                  <ul className="list-unstyled small mb-0">
                    <li className="mb-2">
                      <i className="bi bi-envelope text-muted me-2"></i>
                      <a href={`mailto:${product.supplier.email}`} className="text-decoration-none">
                        {product.supplier.email}
                      </a>
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-telephone text-muted me-2"></i> {product.supplier.phone}
                    </li>
                    <li>
                      <i className="bi bi-geo-alt text-muted me-2"></i> {product.supplier.address}
                    </li>
                  </ul>
                </div>
              ) : (
                <span className="text-muted small">No supplier assigned</span>
              )}
            </div>
          </div>

          <div className="card wms-card border-0 shadow-sm">
            <div className="card-header bg-white py-3 border-bottom">
              <h6 className="fw-bold mb-0">Inventory Health</h6>
            </div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between mb-1 small">
                <span>Current Stock:</span>
                <strong>{product.quantity} units</strong>
              </div>
              <div className="d-flex justify-content-between mb-2 small text-muted">
                <span>Minimum Alert Threshold:</span>
                <span>{product.minStockLevel} units</span>
              </div>
              <div className="progress mb-3" style={{ height: '8px' }}>
                <div
                  className={`progress-bar ${
                    product.quantity === 0
                      ? 'bg-danger'
                      : product.quantity <= product.minStockLevel
                      ? 'bg-warning'
                      : 'bg-success'
                  }`}
                  style={{
                    width: `${Math.min(100, (product.quantity / (product.minStockLevel * 2 || 10)) * 100)}%`,
                  }}
                ></div>
              </div>
              <div className="small text-muted">
                {product.quantity === 0
                  ? 'Out of stock! Dispatch is blocked until restocked.'
                  : product.quantity <= product.minStockLevel
                  ? 'Item is currently low on stock. Consider ordering from supplier.'
                  : 'Stock is healthy above minimum safety threshold.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
