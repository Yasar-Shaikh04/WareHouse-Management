import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportService } from '../services/reportService';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const COLORS = ['#10b981', '#39ff14', '#64716a', '#f59e0b', '#0d966c', '#171c1a'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await reportService.getDashboardStats();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard metrics..." />;
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-center justify-content-between">
        <div>
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
        <button className="btn btn-sm btn-outline-danger" onClick={fetchDashboard}>
          Retry
        </button>
      </div>
    );
  }

  const { stats, recentMovements, recentOrders, charts } = data || {};

  return (
    <div className="container-fluid px-0">
      {/* Page Header */}
      <div className="wms-page-heading d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h2 className="fw-bold mb-1">Operations Dashboard</h2>
          <p className="small mb-0" style={{ color: '#64716a' }}>
            Live inventory, order activity, and warehouse alerts from your database
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/inventory" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-clipboard-data me-1"></i> Inventory
          </Link>
          <Link to="/orders/new" className="btn btn-primary btn-sm">
            <i className="bi bi-plus-lg me-1"></i> New Order
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {stats?.lowStockProducts > 0 && (
        <div
          className="alert d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4"
          style={{ background: '#fef6e7', border: '1px solid #f0d9a0', color: '#171c1a' }}
        >
          <div className="d-flex align-items-start">
            <i className="bi bi-exclamation-triangle-fill me-3 mt-1" style={{ color: '#8a5a00' }}></i>
            <div>
              <strong className="d-block">Stock alert</strong>
              <span className="small" style={{ color: '#64716a' }}>
                {stats.lowStockProducts} product{stats.lowStockProducts === 1 ? '' : 's'} at or below minimum threshold.
              </span>
            </div>
          </div>
          <Link to="/products?stockStatus=low-stock" className="btn btn-sm btn-outline-secondary">
            Review stock
          </Link>
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Total Products"
            value={stats?.totalProducts}
            icon="bi-box-seam"
            variant="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Total Units"
            value={stats?.totalInventoryUnits}
            icon="bi-layers-fill"
            variant="info"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Suppliers"
            value={stats?.totalSuppliers}
            icon="bi-truck"
            variant="success"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Customers"
            value={stats?.totalCustomers}
            icon="bi-people-fill"
            variant="secondary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Low Stock"
            value={stats?.lowStockProducts}
            icon="bi-exclamation-circle"
            variant="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-2">
          <StatCard
            title="Pending Orders"
            value={stats?.pendingOrders}
            icon="bi-cart-check"
            variant="danger"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="row g-4 mb-4">
        {/* Monthly Activity Bar Chart */}
        <div className="col-12 col-lg-7">
          <div className="card wms-card h-100">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-semibold mb-0">Monthly order activity</h6>
              <span className="badge" style={{ background: '#eef2f0', color: '#64716a' }}>
                Live data
              </span>
            </div>
            <div className="card-body">
              <div style={{ width: '100%', height: 280 }}>
                {charts?.monthlyActivity?.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={charts.monthlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" stroke="#64716a" fontSize={12} />
                      <YAxis stroke="#64716a" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8e5' }}
                      />
                      <Legend />
                      <Bar dataKey="orders" fill="#10b981" name="Orders placed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                    No order activity recorded yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Inventory Distribution Pie Chart */}
        <div className="col-12 col-lg-5">
          <div className="card wms-card h-100">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-semibold mb-0">Stock by category</h6>
              <span className="badge" style={{ background: '#eef2f0', color: '#64716a' }}>
                Units
              </span>
            </div>
            <div className="card-body">
              <div style={{ width: '100%', height: 280 }}>
                {charts?.categoryDistribution?.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={charts.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="units"
                        nameKey="name"
                      >
                        {charts.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                    No category stock data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Stock Movements & Recent Orders */}
      <div className="row g-4">
        {/* Recent Stock Movements */}
        <div className="col-12 col-xl-6">
          <div className="card wms-card h-100">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-semibold mb-0">Recent stock activity</h6>
              <Link to="/stock-movements" className="btn btn-link btn-sm p-0 text-decoration-none" style={{ color: '#0d966c' }}>
                View all <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Type</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Stock (Prev &rarr; New)</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {recentMovements?.length > 0 ? (
                    recentMovements.map((m) => (
                      <tr key={m._id}>
                        <td>
                          <StatusBadge status={m.movementType} />
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{m.product?.name || 'Unknown'}</div>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {m.product?.sku}
                          </span>
                        </td>
                        <td className="fw-bold">{m.quantity}</td>
                        <td className="text-muted">
                          {m.previousStock} &rarr; <span className="fw-semibold text-dark">{m.newStock}</span>
                        </td>
                        <td className="text-muted">{new Date(m.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No recent stock movements recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="col-12 col-xl-6">
          <div className="card wms-card h-100">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-semibold mb-0">Recent orders</h6>
              <Link to="/orders" className="btn btn-link btn-sm p-0 text-decoration-none" style={{ color: '#0d966c' }}>
                View all <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {recentOrders?.length > 0 ? (
                    recentOrders.map((o) => (
                      <tr key={o._id}>
                        <td className="fw-bold" style={{ color: '#0d966c' }}>{o.orderNumber}</td>
                        <td>{o.customer?.name || 'Walk-in'}</td>
                        <td className="fw-semibold">${o.totalAmount?.toFixed(2)}</td>
                        <td>
                          <StatusBadge status={o.status} />
                        </td>
                        <td>
                          <Link to={`/orders/${o._id}`} className="btn btn-outline-secondary btn-sm">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No recent orders placed
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
