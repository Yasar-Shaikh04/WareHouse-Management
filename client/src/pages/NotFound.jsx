import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3 text-center">
      <div className="card shadow-sm border-0 rounded-4 p-5" style={{ maxWidth: '480px' }}>
        <div className="text-primary mb-3">
          <i className="bi bi-compass fs-1"></i>
        </div>
        <h1 className="fw-bold display-4 text-dark mb-2">404</h1>
        <h4 className="fw-semibold text-secondary mb-2">Page Not Found</h4>
        <p className="text-muted small mb-4">
          The requested warehouse page or route does not exist. Please check the URL or return to the main dashboard.
        </p>
        <div>
          <Link to="/dashboard" className="btn btn-primary px-4 shadow-sm">
            <i className="bi bi-house-door me-1"></i> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
