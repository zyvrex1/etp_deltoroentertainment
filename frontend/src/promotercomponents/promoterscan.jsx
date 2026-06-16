import React, { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useAuthContext } from "../hooks/useAuthContext";
import Swal from "sweetalert2";
import QRScannerModal from "./QRScannerModal";
import usePagination from "../hooks/usePagination";
import PaginationBar from "../components/PaginationBar";
import "./promoterscan.css";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/* ── helpers ── */
const getInitials = (name = "") =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

const formatDateTime = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
};

const ACTION_LABELS = ["Check In", "Exit", "Check In 2", "Exit 2", "Check In 3", "Exit 3"];

const mapRow = (r, kind /* "attendee" | "sponsor" */) => {
    const customerName = `${r.user?.firstName || ""} ${r.user?.lastName || ""}`.trim() || "Unknown";
    const checkIns = Array.isArray(r.checkIns) ? r.checkIns : [];
    const scanCount = checkIns.length;
    const nextAction = scanCount < 6 ? ACTION_LABELS[scanCount] : null;

    let status, statusType;
    if (scanCount === 0) { status = "Registered"; statusType = "pending"; }
    else if (scanCount % 2 === 1) {
        const n = Math.ceil(scanCount / 2);
        status = n === 1 ? "Checked In" : `Checked In (${n})`; statusType = "checked";
    } else {
        const n = scanCount / 2;
        status = n === 1 ? "Exited" : `Exited (${n})`; statusType = "exited";
    }

    const fmt = (e) => (e?.time ? formatDateTime(e.time) : null);

    const isAttendee = kind === "attendee";
    const categoryName = r.categoryName || (isAttendee ? "Ticket" : "Booth");
    const itemLabel = isAttendee
        ? (r.seatLabels?.length ? r.seatLabels.join(", ") : r.seatIds?.length ? `${r.seatIds.length} seat(s)` : "Ticket")
        : (r.boothCode || r.boothId || "Booth");

    return {
        id: r._id,
        kind,
        initials: getInitials(customerName),
        name: customerName,
        email: r.user?.email || "—",
        company: r.user?.companyName || null,
        categoryName,
        item: itemLabel,
        typePill: categoryName,
        typeColor: isAttendee ? "green" : "purple",
        purchaseDate: formatDate(r.createdAt),
        checkIns, scanCount, nextAction,
        checkIn1: fmt(checkIns[0]),
        exitTime1: fmt(checkIns[1]),
        checkIn2: fmt(checkIns[2]),
        exitTime2: fmt(checkIns[3]),
        checkIn3: fmt(checkIns[4]),
        exitTime3: fmt(checkIns[5]),
        status, statusType,
    };
};

const PromoterScan = ({ selectedEvent }) => {
    const { user } = useAuthContext();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState("All");
    const [kindFilter, setKindFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [isKindDropdownOpen, setIsKindDropdownOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const itemsPerPage = 8;
    const {
        page, totalPages, total,
        setTotal, goTo, next, prev,
        reset: resetPage,
    } = usePagination({ limit: itemsPerPage });
    const filterRef = useRef(null);
    const kindRef = useRef(null);

    /* ── fetch ── */
    const fetchAll = useCallback(async () => {
        if (!selectedEvent?._id || !user?.token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `${BASE_URL}/api/reservations/event/${selectedEvent._id}/sales`,
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(res.status === 403 ? "You are not assigned to this event." : body.error || "Failed to load data.");
                setRows([]); return;
            }
            const { reservations, event: eventData } = await res.json();
            const priceMap = {};
            (eventData?.priceLevels || []).forEach((pl) => { priceMap[pl._id?.toString()] = pl.priceName; });

            const mapped = (reservations || []).map((r) => {
                if (r.type === "booth") return mapRow(r, "sponsor");
                const plId = r.priceLevelId?.toString();
                const categoryName = (plId && priceMap[plId]) || null;
                return mapRow({ ...r, categoryName }, "attendee");
            });
            setRows(mapped);
        } catch (err) {
            console.error("PromoterScan fetch error:", err);
            setError("Could not load data.");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [selectedEvent?._id, user?.token]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ── outside-click for dropdowns ── */
    useEffect(() => {
        const handle = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterDropdownOpen(false);
            if (kindRef.current && !kindRef.current.contains(e.target)) setIsKindDropdownOpen(false);
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    /* ── derived stats ── */
    const attendees = rows.filter((r) => r.kind === "attendee");
    const sponsors = rows.filter((r) => r.kind === "sponsor");
    const checkedIn = rows.filter((r) => r.scanCount >= 1).length;
    const pending = rows.filter((r) => r.scanCount === 0).length;
    const attendancePct = rows.length > 0 ? Math.round((checkedIn / rows.length) * 100) : 0;

    /* category breakdown for both kinds */
    const categoryStats = (() => {
        const map = {};
        rows.forEach((r) => {
            const key = `${r.kind}__${r.categoryName}`;
            if (!map[key]) map[key] = { name: r.categoryName, kind: r.kind, total: 0, checked: 0 };
            map[key].total += 1;
            if (r.scanCount >= 1) map[key].checked += 1;
        });
        return Object.values(map);
    })();

    /* ── filtering ── */
    const filteredData = rows.filter((row) => {
        const q = searchQuery.toLowerCase();
        const matchStatus =
            activeFilter === "All" ||
            (activeFilter === "Checked In" && row.scanCount >= 1) ||
            (activeFilter === "Registered" && row.scanCount === 0);
        const matchKind =
            kindFilter === "All" ||
            (kindFilter === "Attendees" && row.kind === "attendee") ||
            (kindFilter === "Sponsors" && row.kind === "sponsor");
        if (!matchStatus || !matchKind) return false;
        if (!q) return true;
        return (
            row.name.toLowerCase().includes(q) ||
            row.email.toLowerCase().includes(q) ||
            row.item.toLowerCase().includes(q) ||
            row.categoryName?.toLowerCase().includes(q) ||
            (row.company || "").toLowerCase().includes(q)
        );
    });

    useEffect(() => {
        setTotal({
            total: filteredData.length,
            totalPages: Math.ceil(filteredData.length / itemsPerPage) || 1,
        });
    }, [filteredData.length, setTotal]);

    useEffect(() => {
        resetPage();
    }, [searchQuery, activeFilter, kindFilter, resetPage]);

    const startIndex = (page - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    /* ── check-in logic ── */
    const handleManualCheckIn = async (reservationId) => {
        if (!reservationId || !user?.token) return;
        const row = rows.find((r) => r.id === reservationId);
        if (!row) return;
        const actionLabel = row.nextAction || "Action";
        const confirm = await Swal.fire({
            title: `Confirm ${actionLabel}`,
            text: `Manually record "${actionLabel}" for ${row.name}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: `Yes, ${actionLabel}`,
            confirmButtonColor: "var(--color-red-primary)",
        });
        if (!confirm.isConfirmed) return;
        await performCheckIn(reservationId);
    };

    const handleScanSuccess = async (reservationId) => {
        setIsScannerOpen(false);
        if (!reservationId || !user?.token) return;
        await performCheckIn(reservationId);
    };

    const performCheckIn = async (reservationId) => {
        try {
            Swal.fire({ title: "Processing...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });
            const res = await fetch(`${BASE_URL}/api/reservations/${reservationId}/checkin`, {
                method: "POST",
                headers: { Authorization: `Bearer ${user.token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Check-in failed");
            if (data.maxReached) {
                Swal.fire({ icon: "info", title: "Max Check-ins Reached", text: "All 3 check-in/exit events recorded.", confirmButtonColor: "var(--color-red-primary)" });
                return;
            }
            const { actionType, scanNumber } = data;
            const firstName = data.reservation?.user?.firstName || "Guest";
            const messages = {
                checkin: scanNumber === 1
                    ? { icon: "success", title: "Check-in Successful!", text: `Welcome, ${firstName}!` }
                    : { icon: "success", title: `Check-in ${scanNumber} Recorded!`, text: `${firstName} has re-entered.` },
                exit: { icon: "info", title: "Exit Recorded", text: `${firstName} has exited.` },
            };
            const msg = messages[actionType] || { icon: "success", title: "Done", text: data.message };
            Swal.fire({ ...msg, timer: 2500, showConfirmButton: false });
            fetchAll();
        } catch (err) {
            console.error("Check-in error:", err);
            Swal.fire({ icon: "error", title: "Failed", text: err.message, confirmButtonColor: "var(--color-red-primary)" });
        }
    };

    /* ── helpers ── */
    const eventTitle = selectedEvent?.title || "—";
    const eventDate = selectedEvent?.startDate
        ? new Date(selectedEvent.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "—";
    const eventVenue = selectedEvent?.venue?.name || "—";

    /* ── derived state for old layout ── */
    const recentCheckins = rows
        .filter(r => r.scanCount > 0)
        .flatMap(r => r.checkIns.map(ci => ({ ...r, checkInTime: ci.time })))
        .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
        .slice(0, 5)
        .map(r => ({
            initials: r.initials,
            name: r.name,
            detail: r.categoryName,
            time: formatDateTime(r.checkInTime)
        }));

    const manualCheckins = paginatedData.map(r => ({
        id: r.id,
        initials: r.initials,
        name: r.name,
        email: r.email,
        type: r.kind === 'attendee' ? 'gen' : 'vip',
        typeColor: r.typeColor,
        typePill: r.categoryName,
        item: r.item,
        status: r.scanCount > 0 ? 'checked' : 'pending',
        time: r.checkIn1 || '',
        undoCount: 0,
        nextAction: r.nextAction
    }));

    const ticketStats = categoryStats.map(s => ({
        name: s.name,
        count: `${s.checked}/${s.total}`,
        progress: `${(s.checked / s.total) * 100}%`
    }));

    const handleUndo = (id) => {
        Swal.fire({
            icon: 'info',
            title: 'Not Implemented',
            text: 'Undo check-in is not supported yet by the API.',
            confirmButtonColor: 'var(--color-red-primary)'
        });
    };

    const handleSimulateScan = () => {
        setIsScannerOpen(true);
    };

    /* ── render ── */

    return (
        <div className="scan-container">
            <div className="scan-header">
                <div className="sc-header-left">
                    <h1 className="sc-title">Event Check-In</h1>
                    <p className="small-body-text sc-header-subtitle">Scan tickets and manage attendee entry</p>
                </div>
            </div>

            <div className="sc-main-content">
                {/* Event Banner */}
                <div className="sc-event-banner">
                    <div className="sc-banner-top">
                        <div className="sc-banner-info">
                            <h3>{eventTitle}</h3>
                            <p className="small-body-text">{eventDate} &bull; {eventVenue}</p>
                        </div>
                        <div className="sc-banner-stats">
                            <div className="sc-stat-item">
                                <h4 className="sc-text-green">{loading ? "—" : checkedIn}</h4>
                                <span className="sc-stat-label smaller-body-text">Checked In</span>
                            </div>
                            <div className="sc-stat-item">
                                <h4>{loading ? "—" : rows.length}</h4>
                                <span className="sc-stat-label smaller-body-text">Total Registered</span>
                            </div>
                            <div className="sc-stat-item">
                                <h4>{loading ? "—" : `${attendancePct}%`}</h4>
                                <span className="sc-stat-label smaller-body-text">Attendance</span>
                            </div>
                            <div className="sc-stat-item">
                                <h4>{loading ? "—" : attendees.length}</h4>
                                <span className="sc-stat-label smaller-body-text">Attendees</span>
                            </div>
                            <div className="sc-stat-item">
                                <h4>{loading ? "—" : sponsors.length}</h4>
                                <span className="sc-stat-label smaller-body-text">Sponsors</span>
                            </div>
                        </div>
                    </div>
                    <div className="sc-banner-progress-bar">
                        <div className="sc-progress-fill" style={{ width: `${attendancePct}%` }} />
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state" style={{ padding: '100px 0' }}>
                        <Icon icon="mdi:loading" width="48" className="spin-icon" />
                        <p>Loading check-in data...</p>
                    </div>
                ) : error ? (
                    <div className="empty-state" style={{ padding: '100px 0' }}>
                        <Icon icon="mdi:alert-circle-outline" width="48" />
                        <h4>Access Denied</h4>
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="sc-content-columns">
                        <div className="sc-left-col">
                            {/* Ready to Scan Card */}
                            <div className="sc-card sc-scan-box">
                                <div className="sc-scan-icon-container">
                                    <Icon icon="mdi:qrcode-scan" className="sc-scan-icon" />
                                </div>
                                <h4>Ready to Scan</h4>
                                <p className="small-body-text sc-scan-text">Point your camera at a ticket QR code or use manual search below.</p>
                                <button className="primary-button sc-sim-scan" onClick={handleSimulateScan}>
                                    Open Scanner
                                </button>
                            </div>

                            {/* Recent Check-ins Card */}
                            <div className="sc-card sc-recent-box">
                                <h4>Recent Check-ins</h4>
                                <div className="sc-recent-list">
                                    {recentCheckins.length === 0 ? (
                                        <p className="small-body-text" style={{ textAlign: 'center', color: 'var(--color-black-tertiary)' }}>No check-ins yet today.</p>
                                    ) : (
                                        recentCheckins.map((item, index) => (
                                            <div className="sc-recent-item" key={index}>
                                                <div className="sc-recent-left">
                                                    <div className="sc-avatar">
                                                        {item.initials}
                                                    </div>
                                                    <div className="sc-recent-info">
                                                        <h6 className="sc-name">{item.name}</h6>
                                                        <span className="smaller-body-text sc-sub">{item.detail}</span>
                                                    </div>
                                                </div>
                                                <div className="sc-recent-right">
                                                    <Icon icon="mdi:check-circle-outline" className="sc-check-icon" />
                                                    <span className="smaller-body-text sc-time">{item.time}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="sc-right-col">
                            {/* Manual Check-in Card */}
                            <div className="sc-card sc-manual-box">
                                <h4>Manual Check-in</h4>
                                <div className="sc-search-container">
                                    <input
                                        type="text"
                                        className="sc-search-input"
                                        placeholder="Search by name, email, company..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="sc-manual-list">
                                    {manualCheckins.length === 0 ? (
                                        <p className="small-body-text" style={{ textAlign: 'center', color: 'var(--color-black-tertiary)' }}>No matching records found.</p>
                                    ) : (
                                        manualCheckins.map((item, index) => (
                                            <div className="sc-manual-item" key={index}>
                                                <div className="sc-manual-left">
                                                    <div className="sc-avatar">
                                                        {item.initials}
                                                    </div>
                                                    <div className="sc-manual-info">
                                                        <h6 className="sc-name">{item.name}</h6>
                                                        <span className="smaller-body-text sc-email">{item.email}</span>
                                                    </div>
                                                    <div className="button-label">
                                                        <span className={`type-pill pill-bg-${item.typeColor}`}>
                                                            {item.typePill} | {item.item}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="sc-manual-right">
                                                    {item.nextAction ? (
                                                        <button
                                                            className="primary-button sc-checkin-btn"
                                                            onClick={() => handleManualCheckIn(item.id)}
                                                        >
                                                            {item.nextAction}
                                                        </button>
                                                    ) : (
                                                        <div className="sc-check-status">
                                                            <Icon icon="mdi:check-circle-outline" className="sc-check-icon" />
                                                            <span className="smaller-body-text sc-time">Done</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <PaginationBar
                                    page={page}
                                    totalPages={totalPages}
                                    total={total}
                                    onPrev={prev}
                                    onNext={next}
                                    onGoTo={goTo}
                                />
                            </div>

                            {/* Ticket Type Stats Card */}
                            <div className="sc-card sc-ticket-type-box">
                                <h4>Check-in by Ticket Type</h4>
                                <div className="sc-ticket-stats-list">
                                    {ticketStats.map((stat, index) => (
                                        <div className="sc-stat-row" key={index}>
                                            <div className="sc-stat-row-top">
                                                <h6 className="sc-stat-name">{stat.name}</h6>
                                                <span className="smaller-body-text sc-stat-count">{stat.count}</span>
                                            </div>
                                            <div className="sc-stat-progress-bar">
                                                <div className="sc-stat-fill" style={{ width: stat.progress }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* QR Scanner Modal */}
            <QRScannerModal
                show={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
                title="Scan Attendee / Booth Ticket"
            />
        </div>
    );
};

export default PromoterScan;
