import React from 'react';

const ConfirmModal = ({
  show,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!show) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1060 }}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold text-dark">{title}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onCancel}
                disabled={loading}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body py-3">
              <p className="text-secondary mb-0">{message}</p>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-light border"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn-${confirmVariant} d-flex align-items-center`}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>
    </>
  );
};

export default ConfirmModal;
