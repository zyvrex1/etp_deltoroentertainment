import { useState, useEffect, useRef, useMemo } from "react";
import {
    MdCardGiftcard,
    MdAdd,
    MdSearch,
    MdClose,
    MdEdit,
    MdDelete,
    MdSend,
    MdFilterList,
    MdPeople,
    MdStorefront,
    MdLocalOffer,
    MdConfirmationNumber,
    MdCalendarToday,
    MdCheckCircle,
    MdHourglassEmpty,
    MdMoreVert,
    MdContentCopy,
    MdVisibility,
    MdExpandMore,
} from "react-icons/md";
import "./digitalgifts.css";
import GiftFormModal from "./Modal/GiftFormModal";
import AssignGiftModal from "./Modal/AssignGiftModal";
import GiftDetailModal from "./Modal/GiftDetailModal";
import { useAuthContext } from "../hooks/useAuthContext";
import digitalgiftsService from "../services/digitalgiftsService";
import adminService from "../services/adminService";
import {
    showSuccessAlert,
    showErrorAlert,
    showWarningAlert,
    showCreateConfirmAlert,
    showUpdateConfirmAlert,
    showDeleteConfirmAlert
} from "../utils/sweetAlert";

const ITEMS_PER_PAGE = 8;

const TYPE_META = {
    gift_card: { label: "Gift card", icon: <MdCardGiftcard />, colorClass: "badge-blue" },
    discount: { label: "Discount", icon: <MdLocalOffer />, colorClass: "badge-amber" },
    promo: { label: "Promo", icon: <MdConfirmationNumber />, colorClass: "badge-rose" },
};

const STATUS_META = {
    active: { label: "Active", colorClass: "status-active" },
    expired: { label: "Expired", colorClass: "status-expired" },
    draft: { label: "Draft", colorClass: "status-draft" },
};

const emptyForm = {
    name: "",
    type: "gift_card",
    value: "",
    valueType: "fixed",
    description: "",
    assignedTo: "customers",
    total: "",
    expiresAt: "",
    code: "",
};



