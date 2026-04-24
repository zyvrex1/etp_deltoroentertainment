import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { showConfirmAlert, showSuccessAlert } from '../../utils/sweetAlert';
import './SponsorAddExhibitor.css';

const SponsorAddExhibitor = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExhibitors, setSelectedExhibitors] = useState([
        { id: 1, name: 'Ehdsell Apan', email: 'ehdsell@example.com', initial: 'E' },
        { id: 2, name: 'Ehdsell Apan', email: 'ehdsell@example.com', initial: 'E' },
    ]);

    if (!isOpen) return null;

    const dummySearchResults = [
        { id: 3, name: 'John Doe', email: 'john@example.com', initial: 'J' },
        { id: 4, name: 'Jane Smith', email: 'jane@example.com', initial: 'J' },
    ];

    const handleAddUser = (user) => {
        if (!selectedExhibitors.find(e => e.id === user.id)) {
            setSelectedExhibitors([...selectedExhibitors, user]);
        }
        setSearchQuery('');
    };

    const handleRemoveUser = (id) => {
        setSelectedExhibitors(selectedExhibitors.filter(user => user.id !== id));
    };

    const handleSubmit = async () => {
        if (selectedExhibitors.length === 0) {
            return;
        }
        const result = await showConfirmAlert(
            "Add Exhibitors?",
            `Are you sure you want to add these ${selectedExhibitors.length} exhibitor(s)?`,
            "Yes, Add Them"
        );
        if (result.isConfirmed) {
            await showSuccessAlert("Added", "Exhibitors have been added successfully.");
            onClose();
        }
    };

    return (
        <div className="add-exhibitor-modal-overlay">
            <div className="add-exhibitor-modal-content">
                <div className="add-exhibitor-modal-header">
                    <h4>Add Exhibitor</h4>
                    <button className="add-exhibitor-close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="add-exhibitor-modal-body">
                    <div className="add-exhibitor-search-section">
                        <label className="smaller-body-text">Search User</label>
                        <div className="add-exhibitor-search-bar">
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                className="add-exhibitor-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {searchQuery && (
                            <div className="add-exhibitor-search-results">
                                {dummySearchResults.map((user) => (
                                    <div key={user.id} className="add-exhibitor-search-item">
                                        <div className="add-exhibitor-info-wrapper">
                                            <div className="add-exhibitor-avatar">
                                                {user.initial}
                                            </div>
                                            <div className="add-exhibitor-details">
                                                <span className="regular-body-text exhibitor-name">{user.name}</span>
                                                <span className="smaller-body-text text-secondary">{user.email}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="outlined-button add-exhibitor-add-small-btn"
                                            onClick={() => handleAddUser(user)}
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="add-exhibitor-list-section">
                        <div className="add-exhibitor-list">
                            {selectedExhibitors.map((promoter, index) => (
                                <div key={index} className="add-exhibitor-item">
                                    <div className="add-exhibitor-info-wrapper">
                                        <div className="add-exhibitor-avatar">
                                            {promoter.initial}
                                        </div>
                                        <div className="add-exhibitor-details">
                                            <span className="regular-body-text exhibitor-name">{promoter.name}</span>
                                            <span className="smaller-body-text text-secondary">{promoter.email}</span>
                                        </div>
                                    </div>
                                    <button className="add-exhibitor-delete-btn" onClick={() => handleRemoveUser(promoter.id)}>
                                        <Icon icon="mdi:trash-can-outline" width="20" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="add-exhibitor-modal-footer">
                    <button className="primary-button add-exhibitor-submit-btn" onClick={handleSubmit}>Add Exhibitors</button>
                </div>
            </div>
        </div>
    );
};

export default SponsorAddExhibitor;
