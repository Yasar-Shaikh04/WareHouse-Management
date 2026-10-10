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

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-danger text-white';
      case 'Warehouse Manager':
        return 'bg-primary text-white';
      case 'Staff':
        return 'bg-success text-white';
      default:
        return 'bg-secondary text-white';
    }
  };

  return (
    <nav className="wms-navbar d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-sm btn-outline-secondary d-lg-none"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-5"></i>
        </button>
        <span className="fw-bold fs-5 text-dark d-none d-sm-inline">
          <i className="bi bi-boxes text-primary me-2"></i>
          Warehouse Management System
        </span>
      </div>

      <div className="d-flex align-items-center gap-3">
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
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}
              >
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="text-start d-none d-md-block lh-1">
                <div className="fw-semibold small">{user.name}</div>
                <span className={`badge ${getRoleBadge(user.role)} mt-0.5`} style={{ fontSize: '0.65rem' }}>
                  {user.role}
                </span>
              </div>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0" aria-labelledby="userMenuDropdown">
              <li>
                <div className="px-3 py-2 border-bottom">
                  <div className="fw-semibold">{user.name}</div>
                  <div className="small text-muted">{user.email}</div>
                  <span className={`badge ${getRoleBadge(user.role)} mt-1`}>{user.role}</span>
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
