import React from 'react';

const VARIANT_CLASS = {
  primary: 'wms-stat-icon-emerald',
  success: 'wms-stat-icon-emerald',
  info: 'wms-stat-icon-accent',
  secondary: 'wms-stat-icon-slate',
  warning: 'wms-stat-icon-warning',
  danger: 'wms-stat-icon-danger',
};

const StatCard = ({ title, value, icon, variant = 'primary', subtitle }) => {
  const iconClass = VARIANT_CLASS[variant] || VARIANT_CLASS.primary;

  return (
    <div className="card wms-stat-card h-100">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
          <span className="fw-semibold small text-uppercase" style={{ color: '#64716a', letterSpacing: '0.04em', fontSize: '0.7rem' }}>
            {title}
          </span>
          <div className={`wms-stat-icon-wrapper ${iconClass}`}>
            <i className={`bi ${icon}`}></i>
          </div>
        </div>
        <div className="fw-bold mb-0" style={{ fontSize: '1.45rem', color: '#171c1a', letterSpacing: '-0.02em' }}>
          {value !== undefined && value !== null ? value : '—'}
        </div>
        {subtitle && (
          <p className="small mb-0 mt-1" style={{ color: '#64716a' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
