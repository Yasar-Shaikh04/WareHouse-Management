import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  switch (status) {
    case 'In Stock':
      return (
        <span className="badge rounded-pill badge-in-stock px-2 py-1 fw-semibold">
          <i className="bi bi-check-circle-fill me-1"></i> In Stock
        </span>
      );
    case 'Low Stock':
      return (
        <span className="badge rounded-pill badge-low-stock px-2 py-1 fw-semibold">
          <i className="bi bi-exclamation-triangle-fill me-1"></i> Low Stock
        </span>
      );
    case 'Out of Stock':
      return (
        <span className="badge rounded-pill badge-out-of-stock px-2 py-1 fw-semibold">
          <i className="bi bi-x-circle-fill me-1"></i> Out of Stock
        </span>
      );

    case 'Pending':
      return (
        <span className="badge rounded-pill px-2 py-1 fw-semibold" style={{ background: '#fef6e7', color: '#8a5a00' }}>
          <i className="bi bi-hourglass-split me-1"></i> Pending
        </span>
      );
    case 'Processing':
      return (
        <span className="badge rounded-pill px-2 py-1 fw-semibold" style={{ background: '#e8f8f1', color: '#0b7a58' }}>
          <i className="bi bi-arrow-repeat me-1"></i> Processing
        </span>
      );
    case 'Completed':
      return (
        <span className="badge rounded-pill px-2 py-1 fw-semibold" style={{ background: '#10b981', color: '#171c1a' }}>
          <i className="bi bi-check-circle-fill me-1"></i> Completed
        </span>
      );
    case 'Cancelled':
      return (
        <span className="badge rounded-pill px-2 py-1 fw-semibold" style={{ background: '#fdecec', color: '#b42318' }}>
          <i className="bi bi-x-circle-fill me-1"></i> Cancelled
        </span>
      );

    case 'IN':
      return (
        <span className="badge fw-semibold" style={{ background: '#e8f8f1', color: '#0b7a58', border: '1px solid #b6ebd4' }}>
          IN
        </span>
      );
    case 'OUT':
      return (
        <span className="badge fw-semibold" style={{ background: '#fdecec', color: '#b42318', border: '1px solid #f5c2c0' }}>
          OUT
        </span>
      );
    case 'ADJUSTMENT':
      return (
        <span className="badge fw-semibold" style={{ background: '#eef2f0', color: '#3d4a44', border: '1px solid #e2e8e5' }}>
          ADJUSTMENT
        </span>
      );

    default:
      return (
        <span className="badge" style={{ background: '#eef2f0', color: '#3d4a44' }}>
          {status}
        </span>
      );
  }
};

export default StatusBadge;
