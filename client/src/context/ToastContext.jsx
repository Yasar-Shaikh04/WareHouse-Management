import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', title = '') => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, title };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
      {/* Toast floating container */}
      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        {toasts.map((toast) => {
          const bgClass =
            toast.type === 'success'
              ? 'bg-success'
              : toast.type === 'danger' || toast.type === 'error'
              ? 'bg-danger text-white'
              : toast.type === 'warning'
              ? 'bg-warning text-dark'
              : 'bg-success';

          return (
            <div
              key={toast.id}
              className={`toast show mb-2 shadow border-0 ${bgClass}`}
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
            >
              <div className="d-flex align-items-center">
                <div className="toast-body flex-grow-1">
                  {toast.title && <strong className="d-block mb-1">{toast.title}</strong>}
                  <span>{toast.message}</span>
                </div>
                <button
                  type="button"
                  className={`btn-close me-2 m-auto ${
                    toast.type === 'danger' || toast.type === 'error' ? 'btn-close-white' : ''
                  }`}
                  onClick={() => removeToast(toast.id)}
                  aria-label="Close"
                ></button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
