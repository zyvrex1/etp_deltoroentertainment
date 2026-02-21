import { useState } from "react";
import Login from "../../pages/Login";

const LoginModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null; // don’t render if closed

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        {/* Close button */}
        <button className="close-btn" onClick={handleClose}>
          ✕
        </button>

        <h3>Login</h3>
        <Login /> {/* Reuse your existing Login form */}
      </div>
    </div>
  );
};

export default LoginModal;