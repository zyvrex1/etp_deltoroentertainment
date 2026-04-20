import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './PromoterCollaboratorsModal.css';

const PromoterCollaboratorsModal = ({ isOpen, onClose, currentCollaborators = [], onAssign }) => {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

    // Sub-component for resilient avatar rendering
    const Avatar = ({ person }) => {
        const [imgError, setImgError] = useState(false);
        const avatarPath = person.avatar;
        
        const getFullUrl = (path) => {
            if (!path) return null;
            if (path.startsWith('http') || path.startsWith('data:')) return path;
            const cleanPath = path.startsWith('/') ? path : `/${path}`;
            return `${backendUrl}${cleanPath}`;
        };

        const avatarUrl = !imgError ? getFullUrl(avatarPath) : null;

        if (avatarUrl) {
            return (
                <div className="result-avatar has-image">
                    <img 
                        src={avatarUrl} 
                        alt="" 
                        onError={() => setImgError(true)} 
                    />
                </div>
            );
        }

        return (
            <div className="result-avatar">
                {person.firstName?.[0]}{person.lastName?.[0]}
            </div>
        );
    };

    // Fetch suggested promoters on mount or when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchSuggestions();
        }
    }, [isOpen]);

    const fetchSuggestions = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/user/promoters`, {
                headers: {
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user'))?.token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setSuggestions(data.slice(0, 5)); // Show top 5 as suggestions
            }
        } catch (err) {
            console.error("Suggestions error:", err);
        }
    };

    useEffect(() => {
        const fetchResults = async () => {
            if (search.length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const response = await fetch(`${backendUrl}/api/user/promoters?search=${search}`, {
                    headers: {
                        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user'))?.token}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setResults(data);
                }
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [search]);

    if (!isOpen) return null;

    const displayList = search.length >= 2 
        ? results 
        : suggestions.filter(s => !currentCollaborators.some(c => (c._id || c) === (s._id || s)));

    const isSearchMode = search.length >= 2;

    return (
        <div className="promoter-modal-overlay" onClick={onClose}>
            <div className="promoter-modal-container collaborators-modal" onClick={(e) => e.stopPropagation()}>
                <div className="p-modal-header">
                    <h3>Invite a Promoter</h3>
                    <button className="p-modal-close" onClick={onClose}>
                        <Icon icon="solar:close-circle-bold-duotone" width="24" />
                    </button>
                </div>

                <div className="p-modal-body" style={{ paddingBottom: '20px' }}>
                    <div className="search-box">
                        <Icon icon="solar:magnifer-linear" />
                        <input 
                            type="text" 
                            placeholder="Type a name or email address..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="search-results">
                        <div className="search-header-label">
                            {isSearchMode ? `Search Results (${results.length})` : "Suggested Promoters"}
                        </div>

                        {loading && (
                            <div className="search-loading">
                                <Icon icon="line-md:loading-twotone-loop" width="48" />
                            </div>
                        )}
                        
                        {!loading && displayList.length > 0 && (
                            <div className="results-list">
                                {displayList.map(promoter => {
                                    const isAlreadyAdded = currentCollaborators.some(c => (c._id || c) === (promoter._id || promoter));
                                    return (
                                        <div key={promoter._id} className="result-item">
                                            <div className="result-info">
                                                <Avatar person={promoter} />
                                                <div className="result-text">
                                                    <span className="result-name">{promoter.firstName} {promoter.lastName}</span>
                                                    <span className="result-email">{promoter.email}</span>
                                                </div>
                                            </div>
                                            <button 
                                                className={`add-promoter-btn ${isAlreadyAdded ? 'added' : ''}`}
                                                onClick={() => !isAlreadyAdded && onAssign(promoter)}
                                                disabled={isAlreadyAdded}
                                            >
                                                {isAlreadyAdded ? (
                                                    <>
                                                        <Icon icon="solar:check-circle-bold-duotone" width="20" />
                                                        <span>Added</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Icon icon="solar:add-circle-bold-duotone" width="20" />
                                                        <span>Add Promoter</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {!loading && isSearchMode && results.length === 0 && (
                            <div className="no-results">
                                <Icon icon="solar:user-block-linear" width="64" />
                                <p>We couldn't find any promoters matching "<strong>{search}</strong>"</p>
                            </div>
                        )}
                        
                        {!loading && !isSearchMode && suggestions.length === 0 && (
                            <div className="search-placeholder">
                                <Icon icon="solar:user-speak-bold-duotone" width="80" />
                                <p>Start typing to find and invite promoters to collaborate on this event.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoterCollaboratorsModal;
