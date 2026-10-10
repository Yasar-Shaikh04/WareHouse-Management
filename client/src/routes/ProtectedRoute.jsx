import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Checking authentication status..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger shadow-sm border-0 d-inline-block text-start p-4 rounded-3" style={{ maxWidth: '600px' }}>
          <div className="d-flex align-items-center mb-3 text-danger">
            <i className="bi bi-shield-lock-fill fs-2 me-3"></i>
            <div>
              <h4 className="alert-heading mb-0 fw-bold">Access Restricted</h4>
              <p className="small mb-0">Role-based permission required</p>
            </div>
          </div>
          <p className="mb-2">
            Your current account role is <strong className="badge bg-secondary">{user.role}</strong>.
            This module requires one of the following roles: {allowedRoles.map(r => `<span class="badge bg-danger ms-1">${r}</span>`).join(' ')}
          </p>
          <hr />
          <div className="d-flex justify-content-end">
            <a href="/dashboard" className="btn btn-outline-danger btn-sm">
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
