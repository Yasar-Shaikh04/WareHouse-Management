import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Reports = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(true);

  // Data states
  const [inventoryReport, setInventoryReport] = useState([]);
  const [lowStockReport, setLowStockReport] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [invRes, lowRes] = await Promise.all([
          reportService.getInventoryReport(),
          reportService.getLowStockReport(),
        ]);
        setInventoryReport(invRes.data || []);
        setLowStockReport(lowRes.products || []);
      } catch (err) {
        showToast(err.message || 'Failed to fetch report data.', 'danger');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [showToast]);

  const filteredInventory = inventoryReport.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLowStock = lowStockReport.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Reports & Data Exports</h2>
          <p className="text-muted small mb-0">Authorized warehouse inventory reports, low stock audits, and CSV export downloads</p>
        </div>
      </div>

      {/* CSV Export Quick Action Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card wms-card border-0 shadow-sm h-100">
            <div className="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <h6 className="fw-bold text-dark mb-1">Inventory Valuation</h6>
                <p className="text-muted small mb-0">Catalog, quantities & cost</p>
              </div>
              <a
                href={reportService.exportInventoryUrl}
                download
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
              >
                <i className="bi bi-file-earmark-spreadsheet"></i> CSV
              </a>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card wms-card border-0 shadow-sm h-100">
            <div className="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <h6 className="fw-bold text-dark mb-1">Stock Movement Audit</h6>
                <p className="text-muted small mb-0">IN, OUT, adjustments log</p>
              </div>
              <a
                href={reportService.exportMovementsUrl}
                download
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
              >
                <i className="bi bi-file-earmark-spreadsheet"></i> CSV
              </a>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card wms-card border-0 shadow-sm h-100">
            <div className="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <h6 className="fw-bold text-dark mb-1">Customer Orders Summary</h6>
                <p className="text-muted small mb-0">Order volume & revenues</p>
              </div>
              <a
                href={reportService.exportOrdersUrl}
                download
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
              >
                <i className="bi bi-file-earmark-spreadsheet"></i> CSV
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Report Tabs Card */}
      <div className="card wms-card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom p-3">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
            <ul className="nav nav-pills gap-2">
              <li className="nav-item">
                <button
                  className={`nav-link btn-sm ${activeTab === 'inventory' ? 'active' : ''}`}
                  onClick={() => setActiveTab('inventory')}
                >
                  <i className="bi bi-boxes me-1"></i> Current Inventory ({inventoryReport.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link btn-sm ${activeTab === 'lowStock' ? 'active' : ''}`}
                  onClick={() => setActiveTab('lowStock')}
                >
                  <i className="bi bi-exclamation-triangle-fill me-1"></i> Low Stock Alerts ({lowStockReport.length})
                </button>
              </li>
            </ul>

            <div style={{ maxWidth: '260px', width: '100%' }}>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Filter report..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner text="Compiling report tables..." />
          ) : activeTab === 'inventory' ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-secondary">
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Supplier</th>
                    <th>Qty</th>
                    <th>Cost Price</th>
                    <th>Sell Price</th>
                    <th>Inventory Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {filteredInventory.map((item, idx) => (
                    <tr key={idx}>
                      <td className="font-monospace text-primary fw-semibold">{item.sku}</td>
                      <td className="fw-semibold text-dark">{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.supplier}</td>
                      <td className="fw-bold">{item.quantity}</td>
                      <td>${item.purchasePrice?.toFixed(2)}</td>
                      <td>${item.sellingPrice?.toFixed(2)}</td>
                      <td className="fw-semibold text-dark">${item.inventoryValue?.toFixed(2)}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-secondary">
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Available Stock</th>
                    <th>Min Level</th>
                    <th>Deficit</th>
                    <th>Supplier Contact</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {filteredLowStock.map((p) => {
                    const deficit = p.minStockLevel - p.quantity;
                    return (
                      <tr key={p._id}>
                        <td className="font-monospace text-primary fw-semibold">{p.sku}</td>
                        <td className="fw-semibold text-dark">{p.name}</td>
                        <td className="fw-bold text-danger">{p.quantity} units</td>
                        <td>{p.minStockLevel} units</td>
                        <td>
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                            -{deficit} units
                          </span>
                        </td>
                        <td>
                          <div>{p.supplier?.companyName}</div>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {p.supplier?.phone}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">{p.location}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