export default function DigitalGifts() {
    const { user } = useAuthContext();
    const [gifts, setGifts] = useState([]);
    const [users, setUsers] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState({ totalActive: 0, totalRedeemed: 0, totalValueIssued: 0, expiringThisWeek: 0 });

    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedGift, setSelectedGift] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [assignForm, setAssignForm] = useState({ userId: "", userLabel: "", giftId: "", userRole: "", userEmail: "" });
    const [copiedCode, setCopiedCode] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef(null);

    const fetchData = async () => {
        if (!user?.token) return;
        setIsLoading(true);
        try {
            const giftsData = await digitalgiftsService.getGifts(user.token);
            setGifts(giftsData);

            const statsData = await digitalgiftsService.getStats(user.token);
            setStats(statsData);

            const recentAssigns = await digitalgiftsService.getRecentAssignments(user.token);
            setAssignments(recentAssigns);

            const usersList = await adminService.getUsers(user.token);
            setUsers(usersList);
        } catch (err) {
            console.error("Fetch digital gifts error:", err);
            showErrorAlert("Failed to load", err.message || "Failed to load digital gifts data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
        };
        if (isFilterDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isFilterDropdownOpen]);

    const filtered = useMemo(() => gifts.filter((g) => {
        const matchFilter =
            filter === "all" ||
            (filter === "active" && g.status === "active") ||
            (filter === "gift_card" && g.type === "gift_card") ||
            (filter === "discount" && g.type === "discount") ||
            (filter === "promo" && g.type === "promo") ||
            (filter === "draft" && g.status === "draft") ||
            (filter === "expired" && g.status === "expired");
        const matchSearch =
            !search ||
            g.name.toLowerCase().includes(search.toLowerCase()) ||
            g.code.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    }), [gifts, filter, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

    const paginatedGifts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filtered, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter, search]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const handleEdit = (gift) => {
        setEditingId(gift._id || gift.id);
        setForm({
            name: gift.name,
            type: gift.type,
            value: gift.value ?? "",
            valueType: gift.valueType,
            description: gift.description,
            assignedTo: gift.assignedTo,
            total: gift.totalCount ?? gift.total,
            expiresAt: gift.expiresAt ? new Date(gift.expiresAt).toISOString().split('T')[0] : "",
            code: gift.code,
        });
        setShowModal(true);
        setActiveMenu(null);
    };

    const handleDelete = async (id) => {
        const confirm = await showDeleteConfirmAlert("Delete Digital Gift?", "Are you sure you want to delete this digital gift? This action cannot be undone.");
        if (!confirm.isConfirmed) return;

        try {
            await digitalgiftsService.deleteGift(id, user.token);
            await showSuccessAlert("Deleted Successfully", "Gift has been deleted.");
            fetchData();
        } catch (err) {
            await showErrorAlert("Failed to delete", err.message || "Failed to delete gift.");
        }
        setActiveMenu(null);
    };

    const handleSave = async () => {
        if (!form.name || !form.code || !form.expiresAt && form.expiresAt !== "none") {
            showWarningAlert("Missing fields", "Please fill in all required fields.");
            return;
        }

        const confirm = editingId
            ? await showUpdateConfirmAlert("Update Digital Gift?", "Are you sure you want to save these changes?")
            : await showCreateConfirmAlert("Create Digital Gift?", "Are you sure you want to create this new digital gift?");

        if (!confirm.isConfirmed) return;

        const payload = {
            name: form.name,
            type: form.type,
            value: form.value !== "" ? Number(form.value) : null,
            valueType: form.valueType,
            description: form.description,
            assignedTo: form.assignedTo,
            totalCount: Number(form.total),
            expiresAt: form.expiresAt === "none" ? null : form.expiresAt,
            code: form.code,
            status: "active",
        };

        try {
            if (editingId) {
                await digitalgiftsService.updateGift(editingId, payload, user.token);
                await showSuccessAlert("Updated Successfully", "Gift has been updated.");
            } else {
                await digitalgiftsService.createGift(payload, user.token);
                await showSuccessAlert("Created Successfully", "Gift has been created.");
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            await showErrorAlert("Failed to save", err.message || "Failed to save gift.");
        }
    };

    const handleAssign = async () => {
        if (!assignForm.userLabel || !assignForm.giftId) {
            showWarningAlert("Missing selection", "Please select a user and a gift.");
            return;
        }

        try {
            if (assignForm.userId === "all_customers" || assignForm.userId === "all_sponsors") {
                const targetRole = assignForm.userId === "all_customers" ? "customer" : "sponsor";
                const targetUsers = users.filter(u => u.role.toLowerCase() === targetRole);

                if (targetUsers.length === 0) {
                    showWarningAlert("No users found", `No users found with role ${targetRole}.`);
                    return;
                }

                for (const u of targetUsers) {
                    const displayName = u.companyName
                        ? `${u.firstName} ${u.lastName} (${u.companyName})`
                        : `${u.firstName} ${u.lastName}`;
                    await digitalgiftsService.assignGift(assignForm.giftId, {
                        userId: u._id,
                        userName: displayName,
                        userEmail: u.email,
                        userRole: u.role.toLowerCase()
                    }, user.token);
                }
                await showSuccessAlert("Assigned", `Gift assigned to all ${targetRole}s.`);
            } else {
                await digitalgiftsService.assignGift(assignForm.giftId, {
                    userId: assignForm.userId,
                    userName: assignForm.userLabel,
                    userEmail: assignForm.userEmail,
                    userRole: assignForm.userRole || "customer"
                }, user.token);
                await showSuccessAlert("Assigned", `Gift assigned to ${assignForm.userLabel}.`);
            }
            setShowAssignModal(false);
            setAssignForm({ userId: "", userLabel: "", giftId: "", userRole: "", userEmail: "" });
            fetchData();
        } catch (err) {
            showErrorAlert("Assignment failed", err.message || "Failed to assign gift.");
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 1500);
    };

    const handleViewDetail = (gift) => {
        setSelectedGift(gift);
        setShowDetailModal(true);
        setActiveMenu(null);
    };

    const formatValue = (g) => {
        if (g.valueType === "percent") return `${g.value}% off`;
        if (g.valueType === "fixed") return `$${g.value?.toLocaleString()}`;
        return "Buy 1 Get 1 Free";
    };

    const renderGiftCard = (gift) => {
        const giftKey = gift._id || gift.id;
        return (
            <div key={giftKey} className={`dg-card ${gift.status === "expired" ? "dg-card-expired" : ""}`}>
                <div className="dg-card-top">
                    <span className={`button-label ${TYPE_META[gift.type].colorClass}`}>
                        {TYPE_META[gift.type].icon} {TYPE_META[gift.type].label}
                    </span>
                    <div className="dg-card-right">
                        <span className={`button-label ${STATUS_META[gift.status].colorClass}`}>
                            {STATUS_META[gift.status].label}
                        </span>
                        <div className="dg-menu-wrap">
                            <button className="dg-menu-btn" onClick={() => setActiveMenu(activeMenu === giftKey ? null : giftKey)}>
                                <MdMoreVert />
                            </button>
                            {activeMenu === giftKey && (
                                <div className="dg-menu">
                                    <button onClick={() => handleViewDetail(gift)}>
                                        <MdVisibility /> View details
                                    </button>
                                    <button onClick={() => handleEdit(gift)}>
                                        <MdEdit /> Edit
                                    </button>
                                    {gift.status !== "expired" && (
                                        <button
                                            onClick={() => {
                                                setAssignForm((p) => ({ ...p, giftId: giftKey }));
                                                setShowAssignModal(true);
                                                setActiveMenu(null);
                                            }}
                                        >
                                            <MdSend /> Assign
                                        </button>
                                    )}
                                    <button className="dg-menu-delete" onClick={() => handleDelete(giftKey)}>
                                        <MdDelete /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <p className="dg-card-name large-body-text">{gift.name}</p>
                <p className="dg-card-desc smaller-body-text">{gift.description}</p>

                <h4 className="dg-card-value">{formatValue(gift)}</h4>

                <div className="dg-progress-wrap">
                    <div className="dg-progress-bar">
                        <div
                            className="dg-progress-fill"
                            style={{ width: `${Math.min(((gift.usedCount || 0) / (gift.totalCount || 1)) * 100, 100)}%` }}
                        />
                    </div>
                    <span className="dg-progress-label">{(gift.usedCount || 0)}/{(gift.totalCount || 0)} used</span>
                </div>

                <div className="dg-card-footer">
                    <div className="dg-assignee">
                        {gift.assignedTo === "customers" ? <MdPeople /> : gift.assignedTo === "sponsors" ? <MdStorefront /> : <MdPeople />}
                        <span>{gift.assignedTo === "all" ? "Everyone" : gift.assignedTo.charAt(0).toUpperCase() + gift.assignedTo.slice(1)}</span>
                    </div>
                    <div className="dg-code-wrap">
                        <span className="dg-code">{gift.code}</span>
                        <button className="dg-copy-btn" onClick={() => handleCopyCode(gift.code)} title="Copy code">
                            {copiedCode === gift.code ? <MdCheckCircle style={{ color: "var(--dg-green)" }} /> : <MdContentCopy />}
                        </button>
                    </div>
                </div>

                <div className="dg-expiry">
                    <MdCalendarToday />
                    <span>
                        {gift.expiresAt
                            ? `${gift.status === "expired" ? "Expired" : "Expires"} ${new Date(gift.expiresAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`
                            : "No expiration"}
                    </span>
                </div>
            </div>
        );
    };

    const renderSkeletonCards = () => (
        <div className="dg-grid">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <div key={index} className="dg-card dg-card-skeleton">
                    <div className="dg-card-top">
                        <div className="skeleton-box dg-skeleton-badge" />
                        <div className="skeleton-box dg-skeleton-status" />
                    </div>
                    <div className="skeleton-box dg-skeleton-title" />
                    <div className="skeleton-box dg-skeleton-desc" />
                    <div className="skeleton-box dg-skeleton-value" />
                    <div className="skeleton-box dg-skeleton-progress" />
                    <div className="dg-card-footer">
                        <div className="skeleton-box dg-skeleton-footer" />
                        <div className="skeleton-box dg-skeleton-code" />
                    </div>
                    <div className="skeleton-box dg-skeleton-expiry" />
                </div>
            ))}
        </div>
    );

    return (
        <div className="dg-page">
            <div className="dg-header">
                <div>
                    <h1 className="dg-title">Digital Gifts</h1>
                    <p className="dg-subtitle">Create and assign gift cards, discounts, and promos to customers and sponsors.</p>
                </div>
                <div className="dg-header-actions">
                    <button className="dg-btn-secondary" onClick={() => setShowAssignModal(true)}>
                        <MdSend /> Assign gift
                    </button>
                    <button className="dg-btn-primary" onClick={handleOpenCreate}>
                        <MdAdd /> New gift
                    </button>
                </div>
            </div>

            <div className="dg-stats">
                <div className="dg-stat-card">
                    <span className="dg-stat-label">Total active gifts</span>
                    <span className="dg-stat-value">{stats.totalActive}</span>
                </div>
                <div className="dg-stat-card">
                    <span className="dg-stat-label">Redeemed all time</span>
                    <span className="dg-stat-value">{stats.totalRedeemed}</span>
                </div>
                <div className="dg-stat-card">
                    <span className="dg-stat-label">Total value issued</span>
                    <span className="dg-stat-value">${(stats.totalValueIssued || 0).toLocaleString()}</span>
                </div>
                <div className="dg-stat-card dg-stat-warn">
                    <span className="dg-stat-label">Expiring this week</span>
                    <span className="dg-stat-value dg-warn-val">{stats.expiringThisWeek}</span>
                </div>
            </div>

            <div className="dg-content">
                <div className="dg-toolbar">
                    <div className="dg-toolbar-left">
                        <div className="dg-search">
                            <MdSearch className="dg-search-icon" />
                            <input
                                type="text"
                                placeholder="Search gifts or codes..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && <MdClose className="dg-clear-icon" onClick={() => setSearch("")} />}
                        </div>
                    </div>

                    <div className="dg-toolbar-right">
                        <div className="dg-filter-dropdown" ref={filterDropdownRef}>
                            <button
                                className="dg-filter-dropdown-btn small-body-text"
                                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                            >
                                <span className="truncate-text">
                                    {filter === "all"
                                        ? "All"
                                        : filter === "gift_card"
                                            ? "Gift card"
                                            : filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </span>
                                <MdExpandMore className={`dropdown-icon ${isFilterDropdownOpen ? "open" : ""}`} />
                            </button>
                            {isFilterDropdownOpen && (
                                <div className="dg-filter-dropdown-menu">
                                    {["all", "active", "gift_card", "discount", "promo", "draft", "expired"].map((f) => (
                                        <button
                                            key={f}
                                            className={`dg-filter-dropdown-item small-body-text ${filter === f ? "active" : ""}`}
                                            onClick={() => {
                                                setFilter(f);
                                                setIsFilterDropdownOpen(false);
                                            }}
                                        >
                                            {f === "all" ? "All" : f === "gift_card" ? "Gift card" : f.charAt(0).toUpperCase() + f.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    renderSkeletonCards()
                ) : filtered.length === 0 ? (
                    <div className="dg-empty">
                        <MdCardGiftcard className="dg-empty-icon" />
                        <p className="regular-body-text">No gifts found. Try adjusting filters or create a new one.</p>
                    </div>
                ) : (
                    <>
                        <div className="dg-grid">
                            {paginatedGifts.map((gift) => renderGiftCard(gift))}
                        </div>

                        {totalPages > 1 && (
                            <div className="dg-pagination pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                                <span className="pagination-info regular-body-text">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="dg-section">
                <h2 className="dg-section-title">Recent assignments</h2>
                <div className="dg-table-wrap">
                    <table className="dg-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Gift</th>
                                <th>Code</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map((a) => (
                                <tr key={a.assignmentId}>
                                    <td className="dg-td-name small-body-text">{a.userName || a.userEmail}</td>
                                    <td>
                                        <span className={`dg-badge-sm button-label ${a.userRole === "sponsor" ? "badge-amber" : "badge-blue"}`}>
                                            {a.userRole === "sponsor" ? <MdStorefront /> : <MdPeople />} {a.userRole}
                                        </span>
                                    </td>
                                    <td>{a.giftName}</td>
                                    <td>
                                        <span className="dg-code-sm">{a.code}</span>
                                    </td>
                                    <td>
                                        <span className={`dg-assign-status button-label ${a.status === "redeemed" ? "redeemed" : "pending"}`}>
                                            {a.status === "redeemed" ? <MdCheckCircle /> : <MdHourglassEmpty />}
                                            {a.status}
                                        </span>
                                    </td>
                                    <td className="dg-td-date">{new Date(a.assignedAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modals (extracted to Modal directory) ── */}
            <GiftFormModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                form={form}
                setForm={setForm}
                editingId={editingId}
                onSave={handleSave}
            />

            <AssignGiftModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                gifts={gifts}
                assignForm={assignForm}
                setAssignForm={setAssignForm}
                onAssign={handleAssign}
                users={users}
            />

            <GiftDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                gift={selectedGift}
                formatValue={formatValue}
                onEdit={handleEdit}
            />

            {activeMenu && (
                <div
                    className="dg-menu-backdrop"
                    onMouseDown={(e) => {
                        e.preventDefault();   // ← stops the backdrop from stealing focus
                        setActiveMenu(null);
                    }}
                />
            )}   
             </div>
    );
}