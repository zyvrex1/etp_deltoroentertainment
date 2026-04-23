import React from 'react';
import { Icon } from '@iconify/react';
import './ViewNotif.css';

const ViewNotif = ({ isOpen, onClose, notifications, onNotifClick }) => {
    const [activeFilter, setActiveFilter] = React.useState('All');

    if (!isOpen) return null;

    const iconMap = {
        concern: "mdi:chat-outline",
        payment: "mdi:wallet-outline",
        event: "mdi:calendar-outline",
        user: "mdi:account-plus-outline",
        update: "mdi:file-document-outline",
        reservation: "mdi:ticket-confirmation-outline"
    };

    const handleItemClick = (notif) => {
        onNotifClick(notif);
        onClose();
    };

    const filteredNotifications = notifications.filter(notif => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Unread') return notif.unread;
        if (activeFilter === 'Support') return notif.type === 'concern';
        if (activeFilter === 'Events') return notif.type === 'event';
        if (activeFilter === 'Finance') return notif.type === 'payment';
        if (activeFilter === 'Reservations') return notif.type === 'reservation';
        return true;
    });

    return (
        <div className="view-notif-overlay" onClick={onClose}>
            <div className="view-notif-modal" onClick={(e) => e.stopPropagation()}>
                <div className="view-notif-header">
                    <div className="header-top">
                        <h3 className="view-notif-title">Notifications</h3>
                        <button className="close-btn" onClick={onClose}>
                            <Icon icon="mdi:close" width="24" />
                        </button>
                    </div>
                    <div className="header-actions">
                        <div className="notif-filters">
                            {['All', 'Unread', 'Support', 'Events', 'Finance', 'Reservations'].map(filter => (
                                <button 
                                    key={filter}
                                    className={`filter-btn ${activeFilter === filter ? 'active' : ''} ${filter.toLowerCase()}`}
                                    onClick={() => setActiveFilter(filter)}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                        <button className="mark-all-read-btn">
                            <Icon icon="mdi:check-all" /> Mark all as read
                        </button>
                    </div>
                </div>

                <div className="view-notif-body">
                    <div className="notif-full-list">
                        {filteredNotifications.length > 0 ? (
                            filteredNotifications.map((notif) => (
                                <div 
                                    className={`notif-full-item ${notif.unread ? 'unread' : ''}`} 
                                    key={notif._id}
                                    onClick={() => handleItemClick(notif)}
                                >
                                    <div className="notif-item-left">
                                        <div className="notif-status-indicator"></div>
                                        <div className={`notif-icon-container ${notif.type}`}>
                                            <Icon icon={iconMap[notif.type] || "mdi:bell-outline"} />
                                        </div>
                                    </div>
                                    <div className="notif-item-center">
                                        <h4 className="notif-item-title">
                                            {notif.title}
                                        </h4>
                                        <p className="notif-item-content">{notif.content}</p>
                                        <span className="notif-item-date">
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="notif-item-right">
                                        <button className="notif-action-btn">
                                            <Icon icon="mdi:dots-vertical" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="notif-empty" style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>
                                No notifications found
                            </div>
                        )}
                    </div>
                </div>

                <div className="view-notif-footer">
                    <button className="settings-btn">
                        <Icon icon="mdi:cog-outline" /> Notification Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewNotif;
