import React from 'react';

const LoadingAdmin: React.FC<{ message?: string }> = ({ message = 'Đang tải dữ liệu Admin...' }) => {
  return (
    <div className="loading-admin-overlay">
      <div className="loading-admin-box">
        <div className="loading-spinner"></div>
        <p className="loading-message">{message}</p>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes fade {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingAdmin;
