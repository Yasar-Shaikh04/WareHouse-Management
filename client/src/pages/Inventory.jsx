import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Inventory = () => {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getOverview();
      setData(res);
    } catch (err) {
      showToast(err.message || 'Failed to load inventory overview.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const summary = data?.summary || {};
  const inventoryList = data?.inventory || [];

  const filteredInventory = inventoryList.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Inventory Management</h2>
          <p className="text-muted small mb-0">Warehouse stock valuation, threshold monitoring, and storage bin allocation</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/stock-movements" className="btn btn-primary btn-sm">
            <i className="bi bi-arrow-left-right me-1"></i> Stock Movements Log
          </Link>
          <a
            href="/api/v1/reports/inventory/export"
            download
            className="btn btn-outline-secondary btn-sm"
          >
            <i className="bi bi-download me-1"></i> Export Inventory CSV
          </a>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Total Stock Units"
            value={summary.totalStockUnits}
            icon="bi-layers-fill"
            variant="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Total Valuation"
            value={`$${summary.totalPurchaseValuation ? summary.totalPurchaseValuation.toLocaleString() : '0'}`}
            icon="bi-cash-coin"
            variant="success"
            subtitle="Cost basis"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Retail Value"
            value={`$${summary.totalSellingValuation ? summary.totalSellingValuation.toLocaleString() : '0'}`}
            icon="bi-tag-fill"
            variant="info"
            subtitle="Selling value"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Catalog Items"
            value={summary.totalProducts}
            icon="bi-box-seam"
            variant="secondary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Low Stock"
            value={summary.lowStockCount}
            icon="bi-exclamation-triangle"
            variant="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Out of Stock"
            value={summary.outOfStockCount}
            icon="bi-x-circle"
            variant="danger"
          />
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="card wms-card border-0 shadow-sm">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
          <h6 className="fw-bold mb-0">Stock Health Status</h6>
          <div style={{ maxWidth: '280px', width: '100%' }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Computing inventory valuations..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-secondary">
                  <tr>
                    <th>Product & SKU</th>
                    <th>Category</th>
                    <th>Storage Bin</th>
                    <th>Available Stock</th>
                    <th>Min Level</th>
                    <th>Cost Value</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {filteredInventory.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <Link to={`/products/${item._id}`} className="fw-semibold text-dark text-decoration-none">
                          {item.name}
                        </Link>
                        <div className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                          {item.sku}
                        </div>
                      </td>
                      <td>{item.category?.name || 'Unassigned'}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{item.location}</span>
                      </td>
                      <td className="fw-bold fs-6">{item.quantity}</td>
                      <td className="text-muted">{item.minStockLevel}</td>
                      <td className="fw-semibold text-dark">${item.inventoryValue?.toFixed(2)}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="text-end">
                        <Link to={`/products/${item._id}`} className="btn btn-outline-secondary btn-sm py-0 px-2">
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
      </div>
    </div>
  );
};

export default Inventory;
