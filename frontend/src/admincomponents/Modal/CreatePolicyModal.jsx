import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { showSuccessAlert, showCancelConfirmAlert } from "../utils/sweetAlert";

const CreatePolicyModal = ({
  isOpen,
  onClose,
  onSave,
  existingPolicies = [],
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const usedKeys = existingPolicies.map((p) => p.policyKey);
  const availableKeys = ["tos", "privacy", "refund"].filter(
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
      alert("All policy keys are already used");
      return;
    }

    try {
      const newPolicy = { title, content, policyKey };

      // Save to backend
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPolicy),
      });

      const savedPolicy = await res.json();

      if (!res.ok)
        throw new Error(savedPolicy.error || "Failed to create policy");

      // Update parent state
      onSave(savedPolicy);

      await showSuccessAlert(
        "Policy Added",
        "The policy has been added successfully.",
      );
      onClose();

      // Reset form
      setTitle("");
      setContent("");
    } catch (error) {
      console.error("Error adding policy:", error);
      alert(error.message);
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
      <div className="general-modal-container">
        <div className="general-modal-header">
          <h3>Add New Policy</h3>
          <button className="close-btn" onClick={handleCancel}>
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div className="modal-body">
          <form id="add-policy-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <h4>Policy Key</h4>
              {availableKeys.length === 0 ? (
    <p>All policy keys are already used.</p>
  ) : (
    <select
      value={policyKey}
      onChange={(e) => setPolicyKey(e.target.value)}
      required
    >
      {["tos", "privacy", "refund"].map((key) => (
        <option
          key={key}
          value={key}
          disabled={existingPolicies.some((p) => p.policyKey === key)} // disable if already used
        >
          {key === "tos"
            ? "Terms of Service"
            : key === "privacy"
            ? "Privacy Policy"
            : "Refund Policy"}{" "}
          {existingPolicies.some((p) => p.policyKey === key)
            ? "(Already used)"
            : ""}
        </option>
      ))}
    </select>
  )}
            </div>

            <div className="form-group">
              <h4>Policy Title</h4>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter policy title..."
                required
                disabled={availableKeys.length === 0}
              />
            </div>

            <div className="form-group">
              <h4>Policy Content</h4>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter policy details here..."
                required
                disabled={availableKeys.length === 0}
              ></textarea>
            </div>

            <div className="policy-modal-footer">
              <button
                type="button"
                className="button cancel-btn"
                onClick={handleCancel}
              >
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
