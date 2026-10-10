import React from 'react';

const EmptyState = ({
  icon = 'bi-inbox',
  title = 'No records found',
  message = 'There are no items matching your criteria.',
  actionText,
  onAction,
}) => {
  return (
    <div className="text-center py-5 px-3">
      <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle p-4 mb-3 text-secondary">
        <i className={`bi ${icon} fs-1`}></i>
      </div>
      <h5 className="fw-semibold text-dark mb-1">{title}</h5>
      <p className="text-muted small mb-3 max-w-sm mx-auto">{message}</p>
      {actionText && onAction && (
        <button className="btn btn-primary btn-sm px-3" onClick={onAction}>
          <i className="bi bi-plus-lg me-1"></i> {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
