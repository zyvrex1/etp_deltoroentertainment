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

    const handleNotifClick = (notif) => {
        if (notif.unread) {
            onMarkAsRead(notif._id);
        }
        // Add navigation logic if needed
        onClose();
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
                            <div className={`notif-icon-box ${notif.type}`}>
                                <Icon icon={iconMap[notif.type] || "mdi:bell-outline"} />
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
