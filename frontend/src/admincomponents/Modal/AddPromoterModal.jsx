import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './AddPromoterModal.css';
import { showSuccessAlert, showConfirmAlert } from '../utils/sweetAlert';

const AddPromoterModal = ({ isOpen, onClose, event, allPromoters, user, onUpdate }) => {
    const [selectedNewPromoter, setSelectedNewPromoter] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [assignedPromoters, setAssignedPromoters] = useState([]);

    useEffect(() => {
        if (event && event.assignedPromoters) {
            setAssignedPromoters(event.assignedPromoters);
        } else {
            setAssignedPromoters([]);
        }
    }, [event, isOpen]);

    if (!isOpen) return null;

    const handleAddClick = async () => {
        if (!selectedNewPromoter) return;
        
        // Prevent adding duplicate
        if (assignedPromoters.some(p => p._id === selectedNewPromoter)) {
            alert("This promoter is already assigned.");
            return;
        }

        setIsProcessing(true);
        try {
            const updatedPromoterIds = [...assignedPromoters.map(p => p._id), selectedNewPromoter];
            
            const response = await fetch(`/api/events/${event._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ assignedPromoters: updatedPromoterIds })
            });

            const json = await response.json();

            if (response.ok) {
                setAssignedPromoters(json.event.assignedPromoters);
                setSelectedNewPromoter('');
                if (onUpdate) onUpdate(json.event);
                await showSuccessAlert("Assigned!", "Promoter has been added to this event.");
            } else {
                alert(json.error || "Failed to add promoter.");
            }
        } catch (error) {
            console.error(error);
            alert("Error adding promoter.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemovePromoter = async (promoterId, promoterName) => {
        const result = await showConfirmAlert(
            "Remove Promoter",
            `Are you sure you want to remove ${promoterName} from this event?`,
            "Yes, Remove",
            "Cancel"
        );

        if (!result.isConfirmed) return;

        setIsProcessing(true);
        try {
            const updatedPromoterIds = assignedPromoters
                .filter(p => p._id !== promoterId)
                .map(p => p._id);
            
            const response = await fetch(`/api/events/${event._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ assignedPromoters: updatedPromoterIds.length > 0 ? updatedPromoterIds : [] })
            });

            const json = await response.json();

            if (response.ok) {
                setAssignedPromoters(json.event.assignedPromoters);
                if (onUpdate) onUpdate(json.event);
                await showSuccessAlert("Removed!", "Promoter has been removed from this event.");
            } else {
                alert(json.error || "Failed to remove promoter.");
            }
        } catch (error) {
            console.error(error);
            alert("Error removing promoter.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Filter out already assigned promoters from the available list
    const availablePromoters = allPromoters.filter(
        p => !assignedPromoters.some(ap => ap._id === p._id)
    );

    return (
        <div className="add-promoter-modal-overlay" onClick={(e) => e.target.className === 'add-promoter-modal-overlay' && onClose()}>
            <div className="add-promoter-modal-container">
                <div className="add-promoter-modal-header">
                    <h3>Add Promoter</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" height="24" />
                    </button>
                </div>

                <div className="add-promoter-modal-body two-column-body">
                    {/* Left Column: Assigned Promoters List */}
                    <div className="assigned-promoters-section">
                        {(() => {
                            // Combine assigned promoters and creator (if creator is a promoter and not already in assigned list)
                            const displayList = [...assignedPromoters];
                            const creator = event.createdBy;
                            
                            if (creator && creator.role === 'promoter' && !displayList.some(p => p._id === creator._id)) {
                                displayList.unshift(creator);
                            }

                            if (displayList.length === 0) {
                                return (
                                    <div className="empty-promoters">
                                        <Icon icon="mdi:account-off-outline" width="48" />
                                        <p>No promoters assigned yet.</p>
                                    </div>
                                );
                            }

                            return displayList.map(promoter => {
                                const isCreator = promoter._id === event.createdBy?._id;
                                return (
                                    <div key={promoter._id} className="promoter-card">
                                        <div className="promoter-avatar-circle">
                                            {promoter.firstName?.charAt(0)}{promoter.lastName?.charAt(0)}
                                        </div>
                                        <div className="promoter-card-info">
                                            <h6 className="promoter-card-name">
                                                {promoter.firstName} {promoter.lastName}
                                                {isCreator && <span className="owner-badge"> (Creator)</span>}
                                            </h6>
                                            <span className="small-body-text promoter-card-email">{promoter.email}</span>
                                        </div>
                                        <button 
                                            className="remove-promoter-btn" 
                                            onClick={() => handleRemovePromoter(promoter._id, `${promoter.firstName} ${promoter.lastName}`)}
                                            disabled={isProcessing || isCreator}
                                            title={isCreator ? "Event creator cannot be removed" : "Remove Promoter"}
                                        >
                                            <Icon icon="mdi:trash-can-outline" />
                                        </button>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {/* Right Column: Add Form */}
                    <div className="add-promoter-form-section">
                        <div className="form-group">
                            <label className="form-label">Add Promoter</label>
                            <div className="custom-select-wrapper">
                                <select
                                    className="promoter-select"
                                    value={selectedNewPromoter}
                                    onChange={(e) => setSelectedNewPromoter(e.target.value)}
                                    disabled={isProcessing}
                                >
                                    <option value="" disabled>Select user...</option>
                                    {availablePromoters.map(p => (
                                        <option key={p._id} value={p._id}>
                                            {p.firstName} {p.lastName}
                                        </option>
                                    ))}
                                </select>
                                <Icon icon="mdi:chevron-down" className="select-icon" />
                            </div>
                        </div>
                        <button 
                            className="primary-button add-promoter-action-btn" 
                            onClick={handleAddClick}
                            disabled={!selectedNewPromoter || isProcessing}
                        >
                            {isProcessing ? <Icon icon="line-md:loading-twotone-loop" /> : "Add Promoter"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPromoterModal;
