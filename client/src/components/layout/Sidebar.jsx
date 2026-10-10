import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'bi-grid-1x2-fill' },
    { label: 'Products', path: '/products', icon: 'bi-box-seam-fill' },
    { label: 'Categories', path: '/categories', icon: 'bi-tags-fill' },
    { label: 'Suppliers', path: '/suppliers', icon: 'bi-truck' },
    { label: 'Customers', path: '/customers', icon: 'bi-people-fill' },
    { label: 'Inventory Overview', path: '/inventory', icon: 'bi-clipboard-data-fill' },
    { label: 'Stock Movements', path: '/stock-movements', icon: 'bi-arrow-left-right' },
    { label: 'Orders', path: '/orders', icon: 'bi-cart-check-fill' },
    { label: 'Reports & Export', path: '/reports', icon: 'bi-file-earmark-bar-graph-fill' },
    { label: 'User Profile', path: '/profile', icon: 'bi-person-circle' },
  ];

  return (
    <>
      {isOpen && <div className="wms-sidebar-backdrop d-lg-none" onClick={onClose}></div>}
      <aside className={`wms-sidebar d-flex flex-column ${isOpen ? 'show' : ''}`}>
        <div className="wms-sidebar-header d-flex align-items-center justify-content-between">
          <Link to="/dashboard" className="text-white text-decoration-none d-flex align-items-center gap-2">
            <div className="bg-primary p-2 rounded-3 text-white d-flex align-items-center justify-content-center">
              <i className="bi bi-boxes fs-5"></i>
            </div>
            <div>
              <span className="fw-bold fs-6 tracking-wide">WMS PORTAL</span>
              <div className="text-secondary small" style={{ fontSize: '0.7rem' }}>
                Inventory Management
              </div>
            </div>
          </Link>
          <button className="btn btn-sm btn-link text-white d-lg-none p-0" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="p-3 flex-grow-1 overflow-auto">
          <div className="text-uppercase text-secondary small fw-bold px-3 mb-2" style={{ fontSize: '0.7rem' }}>
            Main Navigation
          </div>
          <nav className="nav flex-column">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className={`bi ${item.icon}`}></i>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-3 border-top border-secondary border-opacity-25 mt-auto">
          <div className="small text-secondary">Logged in as:</div>
          <div className="fw-semibold text-white text-truncate">{user?.name}</div>
          <div className="badge bg-primary bg-opacity-25 text-info border border-info border-opacity-25 mt-1 small">
            {user?.role}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
