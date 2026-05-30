import React from 'react';
import { Icon } from '@iconify/react';
import './SponsorNotificationDropdown.css';

const SponsorNotificationDropdown = ({ notifications, onClose, onMarkAsRead, onMarkAllRead, onViewAll }) => {
    
   const iconMap = {
        concern: "mdi:chat-outline",
        payment: "mdi:wallet-outline",
        event: "mdi:calendar-outline",
        user: "mdi:account-plus-outline",
        update: "mdi:file-document-outline",
        reservation: "mdi:ticket-confirmation-outline",
        announcement: "mdi:bullhorn-outline",
        policy: "mdi:file-document-outline"
    };

    // Detect refund/cancel/reject from title to show a different icon
       const getIcon = (notif) => {
        const title = notif.title?.toLowerCase() || '';
        if (title.includes('refund')) return "mdi:cash-refund";
        if (title.includes('cancel')) return "mdi:cancel";
        if (title.includes('reject')) return "mdi:close-circle-outline";
        if (title.includes('confirmed') || title.includes('payment confirmed')) return "mdi:check-circle-outline";
        return iconMap[notif.type] || "mdi:bell-outline";
    };
 const handleNotifClick = (notif) => {
        if (notif.unread) {
            onMarkAsRead(notif._id);
        }
        onClose();
        if (notif.path) {
            window.location.href = notif.path;
        }
    };
    return (
        <div className="notif-dropdown">
            <div className="notif-header">
                <h5 className="notif-title">Notifications</h5>
                <button className="notif-mark-read" onClick={onMarkAllRead}>
                    <Icon icon="mdi:check-all" /> <span>Mark all read</span>
                </button>
            </div>

            <div className="notif-list">
                {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notif) => (
                        <div 
                            className={`notif-item ${notif.unread ? 'unread' : ''}`} 
                            key={notif._id}
                            onClick={() => handleNotifClick(notif)}
                        >
                            <div className="notif-status-dot"></div>
                           <div className={`notif-icon-box ${notif.type} ${
        notif.title?.toLowerCase().includes('refund') ? 'refund' :
        notif.title?.toLowerCase().includes('cancel') ? 'cancel' :
        notif.title?.toLowerCase().includes('reject') ? 'reject' :
        notif.title?.toLowerCase().includes('confirmed') ? 'confirmed' : ''
    }`}>
        <Icon icon={getIcon(notif)} />
    </div>
                            <div className="notif-content">
                                <p className="notif-text">
                                    <strong>{notif.title}</strong>: {notif.content}
                                </p>
                                <span className="smaller-body-text notif-date">
                                    {new Date(notif.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="notif-empty">No notifications</div>
                )}
            </div>

            <button className="view-all-notif-btn" onClick={() => { onClose(); onViewAll(); }}>
                View all notifications
            </button>
        </div>
    );
};

export default SponsorNotificationDropdown;
