import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { useAuthContext } from '../../hooks/useAuthContext';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../../utils/sweetAlert';
import './SponsorAddExhibitor.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const SponsorAddExhibitor = ({ isOpen, onClose, reservationId, onSuccess }) => {
    const { user } = useAuthContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedExhibitors, setSelectedExhibitors] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debounced search
    React.useEffect(() => {
        if (!isOpen) {
            if (searchQuery !== '') setSearchQuery('');
            if (searchResults.length > 0) setSearchResults([]);
            if (selectedExhibitors.length > 0) setSelectedExhibitors([]);
            return;
        }

        const fetchUsers = async () => {
            if (!user?.token) return;

            setIsSearching(true);
            try {
                const response = await axios.get(`${BACKEND_URL}/api/user/sponsors?search=${searchQuery}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                
                // Filter out already selected users and the current user
                const filtered = response.data.filter(u => 
                    u._id !== user._id && 
                    !selectedExhibitors.find(se => se._id === u._id)
                );
                setSearchResults(filtered);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchUsers, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, user?.token, isOpen, selectedExhibitors, user._id]);

    if (!isOpen) return null;

    const handleAddUser = (foundUser) => {
        if (!selectedExhibitors.find(e => e._id === foundUser._id)) {
            setSelectedExhibitors([...selectedExhibitors, foundUser]);
            setSearchResults(searchResults.filter(u => u._id !== foundUser._id));
        }
        setSearchQuery('');
    };

    const handleRemoveUser = (id) => {
        setSelectedExhibitors(selectedExhibitors.filter(u => u._id !== id));
    };

    const handleSubmit = async () => {
        if (selectedExhibitors.length === 0) return;
        if (!user?.token || !reservationId) return;

        const result = await showConfirmAlert(
            "Add Exhibitors?",
            `Are you sure you want to add these ${selectedExhibitors.length} exhibitor(s)?`,
            "Yes, Add Them"
        );

        if (result.isConfirmed) {
            setIsSubmitting(true);
            try {
                const userIds = selectedExhibitors.map(e => e._id);
                await axios.post(`${BACKEND_URL}/api/reservations/${reservationId}/exhibitors`, 
                    { userIds }, 
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );
                await showSuccessAlert("Added", "Exhibitors have been added successfully.");
                if (onSuccess) onSuccess();
                onClose();
            } catch (error) {
                console.error("Add exhibitors error:", error);
                const msg = error.response?.data?.error || "Failed to add exhibitors";
                showErrorAlert("Error", msg);
            } finally {
                setIsSubmitting(false);
            }
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

                        {isSearching && <p className="smaller-body-text text-secondary" style={{marginTop: '10px'}}>Searching...</p>}
                        
                        {searchResults.length > 0 && !isSearching && (
                            <div className="add-exhibitor-search-results">
                                {searchResults.map((foundUser) => (
                                    <div key={foundUser._id} className="add-exhibitor-search-item">
                                        <div className="add-exhibitor-info-wrapper">
                                            {foundUser.avatar ? (
                                                <img src={foundUser.avatar.startsWith('http') ? foundUser.avatar : `${BACKEND_URL}${foundUser.avatar}`} alt="Avatar" className="add-exhibitor-avatar" style={{width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover'}} />
                                            ) : (
                                                <div className="add-exhibitor-avatar">
                                                    {foundUser.firstName ? foundUser.firstName[0].toUpperCase() : 'U'}
                                                </div>
                                            )}
                                            <div className="add-exhibitor-details">
                                                <span className="regular-body-text exhibitor-name">{foundUser.firstName} {foundUser.lastName}</span>
                                                <span className="smaller-body-text text-secondary">{foundUser.email}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="outlined-button add-exhibitor-add-small-btn"
                                            onClick={() => handleAddUser(foundUser)}
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {searchQuery && searchResults.length === 0 && !isSearching && (
                            <p className="smaller-body-text text-secondary" style={{marginTop: '10px'}}>No users found.</p>
                        )}
                    </div>

                    <div className="add-exhibitor-list-section">
                        <div className="add-exhibitor-list">
                            {selectedExhibitors.map((promoter, index) => (
                                <div key={promoter._id} className="add-exhibitor-item">
                                    <div className="add-exhibitor-info-wrapper">
                                        {promoter.avatar ? (
                                            <img src={promoter.avatar.startsWith('http') ? promoter.avatar : `${BACKEND_URL}${promoter.avatar}`} alt="Avatar" className="add-exhibitor-avatar" style={{width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover'}} />
                                        ) : (
                                            <div className="add-exhibitor-avatar">
                                                {promoter.firstName ? promoter.firstName[0].toUpperCase() : 'U'}
                                            </div>
                                        )}
                                        <div className="add-exhibitor-details">
                                            <span className="regular-body-text exhibitor-name">{promoter.firstName} {promoter.lastName}</span>
                                            <span className="smaller-body-text text-secondary">{promoter.email}</span>
                                        </div>
                                    </div>
                                    <button className="add-exhibitor-delete-btn" onClick={() => handleRemoveUser(promoter._id)}>
                                        <Icon icon="mdi:trash-can-outline" width="20" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="add-exhibitor-modal-footer">
                    <button className="primary-button add-exhibitor-submit-btn" onClick={handleSubmit} disabled={isSubmitting || selectedExhibitors.length === 0}>
                        {isSubmitting ? 'Adding...' : 'Add Exhibitors'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SponsorAddExhibitor;
