import React from 'react';
import { Icon } from '@iconify/react';
import './ViewUserModal.css';

const ViewUserModal = ({ isOpen, onClose, user, userType: propUserType }) => {
    if (!isOpen || !user) return null;

    // Determine user type
    let userType = propUserType;
    if (!userType) {
        if (user.role) userType = user.role;
        else if (user.tickets !== undefined) userType = 'Customer';
        else if (user.events !== undefined) userType = 'Promoter';
        else if (user.booths !== undefined) userType = 'Sponsor';
        else userType = 'User';
    }

    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'U';
    };

    const renderHeader = () => {
        let avatarClass = '';
        let icon = null;
        let subText = '';

        switch (userType) {
            case 'Admin':
                avatarClass = 'admin';
                icon = null; // Uses initial
                subText = 'Administrator';
                break;
            case 'Promoter':
                avatarClass = 'promoter';
                icon = "mdi:bullhorn-outline";
                subText = user.contact || 'Promoter Account';
                break;
            case 'Sponsor':
                avatarClass = 'sponsor';
                icon = "mdi:office-building";
                subText = user.industry || 'Sponsor Partner';
                break;
            case 'Customer':
            default:
                avatarClass = 'customer';
                icon = null;
                subText = 'Standard User';
                break;
        }

        return (
            <div className="user-profile-header">
                <div className={`profile-avatar ${avatarClass}`}>
                    {icon ? <Icon icon={icon} /> : getInitial(user.name || user.company)}
                </div>
                <div className="profile-info">
                    <h4>{user.name || user.company}</h4>
                    <p className="small-body-text sub-text">{subText}</p>
                </div>
            </div>
        );
    };

    const renderCommonDetails = () => (
        <div className="info-grid">
            <div className="info-item">
                <h6 className="label"><Icon icon="mdi:email-outline" /> Email</h6>
                <span className="regular-body-text value">{user.email || user.contact || 'N/A'}</span>
            </div>
            <div className="info-item">
                <h6 className="label"><Icon icon="mdi:phone-outline" /> Phone</h6>
                <span className="regular-body-text value">{user.phone || '+1 (555) 000-0000'}</span>
            </div>
            <div className="info-item">
                <h6 className="label"><Icon icon="mdi:calendar-outline" /> Joined</h6>
                <span className="regular-body-text value">{user.joined || 'N/A'}</span>
            </div>
            <div className="info-item">
                <h6 className="label"><Icon icon="mdi:check-circle-outline" /> Status</h6>
                <span className={`button-label value view-status-badge status-${user.status}`}>{user.status}</span>
            </div>
        </div>
    );

    const renderSpecificContent = () => {
        switch (userType) {
            case 'Admin':
                return (
                    <>
                        <h5 className="info-section-title">Admin Permissions</h5>
                        <div className="list-section">
                            <div className="list-item">
                                <div className="item-left">
                                    <div className="item-icon">
                                        <Icon icon="mdi:shield-check" />
                                    </div>
                                    <div className="item-details">
                                        <h6>Super Admin Access</h6>
                                        <p className="small-body-text">Full system control</p>
                                    </div>
                                </div>
                                <span className="button-label status-tag">Active</span>
                            </div>
                        </div>
                    </>
                );
            case 'Customer':
                return (
                    <>
                        <div className="customer-stats-grid">
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Total Spent</span>
                                <h5 className="stat-value green">{user.totalSpent || '$0.00'}</h5>
                            </div>
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Tickets</span>
                                <h5 className="stat-value">{user.tickets || 0}</h5>
                            </div>
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Points</span>
                                <h5 className="stat-value">{(user.tickets || 0) * 150}</h5>
                            </div>
                        </div>

                        <h5 className="info-section-title" style={{ marginTop: '20px' }}>Recent Activity</h5>
                        <div className="list-section">
                            <div className="list-item">
                                <div className="item-left">
                                    <div className="item-icon">
                                        <Icon icon="mdi:ticket-outline" />
                                    </div>
                                    <div className="item-details">
                                        <h6>TechStart Summit 2026</h6>
                                        <p className="small-body-text">Jun 16, 2026</p>
                                    </div>
                                </div>
                                <h5 className="item-right-value">$299.00</h5>
                            </div>
                            <div className="list-item">
                                <div className="item-left">
                                    <div className="item-icon">
                                        <Icon icon="mdi:ticket-outline" />
                                    </div>
                                    <div className="item-details">
                                        <h6>Summer Music Festival</h6>
                                        <p className="small-body-text">Aug 20, 2025</p>
                                    </div>
                                </div>
                                <h5 className="item-right-value">$150.00</h5>
                            </div>
                        </div>
                    </>
                );
            case 'Promoter':
                return (
                    <>
                        <div className="promoter-stats-grid">
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Revenue</span>
                                <h5 className="stat-value green">{user.revenue || '$0.00'}</h5>
                            </div>
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Events Managed</span>
                                <h5 className="stat-value">{user.events || 0}</h5>
                            </div>
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Paid Out</span>
                                <h5 className="stat-value">{user.paidOut || '$0.00'}</h5>
                            </div>
                        </div>

                        <h5 className="info-section-title" style={{ marginTop: '20px' }}>Recent Events</h5>
                        <div className="list-section">
                            <div className="list-item">
                                <div className="item-left">
                                    <div className="item-icon">
                                        <Icon icon="mdi:calendar-check" />
                                    </div>
                                    <div className="item-details">
                                        <h6>TechStart Summit 2026</h6>
                                        <p className="small-body-text">Upcoming • 500 Attendees</p>
                                    </div>
                                </div>
                                <span className="button-label status-tag">Live</span>
                            </div>
                        </div>
                    </>
                );
            case 'Sponsor':
                return (
                    <>
                        <div className="sponsor-stats-grid">
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Total Investment</span>
                                <h5 className="stat-value green">{user.totalSpent || '$0.00'}</h5>
                            </div>
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Booths Booked</span>
                                <h5 className="stat-value">{user.booths || 0}</h5>
                            </div>
                        </div>

                        <h5 className="info-section-title" style={{ marginTop: '20px' }}>Active Booths</h5>
                        <div className="list-section">
                            <div className="list-item">
                                <div className="item-left">
                                    <div className="item-icon">
                                        <Icon icon="mdi:storefront-outline" />
                                    </div>
                                    <div className="item-details">
                                        <h6>Booth V1</h6>
                                        <p>VIP Section • $5,000.00</p>
                                    </div>
                                </div>
                                <span className="button-label status-tag" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>Booked</span>
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="view-user-modal-overlay" onClick={onClose}>
            <div className="view-user-modal-container" onClick={e => e.stopPropagation()}>
                <div className="view-user-modal-header">
                    <h3>User Details</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" height="24" />
                    </button>
                </div>
                <div className="view-user-modal-body">
                    {renderHeader()}
                    {renderCommonDetails()}
                    {renderSpecificContent()}
                </div>
                <div className="view-user-modal-footer">
                    <div className="footer-actions">
                    </div>
                    <button className="close-button" onClick={onClose}>Close</button>

                </div>
            </div>
        </div>
    );
};

export default ViewUserModal;
