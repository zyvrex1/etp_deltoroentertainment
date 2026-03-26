import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { showSuccessAlert, showCancelConfirmAlert, showErrorAlert, showCreateConfirmAlert } from "../utils/sweetAlert";
import './ManagePolicyModal.css';

const CreatePolicyModal = ({
  isOpen,
  onClose,
  onSave,
  existingPolicies = [],
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const usedKeys = existingPolicies.map((p) => p.policyKey);
  const availableKeys = ["tos", "privacy", "refund", "cp", "guidelines", "sponsor"].filter(
    (key) => !usedKeys.includes(key),
  );

  // Only set initial policyKey once when modal opens
  const [policyKey, setPolicyKey] = useState(availableKeys[0] || "");

  useEffect(() => {
    if (isOpen) {
      setPolicyKey(availableKeys[0] || "");
    }
  }, [isOpen, availableKeys[0]]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!policyKey) {
      showErrorAlert("Error", "All policy keys are already used");
      return;
    }

    const result = await showCreateConfirmAlert(
      "Add Policy?",
      `Are you sure you want to add the "${title}" policy?`
    );

    if (!result.isConfirmed) return;

    try {
      const newPolicy = { title, content, policyKey };

      // Pass the policy object back to parent to handle save
      await onSave(newPolicy);

      onClose();
      showSuccessAlert(
        "Policy Added",
        "The policy has been added successfully.",
      );

      // Reset form
      setTitle("");
      setContent("");
    } catch (error) {
      console.error("Error adding policy:", error);
      showErrorAlert("Error", error.message);
    }
  };

  const handleCancel = async () => {
    const hasChanges = title || content;
    if (hasChanges) {
      const result = await showCancelConfirmAlert();
      if (result.isConfirmed) onClose();
    } else {
      onClose();
    }
  };

  const policyLabel = (key) =>
    key === "tos"
      ? "Terms of Service"
      : key === "privacy"
        ? "Privacy Policy"
        : "Refund Policy";

  return (
    <div className="general-modal-overlay">
      <div className="general-announcement-modal-container">
        <div className="general-modal-header">
          <h3>Add New Policy</h3>
          <button type="button" className="close-btn" onClick={handleCancel}>
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div className="modal-body">
          <form className="create-announcement-form" onSubmit={handleSubmit}>
            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <h6>Policy Key</h6>
                {availableKeys.length === 0 ? (
                  <p>All policy keys are already used.</p>
                ) : (
                  <select
                    value={policyKey}
                    onChange={(e) => setPolicyKey(e.target.value)}
                    required
                  >
                    {["tos", "privacy", "refund", "cp", "guidelines", "sponsor"].map((key) => (
                      <option
                        key={key}
                        value={key}
                        disabled={existingPolicies.some((p) => p.policyKey === key)} // disable if already used
                      >
                        {key === "tos"
                          ? "Terms of Service"
                          : key === "privacy"
                            ? "Privacy Policy"
                            : key === "refund"
                              ? "Refund Policy"
                              : key === "cp"
                                ? "Cookie Policy"
                                : key === "guidelines"
                                  ? "Event Guidelines"
                                  : "Sponsor Agreement"}{" "}
                        {existingPolicies.some((p) => p.policyKey === key)
                          ? "(Already used)"
                          : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="announcement-form-group">
                <h6>Publish Date</h6>
                <input
                  type="date"
                  value={(() => {
                    const d = new Date();
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  })()}
                  readOnly
                  disabled
                  style={{
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed',
                    color: '#666'
                  }}
                  required
                />
              </div>
            </div>

            <div className="announcement-form-group">
              <h6>Policy Title</h6>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter policy title..."
                required
                disabled={availableKeys.length === 0}
              />
            </div>

            <div className="announcement-form-group">
              <h6>Policy Content</h6>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter policy details here..."
                required
                disabled={availableKeys.length === 0}
              ></textarea>
            </div>


            <div className="general-announcement-modal-footer">
              <button type="button" className="button cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button save-btn"
                disabled={availableKeys.length === 0}
              >
                Add Policy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePolicyModal;
