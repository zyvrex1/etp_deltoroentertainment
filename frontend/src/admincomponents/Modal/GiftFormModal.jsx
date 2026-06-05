import { MdClose } from "react-icons/md";
import "./GiftFormModal.css";

const GiftFormModal = ({ isOpen, onClose, form, setForm, editingId, onSave }) => {
  if (!isOpen) return null;

  const noExpiry = form.expiresAt === "none";

  return (
    <div className="general-modal-overlay" onClick={onClose}>
      <div className="gift-form-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="gift-form-modal-header">
          <h3>{editingId ? "Edit gift" : "Create new gift"}</h3>
          <button className="close-btn" onClick={onClose}><MdClose /></button>
        </div>

        <div className="gift-form-modal-body">
          <div className="gift-form-group">
            <label className="smaller-body-text">Gift name *</label>
            <input
              type="text"
              placeholder="e.g. Welcome Bonus"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="gift-form-row">
            <div className="gift-form-group">
              <label className="smaller-body-text">Gift type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="gift_card">Gift card</option>
                <option value="discount">Discount</option>
                <option value="promo">Promo</option>
              </select>
            </div>
            <div className="gift-form-group">
              <label className="smaller-body-text">Assigned to *</label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
              >
                <option value="customers">Customers</option>
                <option value="sponsors">Sponsors</option>
                <option value="all">Everyone</option>
              </select>
            </div>
          </div>

          <div className="gift-form-row">
            <div className="gift-form-group">
              <label className="smaller-body-text">Value type</label>
              <select
                value={form.valueType}
                onChange={(e) => setForm((p) => ({ ...p, valueType: e.target.value }))}
              >
                <option value="fixed">Fixed ($)</option>
                <option value="percent">Percent (%)</option>
                <option value="bxgy">Buy X Get Y</option>
              </select>
            </div>
            {form.valueType !== "bxgy" && (
              <div className="gift-form-group">
                <label className="smaller-body-text">
                  {form.valueType === "percent" ? "Discount %" : "Amount ($)"}
                </label>
                <input
                  type="number"
                  placeholder={form.valueType === "percent" ? "e.g. 20" : "e.g. 500"}
                  value={form.value}
                  onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="gift-form-group">
            <label className="smaller-body-text">Description</label>
            <textarea
              rows={2}
              placeholder="Short description..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="gift-form-row">
            <div className="gift-form-group">
              <label className="smaller-body-text">Promo code *</label>
              <input
                type="text"
                placeholder="e.g. SUMMER2026"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="gift-form-group">
              <label className="smaller-body-text">Max uses</label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={form.total}
                onChange={(e) => setForm((p) => ({ ...p, total: e.target.value }))}
              />
            </div>
          </div>

          <div className="gift-form-group">
            <label className="smaller-body-text">Expiry date *</label>
            <input
              type="date"
              value={noExpiry ? "" : form.expiresAt}
              onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
              disabled={noExpiry}
              style={noExpiry ? { opacity: 0.4, pointerEvents: "none" } : {}}
            />
            <label className="gift-form-no-expiry smaller-body-text">
              <input
                type="checkbox"
                checked={noExpiry}
                onChange={(e) =>
                  setForm((p) => ({ ...p, expiresAt: e.target.checked ? "none" : "" }))
                }
              />
              No expiration
            </label>
          </div>
        </div>

        <div className="gift-form-modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={onSave}>
            {editingId ? "Save changes" : "Create gift"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiftFormModal;