import React from 'react';

const StatCard = ({ title, value, icon, variant = 'primary', subtitle }) => {
  const bgBadge = `bg-${variant} bg-opacity-10 text-${variant}`;

  return (
    <div className="card wms-stat-card h-100 shadow-sm border-0">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="text-muted fw-semibold small text-uppercase tracking-wider">{title}</span>
          <div className={`wms-stat-icon-wrapper ${bgBadge}`}>
            <i className={`bi ${icon}`}></i>
          </div>
        </div>
        <h3 className="fw-bold mb-1">{value !== undefined && value !== null ? value : '-'}</h3>
        {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
