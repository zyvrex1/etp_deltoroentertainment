import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './promoteraccessmanagement.css'; 
import PromoterCollaboratorsModal from './PromoterModal/PromoterCollaboratorsModal';
import { useAuthContext } from '../admincomponents/hooks/useAuthContext';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../admincomponents/utils/sweetAlert';

const PromoterAccessManagement = ({ selectedEvent }) => {
    const { user } = useAuthContext();
    const [assignedPromoters, setAssignedPromoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCollaboratorsModalOpen, setIsCollaboratorsModalOpen] = useState(false);
    const [eventOwner, setEventOwner] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

    useEffect(() => {
        const fetchEventData = async () => {
            if (!selectedEvent?._id) return;
            setLoading(true);
            try {
                const response = await fetch(`${backendUrl}/api/events/${selectedEvent._id}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                const data = await response.json();
                if (data.assignedPromoters) setAssignedPromoters(data.assignedPromoters);
                if (data.createdBy) setEventOwner(data.createdBy);
            } catch (error) {
                console.error("Error fetching event data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEventData();
    }, [selectedEvent?._id, user?.token, backendUrl]);

    const handleAssignPromoter = async (promoter) => {
        try {
            const newPromoters = [...assignedPromoters.map(p => p._id || p), promoter._id];
            const response = await fetch(`${backendUrl}/api/events/${selectedEvent._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ assignedPromoters: newPromoters })
            });

            const data = await response.json();
            if (response.ok) {
                setAssignedPromoters(data.event.assignedPromoters);
                showSuccessAlert("Access Granted", `${promoter.firstName} can now manage this event.`);
            } else {
                showErrorAlert("Update Failed", data.error || "Failed to add collaborator.");
            }
        } catch (err) {
            showErrorAlert("Error", "Something went wrong.");
        }
    };

    const handleRemovePromoter = async (promoterId) => {
        const confirm = await showConfirmAlert(
            "Revoke Access?", 
            "This user will lose all management privileges for this event immediately.", 
            "Revoke Access", 
            "Keep Access", 
            true
        );
        if (!confirm.isConfirmed) return;

        try {
            const newPromoters = assignedPromoters.filter(p => (p._id || p) !== promoterId).map(p => p._id || p);
            const response = await fetch(`${backendUrl}/api/events/${selectedEvent._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ assignedPromoters: newPromoters })
            });

            const data = await response.json();
            if (response.ok) {
                setAssignedPromoters(data.event.assignedPromoters);
                showSuccessAlert("Access Revoked", "The collaborator has been removed from the event team.");
            }
        } catch (err) {
            showErrorAlert("Error", "Failed to remove collaborator.");
        }
    };

    const filteredPromoters = assignedPromoters.filter(p => {
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase()) || p.email?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const Avatar = ({ person, isSecondary, size = "md" }) => {
        const [imgError, setImgError] = useState(false);
        const avatarPath = person?.avatar;
        
        const getFullUrl = (path) => {
            if (!path) return null;
            if (path.startsWith('http') || path.startsWith('data:')) return path;
            const cleanPath = path.startsWith('/') ? path : `/${path}`;
            return `${backendUrl}${cleanPath}`;
        };

        const avatarUrl = !imgError ? getFullUrl(avatarPath) : null;

        if (avatarUrl) {
            return (
                <div className={`am-card-avatar ${size} ${isSecondary ? 'secondary' : ''} has-image`}>
                    <img 
                        src={avatarUrl} 
                        alt={`${person?.firstName || 'User'} avatar`} 
                        onError={() => {
                            console.error(`Failed to load avatar: ${avatarUrl}`);
                            setImgError(true);
                        }} 
                    />
                </div>
            );
        }

        const initials = `${person?.firstName?.[0] || '?'}${person?.lastName?.[0] || ''}`;

        return (
            <div className={`am-card-avatar ${size} ${isSecondary ? 'secondary' : ''}`}>
                {initials}
            </div>
        );
    };

    const canManageAccess = user?.role === 'superadmin' || user?.role === 'admin' || String(user?._id) === String(eventOwner?._id);

    return (
        <div className="am-container">
            <header className="am-header">
                <div className="ts-header-left">
                    <h3 className="ts-title">Promoter Access Management</h3>
                    <p className="ts-header-subtitle">Authorize and monitor the core team managing this event</p>
                </div>
                {canManageAccess && (
                    <div className="am-header-controls">
                        <button className="am-add-btn" onClick={() => setIsCollaboratorsModalOpen(true)}>
                            <span>Invite Promoter</span>
                        </button>
                    </div>
                )}
            </header>

            <main className="am-main-content">
                <div className="am-toolbar">
                    <div className="am-search">
                        <Icon icon="solar:magnifer-linear" />
                        <input 
                            type="text" 
                            placeholder="Find an assigned promoter..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="am-stats-pills">
                        {loading ? (
                            <div className="stat-pill skeleton-card" style={{ padding: '4px 12px', border: 'none', background: 'var(--color-bg-secondary, #f8fafc)' }}>
                                <div className="avatar-group">
                                    <div className="skeleton skeleton-circle" style={{ width: '24px', height: '24px' }} />
                                    <div className="skeleton skeleton-circle" style={{ width: '24px', height: '24px', marginLeft: '-8px' }} />
                                    <div className="skeleton skeleton-circle" style={{ width: '24px', height: '24px', marginLeft: '-8px' }} />
                                </div>
                                <div className="skeleton skeleton-text" style={{ width: '100px', height: '12px', marginBottom: 0 }} />
                            </div>
                        ) : (
                            <div className="stat-pill">
                                <div className="avatar-group">
                                    {eventOwner && <Avatar person={eventOwner} size="sm" />}
                                    {assignedPromoters.slice(0, 3).map(p => (
                                        <Avatar key={p._id || p} person={p} size="sm" isSecondary />
                                    ))}
                                    {assignedPromoters.length > 3 && (
                                        <div className="avatar-more">+{assignedPromoters.length - 3}</div>
                                    )}
                                </div>
                                <span>Total Team: <strong>{assignedPromoters.length + (eventOwner ? 1 : 0)}</strong></span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="am-grid">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="am-promoter-card skeleton-card">
                                <div className="am-card-top-bar">
                                    <div className="skeleton skeleton-badge" style={{ width: '80px' }} />
                                </div>
                                <div className="am-card-body">
                                    <div className="skeleton skeleton-circle" style={{ width: '64px', height: '64px' }} />
                                    <div className="am-card-identity" style={{ width: '100%' }}>
                                        <div className="skeleton skeleton-text title" />
                                        <div className="skeleton skeleton-text short" />
                                    </div>
                                </div>
                                <div className="am-card-actions-row">
                                    <div className="skeleton skeleton-text" style={{ width: '100%', height: '12px' }} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            {/* OWNER CARD */}
                            {eventOwner && (
                                <article className="am-promoter-card owner-card">
                                    <div className="am-card-top-bar">
                                        <span className={`pe-status-pill ${eventOwner.role === 'superadmin' ? 'active' : 'admin'}`}>
                                            {eventOwner.role === 'superadmin' ? 'Root Admin' : 'Administrator'}
                                        </span>
                                        <div className="owner-badge">
                                            <Icon icon="solar:crown-bold-duotone" width="18" style={{ color: '#f59e0b' }} />
                                        </div>
                                    </div>
                                    <div className="am-card-body">
                                        <Avatar person={eventOwner} isSecondary={false} />
                                        <div className="am-card-identity">
                                            <h4>{eventOwner.firstName} {eventOwner.lastName}</h4>
                                            <div className="pe-meta-row">
                                                <Icon icon="solar:letter-linear" />
                                                <span className="small-body-text">{eventOwner.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="am-card-actions-row">
                                        <div className="am-card-footer-info">
                                            <Icon icon="solar:star-bold" width="14" />
                                            <span>Full Project Access (Creator)</span>
                                        </div>
                                    </div>
                                </article>
                            )}

                            {/* COLLABORATOR CARDS */}
                            {filteredPromoters.filter(p => (p._id || p) !== (eventOwner?._id || eventOwner)).map(p => (
                                <article key={p._id} className="am-promoter-card">
                                    <div className="am-card-top-bar">
                                        <span className="pe-status-pill collaborator">Collaborator</span>
                                        {canManageAccess && (
                                            <button className="am-remove-btn mini" onClick={() => handleRemovePromoter(p._id)} title="Revoke access">
                                                <Icon icon="solar:trash-bin-trash-bold-duotone" width="18" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="am-card-body">
                                        <Avatar person={p} isSecondary={true} />
                                        <div className="am-card-identity">
                                            <h4>{p.firstName} {p.lastName}</h4>
                                            <div className="pe-meta-row">
                                                <Icon icon="solar:letter-linear" />
                                                <span className="small-body-text">{p.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="am-card-actions-row">
                                        <div className="am-card-footer-info">
                                            <Icon icon="solar:clock-circle-linear" width="14" />
                                            <span>Assigned Contributor</span>
                                        </div>
                                    </div>
                                </article>
                            ))}

                            {filteredPromoters.length === 0 && !loading && (
                                <div className="am-empty-state">
                                    <Icon icon="solar:user-block-bold-duotone" width="80" style={{ color: '#e2e8f0' }} />
                                    <h3>No Collaborators Found</h3>
                                    <p>{canManageAccess ? "Only you currently have access to this event." : "Only the owner currently has access to this event."}</p>
                                    {canManageAccess && (
                                        <button className="primary-button am-add-btn" onClick={() => setIsCollaboratorsModalOpen(true)}>
                                            Invite First Promoter
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <PromoterCollaboratorsModal 
                isOpen={isCollaboratorsModalOpen}
                onClose={() => setIsCollaboratorsModalOpen(false)}
                currentCollaborators={[eventOwner, ...assignedPromoters].filter(Boolean)}
                onAssign={handleAssignPromoter}
            />
        </div>
    );
};

export default PromoterAccessManagement;
