import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: 'bi-grid-1x2' }],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products', path: '/products', icon: 'bi-box-seam' },
      { label: 'Categories', path: '/categories', icon: 'bi-tags' },
    ],
  },
  {
    label: 'Partners',
    items: [
      { label: 'Suppliers', path: '/suppliers', icon: 'bi-truck' },
      { label: 'Customers', path: '/customers', icon: 'bi-people' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Inventory', path: '/inventory', icon: 'bi-clipboard-data' },
      { label: 'Stock Movements', path: '/stock-movements', icon: 'bi-arrow-left-right' },
      { label: 'Orders', path: '/orders', icon: 'bi-cart-check' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Reports', path: '/reports', icon: 'bi-file-earmark-bar-graph' },
      { label: 'Profile', path: '/profile', icon: 'bi-person-circle' },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  return (
    <>
      {isOpen && <div className="wms-sidebar-backdrop d-lg-none" onClick={onClose}></div>}
      <aside className={`wms-sidebar d-flex flex-column ${isOpen ? 'show' : ''}`}>
        <div className="wms-sidebar-header d-flex align-items-center justify-content-between">
          <Link to="/dashboard" className="text-white text-decoration-none d-flex align-items-center gap-2" onClick={onClose}>
            <div className="wms-brand-mark">
              <i className="bi bi-boxes"></i>
            </div>
            <div>
              <span className="fw-bold" style={{ fontSize: '0.95rem', letterSpacing: '0.02em' }}>
                WMS
              </span>
              <div className="small" style={{ fontSize: '0.7rem', color: '#8a968f' }}>
                Inventory Platform
              </div>
            </div>
          </Link>
          <button className="btn btn-sm btn-link text-white d-lg-none p-0" onClick={onClose} aria-label="Close navigation">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="py-2 flex-grow-1 overflow-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="wms-sidebar-nav-label nav-section-label">{section.label}</div>
              <nav className="nav flex-column mb-1">
                {section.items.map((item) => (
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
          ))}
        </div>

        <div className="p-3 mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="small" style={{ color: '#8a968f' }}>
            Signed in
          </div>
          <div className="fw-semibold text-white text-truncate">{user?.name}</div>
          <span
            className="badge mt-1"
            style={{
              background: 'rgba(16, 185, 129, 0.16)',
              color: '#6ee7b7',
              fontWeight: 600,
            }}
          >
            {user?.role}
          </span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
