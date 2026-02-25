import { useEffect } from "react";
import Login from "../../landingpage/Login";

const LoginModal = ({ isOpen, onClose }) => {

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null; // ✅ AFTER hooks

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <h3>Login</h3>
        <Login />
      </div>
    </div>
  );
};

export default LoginModal;