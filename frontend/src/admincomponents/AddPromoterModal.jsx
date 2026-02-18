import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './AddPromoterModal.css';

const AddPromoterModal = ({ isOpen, onClose, event, onAdd }) => {
    // Mock existing promoters
    const mockPromoters = [
        { id: 1, name: "John Smith", email: "john.smith@techcorp.com", avatar: "J" },
        { id: 2, name: "Sarah Johnson", email: "sarah.j@techcorp.com", avatar: "S" },
        { id: 3, name: "Mike Chen", email: "mike.chen@techcorp.com", avatar: "M" },
    ];

    const [selectedPromoter, setSelectedPromoter] = useState(null);

    // Filter promoters based on whether they should be shown? 
    // The design shows a list of "promoters" on the left and an "Add Promoter" select box on the right.
    // It seems the user wants a layout where existing promoters are listed on the left, and there is a form to add a *new* promoter (from existing accounts) on the right?
    // Or maybe the left side is a list of promoters *already assigned* to the event, and the right side is to Add one?
    // "the design is you can only add promoters in the existing promoters account".
    // 
    // Looking at the screenshot provided:
    // Left side: List of people (John Smith, Sarah Johnson, Mike Chen) with trash icons. These look like *assigned* promoters.
    // Right side: "Add Promoter" dropdown and "Add Promoter" button.
    //
    // So the modal has two sections:
    // 1. "Promoters List" (Existing on event)
    // 2. "Add Promoter" (Select from system users)

    // I need to restructure the modal significantly to match the 2-column layout in the screenshot.

    const [assignedPromoters, setAssignedPromoters] = useState([
        { id: 1, name: "John Smith", email: "john.smith@techcorp.com", avatar: "J" },
        { id: 2, name: "Sarah Johnson", email: "sarah.j@techcorp.com", avatar: "S" },
        { id: 3, name: "Mike Chen", email: "mike.chen@techcorp.com", avatar: "M" },
    ]);

    const [availablePromoters] = useState([
        { id: 4, name: "Ehdsell Apan", email: "ehdsell@example.com" },
        { id: 5, name: "Another User", email: "user@example.com" }
    ]);

    const [selectedNewPromoter, setSelectedNewPromoter] = useState('');

    if (!isOpen) return null;

    const handleRemovePromoter = (id) => {
        setAssignedPromoters(prev => prev.filter(p => p.id !== id));
    };

    const handleAddClick = () => {
        if (selectedNewPromoter) {
            const promoterToAdd = availablePromoters.find(p => p.id === parseInt(selectedNewPromoter));
            if (promoterToAdd) {
                // Update local state
                setAssignedPromoters([...assignedPromoters, { ...promoterToAdd, avatar: promoterToAdd.name.charAt(0) }]);

                // Call parent handler
                if (onAdd && event) {
                    onAdd(event.id, promoterToAdd);
                }

                // Reset selection
                setSelectedNewPromoter('');
            }
        }
    };

    return (
        <div className="add-promoter-modal-overlay">
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
                        {assignedPromoters.map(promoter => (
                            <div key={promoter.id} className="promoter-card">
                                <div className="promoter-avatar-circle">{promoter.avatar}</div>
                                <div className="promoter-card-info">
                                    <h6 className="promoter-card-name">{promoter.name}</h6>
                                    <span className="small-body-text promoter-card-email">{promoter.email}</span>
                                </div>
                                <button className="remove-promoter-btn" onClick={() => handleRemovePromoter(promoter.id)}>
                                    <Icon icon="mdi:trash-can-outline" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Right Column: Add Form */}
                    <div className="add-promoter-form-section">
                        <div className="form-group">
                            <h6>Add Promoter</h6>
                            <div className="custom-select-wrapper">
                                <select
                                    className="promoter-select"
                                    value={selectedNewPromoter}
                                    onChange={(e) => setSelectedNewPromoter(e.target.value)}
                                >
                                    <option value="" disabled selected>Select user...</option>
                                    {availablePromoters.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button className="primary-button add-promoter-action-btn" onClick={handleAddClick}>
                            Add Promoter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPromoterModal;
