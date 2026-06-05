import { MdClose, MdEdit } from "react-icons/md";
import "./GiftDetailModal.css";

const TYPE_META = {
  gift_card: { label: "Gift card", colorClass: "badge-blue" },
  discount: { label: "Discount", colorClass: "badge-amber" },
  promo: { label: "Promo", colorClass: "badge-rose" },
};

const STATUS_META = {
  active: { label: "Active", colorClass: "status-active" },
  expired: { label: "Expired", colorClass: "status-expired" },
  draft: { label: "Draft", colorClass: "status-draft" },
};

const GiftDetailModal = ({ isOpen, onClose, gift, formatValue, onEdit }) => {
  if (!isOpen || !gift) return null;

  const typeMeta = TYPE_META[gift.type];
  const statusMeta = STATUS_META[gift.status];

  return (
    <div className="general-modal-overlay" onClick={onClose}>
      <div className="gift-detail-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="gift-detail-modal-header">
          <h3>Gift details</h3>
          <button className="close-btn" onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <div className="gift-detail-modal-body">
          <div className="gift-detail-badge-row">
            <span className={`gift-detail-badge ${typeMeta.colorClass}`}>
              {typeMeta.label}
            </span>
            <span className={`gift-detail-status ${statusMeta.colorClass}`}>
              {statusMeta.label}
            </span>
          </div>

          <h3 className="gift-detail-name">{gift.name}</h3>
          <p className="gift-detail-desc">{gift.description}</p>

          <div className="gift-detail-grid">
            <div className="gift-detail-item">
              <span>Value</span>
              <strong>{formatValue(gift)}</strong>
            </div>
            <div className="gift-detail-item">
              <span>Code</span>
              <strong className="gift-detail-code">{gift.code}</strong>
            </div>
            <div className="gift-detail-item">
              <span>Assigned to</span>
              <strong>{gift.assignedTo === "all" ? "Everyone" : gift.assignedTo}</strong>
            </div>
            <div className="gift-detail-item">
              <span>Uses</span>
              <strong>{gift.used ?? gift.usedCount ?? 0} / {gift.total ?? gift.totalCount ?? 0}</strong>
            </div>
            <div className="gift-detail-item">
              <span>Created</span>
              <strong>{gift.createdAt ? new Date(gift.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}</strong>
            </div>
            <div className="gift-detail-item">
              <span>Expires</span>
              <strong>{gift.expiresAt ? new Date(gift.expiresAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}</strong>
            </div>
          </div>

          <div className="gift-detail-progress-wrap">
            <div className="gift-detail-progress-bar">
              <div
                className="gift-detail-progress-fill"
                style={{ width: `${Math.min((((gift.used ?? gift.usedCount ?? 0) / (gift.total ?? gift.totalCount ?? 1)) * 100), 100)}%` }}
              />
            </div>
            <span className="gift-detail-progress-label">
              {Math.round(((gift.used ?? gift.usedCount ?? 0) / (gift.total ?? gift.totalCount ?? 1)) * 100)}% redeemed
            </span>
          </div>
        </div>

        <div className="gift-detail-modal-footer">
          <button className="close-action-btn" onClick={onClose}>
            Close
          </button>
          <button
            className="edit-action-btn"
            onClick={() => {
              onClose();
              onEdit(gift);
            }}
          >
            <MdEdit /> Edit gift
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiftDetailModal;
