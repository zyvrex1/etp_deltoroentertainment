import { useState } from "react";
import Signup from "../../pages/Signup";

const SignupModal = ({ isOpen, onClose }) => {
  const [selectedRole, setSelectedRole] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedRole(null);
    onClose();
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        {/* Close button */}
        <button className="close-btn" onClick={handleClose}>
          ✕
        </button>

        {/* Role selection screen */}
        {!selectedRole && (
          <div className="role-options">
            <h3>Select Account Type</h3>

            <button onClick={() => setSelectedRole("admin")}>Admin</button>
            <button onClick={() => setSelectedRole("promoter")}>Promoter</button>
            <button onClick={() => setSelectedRole("sponsor")}>Sponsor</button>
            <button onClick={() => setSelectedRole("customer")}>Customer</button>
          </div>
        )}

        {/* Signup form screen */}
        {selectedRole && (
          <div className="signup-container">
            {/* Back button */}
            <button className="back-btn" onClick={handleBack}>
              ← Back
            </button>

            <h3>{selectedRole.toUpperCase()} Signup</h3>
            <Signup role={selectedRole} closeModal={handleClose} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupModal;