import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './promoterticketsetup.css';
import PromoterCollaboratorsModal from './PromoterModal/PromoterCollaboratorsModal';
import { useAuthContext } from '../hooks/useAuthContext';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../utils/sweetAlert';

const PromoterTicketSetup = ({ selectedEvent }) => {
    const { user } = useAuthContext();
    const [assignedPromoters, setAssignedPromoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCollaboratorsModalOpen, setIsCollaboratorsModalOpen] = useState(false);
    const [eventOwner, setEventOwner] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchEventData = async () => {
            if (!selectedEvent?._id) return;
            setLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/events/${selectedEvent._id}`, {
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
    }, [selectedEvent?._id, user?.token]);

    const handleAssignPromoter = async (promoter) => {
        try {
            const newPromoters = [...assignedPromoters.map(p => p._id || p), promoter._id];
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/events/${selectedEvent._id}`, {
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
                showSuccessAlert("Added!", `${promoter.firstName} has been added as a collaborator.`);
            } else {
                showErrorAlert("Error", data.error || "Failed to add collaborator.");
            }
        } catch (err) {
            showErrorAlert("Error", "Something went wrong.");
        }
    };

    const handleRemovePromoter = async (promoterId) => {
        const confirm = await showConfirmAlert("Remove Collaborator?", "They will no longer have access to manage this event.", "Remove", "Cancel", true);
        if (!confirm.isConfirmed) return;

        try {
            const newPromoters = assignedPromoters.filter(p => (p._id || p) !== promoterId).map(p => p._id || p);
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/events/${selectedEvent._id}`, {
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
                showSuccessAlert("Removed!", "Collaborator has been removed.");
            }
        } catch (err) {
            showErrorAlert("Error", "Failed to remove collaborator.");
        }
    };

    const filteredPromoters = assignedPromoters.filter(p => {
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase()) || p.email?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="am-container">
            <div className="am-header">
                <div className="ts-header-left">
                    <h1 className="ts-title">Promoter Access Monitoring</h1>
                    <p className="small-body-text ts-header-subtitle">Authorize and monitor promoters who can manage this event</p>
                </div>
                <div className="ts-header-controls">
                    <button className="primary-button am-add-btn" onClick={() => setIsCollaboratorsModalOpen(true)}>
                        <Icon icon="mdi:account-plus-outline" />
                        <span>Add Promoter</span>
                    </button>
                </div>
            </div>

            <div className="am-main-content">
                <div className="am-toolbar">
                    <div className="am-search">
                        <Icon icon="mdi:magnify" />
                        <input 
                            type="text" 
                            placeholder="Search assigned promoters..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="am-stats">
                        <span className="small-body-text">Total Assigned: <strong>{assignedPromoters.length + (eventOwner ? 1 : 0)}</strong></span>
                    </div>
                </div>

                <div className="am-grid">
                    {loading ? (
                        <div className="am-loading">
                            <Icon icon="line-md:loading-twotone-loop" width="48" />
                            <p>Loading access list...</p>
                        </div>
                    ) : (
                        <>
                            {eventOwner && (
                                <div className="am-promoter-card owner-card">
                                    <div className="am-card-badge">OWNER</div>
                                    <div className="am-card-avatar">
                                        {eventOwner.firstName?.[0]}{eventOwner.lastName?.[0]}
                                    </div>
                                    <div className="am-card-info">
                                        <h4>{eventOwner.firstName} {eventOwner.lastName}</h4>
                                        <p className="small-body-text">{eventOwner.email}</p>
                                        <div className="am-card-status">
                                            <Icon icon="mdi:shield-check" />
                                            <span>Full Access</span>
                                        </div>
                                    </div>
                                    <div className="am-card-footer">
                                        <span className="smaller-body-text">Event Creator</span>
                                    </div>
                                </div>
                            )}

                            {filteredPromoters.filter(p => p._id !== eventOwner?._id).map(p => (
                                <div key={p._id} className="am-promoter-card">
                                    <div className="am-card-actions">
                                        <button className="am-remove-btn" onClick={() => handleRemovePromoter(p._id)} title="Revoke Access">
                                            <Icon icon="mdi:trash-can-outline" />
                                        </button>
                                    </div>
                                    <div className="am-card-avatar secondary">
                                        {p.firstName?.[0]}{p.lastName?.[0]}
                                    </div>
                                    <div className="am-card-info">
                                        <h4>{p.firstName} {p.lastName}</h4>
                                        <p className="small-body-text">{p.email}</p>
                                        <div className="am-card-status collaborator">
                                            <Icon icon="mdi:account-group" />
                                            <span>Collaborator</span>
                                        </div>
                                    </div>
                                    <div className="am-card-footer">
                                        <span className="smaller-body-text">Assigned Promoter</span>
                                    </div>
                                </div>
                            ))}

                            {filteredPromoters.length === 0 && !loading && (
                                <div className="am-empty-state">
                                    <Icon icon="mdi:account-off-outline" width="64" />
                                    <h3>No collaborators found</h3>
                                    <p>Try searching for a different name or add a new promoter.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <PromoterCollaboratorsModal 
                isOpen={isCollaboratorsModalOpen}
                onClose={() => setIsCollaboratorsModalOpen(false)}
                currentCollaborators={[eventOwner, ...assignedPromoters].filter(Boolean)}
                onAssign={handleAssignPromoter}
            />
        </div>
    );
};

export default PromoterTicketSetup;
