import React from 'react';

const LoadingSpinner = ({ text = 'Loading...', centered = true, size = '' }) => {
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center p-4">
      <div className={`spinner-border text-primary ${size ? `spinner-border-${size}` : ''}`} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && <span className="mt-2 text-muted small">{text}</span>}
    </div>
  );

  if (centered) {
    return <div className="w-100 d-flex justify-content-center my-5">{content}</div>;
  }

  return content;
};

export default LoadingSpinner;
