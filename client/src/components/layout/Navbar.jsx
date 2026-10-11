import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'info');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <nav className="wms-navbar d-flex align-items-center justify-content-between gap-2">
      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-sm btn-outline-secondary d-lg-none"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-5"></i>
        </button>
        <div className="d-none d-sm-block">
          <div className="fw-bold" style={{ fontSize: '0.95rem', color: '#171c1a' }}>
            Warehouse Management
          </div>
          <div className="small d-none d-md-block" style={{ color: '#64716a', fontSize: '0.75rem' }}>
            Inventory, orders, and stock operations
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        {user && (
          <div className="dropdown">
            <button
              className="btn btn-sm btn-light border d-flex align-items-center gap-2 dropdown-toggle"
              type="button"
              id="userMenuDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: '30px',
                  height: '30px',
                  fontSize: '0.85rem',
                  background: 'rgba(16, 185, 129, 0.16)',
                  color: '#0d966c',
                }}
              >
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="text-start d-none d-md-block lh-1">
                <div className="fw-semibold small" style={{ color: '#171c1a' }}>
                  {user.name}
                </div>
                <span className="small" style={{ color: '#64716a', fontSize: '0.7rem' }}>
                  {user.role}
                </span>
              </div>
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuDropdown">
              <li>
                <div className="px-3 py-2" style={{ borderBottom: '1px solid #e2e8e5' }}>
                  <div className="fw-semibold">{user.name}</div>
                  <div className="small" style={{ color: '#64716a' }}>
                    {user.email}
                  </div>
                </div>
              </li>
              <li>
                <Link className="dropdown-item py-2" to="/profile">
                  <i className="bi bi-person me-2"></i> User Profile
                </Link>
              </li>
              <li>
                <hr className="dropdown-divider my-1" />
              </li>
              <li>
                <button className="dropdown-item text-danger py-2" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i> Logout
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
