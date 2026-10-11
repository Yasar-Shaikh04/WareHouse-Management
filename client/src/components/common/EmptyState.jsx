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
      <div className="wms-empty-icon d-inline-flex align-items-center justify-content-center mb-3">
        <i className={`bi ${icon} fs-2`}></i>
      </div>
      <h5 className="fw-semibold mb-1">{title}</h5>
      <p className="small mb-3 mx-auto" style={{ color: '#64716a', maxWidth: '28rem' }}>
        {message}
      </p>
      {actionText && onAction && (
        <button className="btn btn-primary btn-sm px-3" onClick={onAction}>
          <i className="bi bi-plus-lg me-1"></i> {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
