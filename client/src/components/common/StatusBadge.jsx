import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  switch (status) {
    // Stock Statuses
    case 'In Stock':
      return (
        <span className="badge rounded-pill badge-in-stock px-2.5 py-1.5 fw-semibold">
          <i className="bi bi-check-circle-fill me-1"></i> In Stock
        </span>
      );
    case 'Low Stock':
      return (
        <span className="badge rounded-pill badge-low-stock px-2.5 py-1.5 fw-semibold">
          <i className="bi bi-exclamation-triangle-fill me-1"></i> Low Stock
        </span>
      );
    case 'Out of Stock':
      return (
        <span className="badge rounded-pill badge-out-of-stock px-2.5 py-1.5 fw-semibold">
          <i className="bi bi-x-circle-fill me-1"></i> Out of Stock
        </span>
      );

    // Order Statuses
    case 'Pending':
      return (
        <span className="badge rounded-pill bg-warning text-dark px-2.5 py-1.5 fw-semibold">
          <i className="bi bi-hourglass-split me-1"></i> Pending
        </span>
      );
    case 'Processing':
      return (
        <span className="badge rounded-pill bg-primary text-white px-2.5 py-1.5 fw-semibold">
          <i className="bi bi-arrow-repeat me-1"></i> Processing
        </span>
      );
    case 'Completed':
      return (
        <span className="badge rounded-pill bg-success text-white px-2.5 py-1.5 fw-semibold">
          <i className="bi bi-check-circle-fill me-1"></i> Completed
        </span>
      );
    case 'Cancelled':
      return (
        <span className="badge rounded-pill bg-danger text-white px-2.5 py-1.5 fw-semibold">
          <i className="bi bi-x-circle-fill me-1"></i> Cancelled
        </span>
      );

    // Stock Movement Types
    case 'IN':
      return <span className="badge bg-success bg-opacity-25 text-success border border-success fw-bold">IN</span>;
    case 'OUT':
      return <span className="badge bg-danger bg-opacity-25 text-danger border border-danger fw-bold">OUT</span>;
    case 'ADJUSTMENT':
      return <span className="badge bg-info bg-opacity-25 text-info border border-info fw-bold">ADJUSTMENT</span>;

    default:
      return <span className="badge bg-secondary">{status}</span>;
  }
};

export default StatusBadge;
