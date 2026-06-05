import { MdClose, MdSend, MdPeople, MdStorefront } from "react-icons/md";
import "./AssignGiftModal.css";

const AssignGiftModal = ({ isOpen, onClose, gifts, assignForm, setAssignForm, onAssign, users = [] }) => {
  if (!isOpen) return null;

  const selectedGift = gifts.find((g) => (g.id || g._id) === assignForm.giftId);
  const assignedTo = selectedGift?.assignedTo;
  const showCustomers = assignedTo === "customers" || assignedTo === "all";
  const showSponsors = assignedTo === "sponsors" || assignedTo === "all";

  return (
    <div className="general-modal-overlay" onClick={onClose}>
      <div className="assign-gift-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="assign-gift-modal-header">
          <h3>Assign gift</h3>
          <button className="close-btn" onClick={onClose}><MdClose /></button>
        </div>

        <div className="assign-gift-modal-body">
          <div className="assign-gift-form-group">
            <label className="smaller-body-text">Select gift *</label>
            <select
              value={assignForm.giftId}
              onChange={(e) =>
                setAssignForm((p) => ({
                  ...p,
                  giftId: e.target.value,
                  // Reset user selection when gift changes
                  userId: "",
                  userLabel: "",
                  userEmail: "",
                  userRole: "",
                }))
              }
            >
              <option value="">Choose a gift...</option>
              {gifts
                .filter((g) => g.status === "active")
                .map((g) => (
                  <option key={g.id || g._id} value={g.id || g._id}>
                    {g.name} — {g.code}
                  </option>
                ))}
            </select>
          </div>

          <div className="assign-gift-form-group" style={{ position: "relative" }}>
            <label className="smaller-body-text">Assign to (user name or email) *</label>
            <input
              type="text"
              placeholder={assignForm.giftId ? "Search user..." : "Select a gift first..."}
              value={assignForm.userLabel}
              onChange={(e) => setAssignForm((p) => ({ ...p, userLabel: e.target.value, userId: "" }))}
              disabled={!assignForm.giftId}
            />
            {assignForm.giftId && assignForm.userLabel && !assignForm.userId && (
              <div className="user-search-dropdown">
                {users
                  .filter((u) => {
                    const role = u.role.toLowerCase();
                    // Only customer and sponsor
                    if (role !== "customer" && role !== "sponsor") return false;
                    // Filter by gift's assignedTo
                    if (assignedTo === "customers" && role !== "customer") return false;
                    if (assignedTo === "sponsors" && role !== "sponsor") return false;
                    // Text match
                    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
                    const email = u.email.toLowerCase();
                    const company = (u.companyName || "").toLowerCase();
                    const query = assignForm.userLabel.toLowerCase();
                    return fullName.includes(query) || email.includes(query) || company.includes(query);
                  })
                  .slice(0, 5)
                  .map((u) => {
                    const displayName = u.companyName
                      ? `${u.firstName} ${u.lastName} (${u.companyName})`
                      : `${u.firstName} ${u.lastName}`;
                    return (
                      <button
                        key={u._id}
                        type="button"
                        className="user-search-item"
                        onClick={() =>
                          setAssignForm((p) => ({
                            ...p,
                            userId: u._id,
                            userLabel: displayName,
                            userEmail: u.email,
                            userRole: u.role.toLowerCase(),
                          }))
                        }
                      >
                        <span className="user-name">{displayName}</span>
                        <span className="user-email">{u.email}</span>
                        <span className="user-role-badge">{u.role}</span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {assignForm.giftId && (showCustomers || showSponsors) && (
            <div className="assign-gift-form-group">
              <label className="smaller-body-text">Or bulk assign to</label>
              <div className="assign-gift-bulk-btns">
                {showCustomers && (
                  <button
                    className="assign-gift-bulk-btn"
                    onClick={() =>
                      setAssignForm((p) => ({
                        ...p,
                        userLabel: "All customers",
                        userId: "all_customers",
                        userRole: "customer",
                      }))
                    }
                  >
                    <MdPeople /> All customers
                  </button>
                )}
                {showSponsors && (
                  <button
                    className="assign-gift-bulk-btn"
                    onClick={() =>
                      setAssignForm((p) => ({
                        ...p,
                        userLabel: "All sponsors",
                        userId: "all_sponsors",
                        userRole: "sponsor",
                      }))
                    }
                  >
                    <MdStorefront /> All sponsors
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="assign-gift-modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={onAssign}>
            <MdSend /> Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignGiftModal;