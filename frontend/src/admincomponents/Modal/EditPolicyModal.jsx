import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { showSuccessAlert, showCancelConfirmAlert, showUpdateConfirmAlert, showErrorAlert } from "../../utils/sweetAlert";
import './ManagePolicyModal.css';

const EditPolicyModal = ({ isOpen, onClose, policy, onSave }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [policyKey, setPolicyKey] = useState("");
  const [updatedDate, setUpdatedDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && policy) {
      setTitle(policy.title || "");
      setContent(policy.content || "");
      setPolicyKey(policy.policyKey || "");

      // Debug: log what date fields the policy object has
      console.log('[EditPolicyModal] policy date fields:', {
        date: policy.date,
        publishDate: policy.publishDate,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
      });

      // Try all possible date field names from the API
      const raw = policy.date || policy.publishDate || policy.createdAt;

      if (raw) {
        const parsed = new Date(raw);
        if (!isNaN(parsed.getTime())) {
          const yyyy = parsed.getFullYear();
          const mm = String(parsed.getMonth() + 1).padStart(2, '0');
          const dd = String(parsed.getDate()).padStart(2, '0');
          setUpdatedDate(`${yyyy}-${mm}-${dd}`);
          return;
        }
      }

      // Fallback to today
      const now = new Date();
      setUpdatedDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    }
  }, [isOpen, policy?.policyKey]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!policyKey || isSaving) return;

    try {
      const updatedPolicy = { ...policy, title: title.trim(), content: content.trim(), publishDate: updatedDate };

      // Confirm update
      const result = await showUpdateConfirmAlert();
      if (!result.isConfirmed) return;

      setIsSaving(true);

      // Pass the updated policy object back to parent to handle save
      await onSave(updatedPolicy);

      onClose();
      showSuccessAlert(
        "Policy Updated",
        "The policy has been updated successfully."
      );
    } catch (error) {
      console.error("Error updating policy:", error);
      showErrorAlert("Error", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    const originalDate = policy?.date
      ? new Date(policy.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const hasChanges =
      title.trim() !== (policy?.title || "").trim() ||
      content.trim() !== (policy?.content || "").trim() ||
      updatedDate !== originalDate;

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
        : key === "coc"
          ? "Code of Conduct"
          : key === "guidelines"
            ? "Event Guidelines"
            : key === "sponsor"
              ? "Sponsor Agreement"
              : "Refund Policy";

  return (
    <div className="general-modal-overlay">
      <div className="general-announcement-modal-container">
        <div className="general-modal-header">
          <h3>Edit Policy</h3>
          <button className="close-btn" onClick={handleCancel}>
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div className="modal-body">
          <form className="create-announcement-form" onSubmit={handleSubmit}>
            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <h6>Policy Key</h6>
                <input type="text" value={policyLabel(policyKey)} disabled />
              </div>
              <div className="announcement-form-group">
                <h6>Updated Date</h6>
                <input
                  type="date"
                  value={updatedDate}
                  onChange={(e) => setUpdatedDate(e.target.value)}
                  required
                  style={{ cursor: 'pointer', pointerEvents: 'all', position: 'relative', zIndex: 9999 }}
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
              />
            </div>

            <div className="announcement-form-group">
              <h6>Policy Content</h6>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter policy details here..."
                required
              ></textarea>
            </div>

            <div className="general-announcement-modal-footer">
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