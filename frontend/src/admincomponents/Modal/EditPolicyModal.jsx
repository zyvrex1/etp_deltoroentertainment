import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { showSuccessAlert, showCancelConfirmAlert, showUpdateConfirmAlert } from "../utils/sweetAlert";

const EditPolicyModal = ({ isOpen, onClose, policy, onSave }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [policyKey, setPolicyKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && policy) {
      setTitle(policy.title || "");
      setContent(policy.content || "");
      setPolicyKey(policy.policyKey || "");
    }
  }, [isOpen, policy]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!policyKey || isSaving) return;

    try {
      const updatedPolicy = { ...policy, title: title.trim(), content: content.trim() };

      // Confirm update
      const result = await showUpdateConfirmAlert();
      if (!result.isConfirmed) return;

      setIsSaving(true);

      // Pass the updated policy object back to parent to handle save
      await onSave(updatedPolicy);

      await showSuccessAlert(
        "Policy Updated",
        "The policy has been updated successfully."
      );

      onClose();
    } catch (error) {
      console.error("Error updating policy:", error);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    const hasChanges =
      title.trim() !== (policy?.title || "").trim() ||
      content.trim() !== (policy?.content || "").trim();

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
          <h3>Edit Policy</h3>
          <button className="close-btn" onClick={handleCancel}>
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div className="modal-body">
          <form id="edit-policy-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <h4>Policy Key</h4>
              <input type="text" value={policyLabel(policyKey)} disabled />
            </div>

            <div className="form-group">
              <h4>Policy Title</h4>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter policy title..."
                required
              />
            </div>

            <div className="form-group">
              <h4>Policy Content</h4>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter policy details here..."
                required
              ></textarea>
            </div>

            <div className="policy-modal-footer">
              <button
                type="button"
                className="button cancel-btn"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button save-btn"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Update Policy"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPolicyModal;