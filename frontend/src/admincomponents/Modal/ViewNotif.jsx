import React from 'react';
import { Icon } from '@iconify/react';
import './ViewNotif.css';

const ViewNotif = ({ isOpen, onClose, notifications, onNotifClick }) => {
    if (!isOpen) return null;

    const handleItemClick = (path) => {
        onNotifClick(path);
        onClose();
    };

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
                            <button className="filter-btn active">All</button>
                            <button className="filter-btn">Unread</button>
                            <button className="filter-btn">Support</button>
                            <button className="filter-btn">Events</button>
                            <button className="filter-btn">Finance</button>
                        </div>
                        <button className="mark-all-read-btn">
                            <Icon icon="mdi:check-all" /> Mark all as read
                        </button>
                    </div>
                </div>

                <div className="view-notif-body">
                    <div className="notif-full-list">
                        {notifications.map((notif) => (
                            <div 
                                className={`notif-full-item ${notif.unread ? 'unread' : ''}`} 
                                key={notif.id}
                                onClick={() => handleItemClick(notif.path)}
                            >
                                <div className="notif-item-left">
                                    <div className="notif-status-indicator"></div>
                                    <div className={`notif-icon-container ${notif.type}`}>
                                        <Icon icon={notif.icon} />
                                    </div>
                                </div>
                                <div className="notif-item-center">
                                    <h4 className="notif-item-title">
                                        {notif.title}
                                    </h4>
                                    <p className="notif-item-content">{notif.content}</p>
                                    <span className="notif-item-date">{notif.date}</span>
                                </div>
                                <div className="notif-item-right">
                                    <button className="notif-action-btn">
                                        <Icon icon="mdi:dots-vertical" />
                                    </button>
                                </div>
                            </div>
                        ))}
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
