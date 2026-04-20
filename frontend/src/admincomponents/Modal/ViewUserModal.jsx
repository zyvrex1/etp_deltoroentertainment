import { Icon } from '@iconify/react';
import './ViewUserModal.css';

const ViewUserModal = ({ isOpen, onClose, user, userType: propUserType }) => {
    if (!isOpen || !user) return null;

    // Map user data to modal-friendly format
    const mapUserForModal = (user) => {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.roleDetails?.companyName || 'User';
        const status = user.lastLogin
            ? (new Date() - new Date(user.lastLogin)) / (1000 * 60 * 60 * 24) <= 30
                ? 'active'
                : 'inactive'
            : 'inactive';

        const mapped = {
            ...user,
            name,
            status,
        };

        switch (user.role) {
            case 'customer':
                mapped.totalSpent = user.roleDetails?.totalSpent || '$0.00';
                mapped.tickets = user.ticketsPurchased || 0;
                break;
            case 'promoter':
                mapped.company = user.roleDetails?.companyName || 'N/A';
                mapped.phone = user.roleDetails?.phone || 'N/A';
                mapped.events = user.eventsManaged || 0;
                mapped.revenue = user.revenue || '$0.00';
                mapped.paidOut = user.paidOut || '$0.00';
                break;
            case 'sponsor':
                mapped.company = user.roleDetails?.companyName || 'N/A';
                mapped.phone = user.roleDetails?.phone || 'N/A';
                mapped.booths = user.boothsBooked || 0;
                mapped.totalSpent = user.roleDetails?.totalSpent || '$0.00';
                break;
            case 'admin':
                mapped.subText = 'Administrator';
                break;
            default:
                break;
        }

        return mapped;
    };

    const modalUser = mapUserForModal(user);

    // Determine user type
    let userType = propUserType;
    if (!userType) {
        if (modalUser.role) userType = modalUser.role;
        else if (modalUser.tickets !== undefined) userType = 'Customer';
        else if (modalUser.events !== undefined) userType = 'Promoter';
        else if (modalUser.booths !== undefined) userType = 'Sponsor';
        else userType = 'User';
    }

    const getInitial = (name) => {
    if (!name) return "U"; // fallback if name is missing
    const parts = name.trim().split(" "); // split by space
    const firstInitial = parts[0]?.charAt(0).toUpperCase() || "";
    const lastInitial = parts[1]?.charAt(0).toUpperCase() || "";
    return firstInitial + lastInitial;
    };
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

    const renderHeader = () => {
        let avatarClass = '';
        let icon = null;
        let subText = '';

        switch (userType.toLowerCase()) {
            case 'admin':
                avatarClass = 'admin';
                icon = null;
                subText = 'Administrator';
                break;
            case 'promoter':
                avatarClass = 'promoter';
                icon = "mdi:bullhorn-outline";
                subText = modalUser.company || 'Promoter Account';
                break;
            case 'sponsor':
                avatarClass = 'sponsor';
                icon = "mdi:office-building";
                subText = modalUser.company || 'Sponsor Partner';
                break;
            case 'customer':
            default:
                avatarClass = 'customer';
                icon = null;
                subText = 'Standard User';
                break;
        }

        const avatarPath = modalUser.avatar;
        const getFullUrl = (path) => {
            if (!path) return null;
            if (path.startsWith('http') || path.startsWith('data:')) return path;
            const cleanPath = path.startsWith('/') ? path : `/${path}`;
            return `${backendUrl}${cleanPath}`;
        };
        const avatarUrl = getFullUrl(avatarPath);

        return (
            <div className="user-profile-header">
                <div className={`profile-avatar ${avatarClass} ${avatarUrl ? 'has-image' : ''}`}>
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="profile-img-full" />
                    ) : (
                        icon ? <Icon icon={icon} /> : getInitial(modalUser.name)
                    )}
                </div>
                <div className="profile-info">
                    <h4>{modalUser.name}</h4>
                    <p className="small-body-text sub-text">{subText}</p>
                </div>
            </div>
        );
    };

    const renderCommonDetails = () => (
        <div className="info-grid">
            <div className="info-item">
                <h6 className="label"><Icon icon="mdi:email-outline" /> Email</h6>
                <span className="regular-body-text value">{modalUser.email || 'N/A'}</span>
            </div>
            <div className="info-item">
                <h6 className="label"><Icon icon="mdi:phone-outline" /> Phone</h6>
                <span className="regular-body-text value">{modalUser.phone || '+1 (555) 000-0000'}</span>
            </div>
            <div className="info-item">
                <h6 className="label"><Icon icon="mdi:calendar-outline" /> Joined</h6>
                <span className="regular-body-text value">
                    {modalUser.createdAt ? new Date(modalUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </span>
            </div>
            <div className="info-item">
                <h6 className="label"><Icon icon="mdi:check-circle-outline" /> Status</h6>
                <span className={`button-label value view-status-badge status-${modalUser.status}`}>{modalUser.status}</span>
            </div>
        </div>
    );

    const renderSpecificContent = () => {
        switch (userType.toLowerCase()) {
            case 'admin':
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
                                        <h6>Admin Access</h6>
                                        <p className="small-body-text">Full system control</p>
                                    </div>
                                </div>
                                <span className="button-label status-tag">Active</span>
                            </div>
                        </div>
                    </>
                );
            case 'customer':
                return (
                    <>
                        <div className="customer-stats-grid">
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Total Spent</span>
                                <h5 className="stat-value green">{modalUser.totalSpent}</h5>
                            </div>
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Tickets</span>
                                <h5 className="stat-value">{modalUser.tickets}</h5>
                            </div>
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Points</span>
                                <h5 className="stat-value">{modalUser.tickets * 150}</h5>
                            </div>
                        </div>
                    </>
                );
            case 'promoter':
                return (
                    <>
                        <div className="promoter-stats-grid">
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Revenue</span>
                                <h5 className="stat-value green">{modalUser.revenue}</h5>
                            </div>
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Events Managed</span>
                                <h5 className="stat-value">{modalUser.events}</h5>
                            </div>
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Paid Out</span>
                                <h5 className="stat-value">{modalUser.paidOut}</h5>
                            </div>
                        </div>
                    </>
                );
            case 'sponsor':
                return (
                    <>
                        <div className="sponsor-stats-grid">
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Total Investment</span>
                                <h5 className="stat-value green">{modalUser.totalSpent}</h5>
                            </div>
                            <div className="stat-card">
                                <span className="smaller-body-text stat-label">Booths Booked</span>
                                <h5 className="stat-value">{modalUser.booths}</h5>
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
                    <button className="close-button" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ViewUserModal;