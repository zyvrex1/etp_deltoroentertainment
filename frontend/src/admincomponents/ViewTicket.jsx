import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './ViewTicket.css';

const ViewTicket = ({ ticket, onUpdateStatus, onBack }) => {
    const [replyText, setReplyText] = useState('');

    if (!ticket) return null;

    const handleStatusChange = (e) => {
        onUpdateStatus(ticket.id, e.target.value);
    };

    return (
        <div className="vt-page">
            <div className="vt-header-container">
                <button className="vt-back-btn" onClick={onBack}>
                    <Icon icon="mdi:arrow-left" width="24" height="24" />
                </button>
                <div className="vt-header-titles">
                    <div className="vt-title-row">
                        <h2>{ticket.subject}</h2>
                        <span className="button-label vt-badge-medium">medium</span>
                        <span className={`button-label vt-badge-status vt-badge-${ticket.status}`}>{ticket.status}</span>
                    </div>
                    <p className="small-body-text vt-subtitle">
                        #{ticket.id.toString().padStart(2, "0")} • Opened {ticket.created}
                    </p>
                </div>
            </div>

            <div className="vt-grid">
                <div className="vt-col-left">
                    <div className="vt-card">
                        <h6 className="vt-card-heading">SUBMITTED BY</h6>
                        <div className="vt-user-info">
                            <div className="vt-avatar">{ticket.user.charAt(0)}</div>
                            <div className="vt-user-details">
                                <div className="vt-user-name-row">
                                    <span className="regular-body-text fw-600">{ticket.user}</span>
                                    <span className="button-label vt-badge-customer">CUSTOMER</span>
                                </div>
                                <span className="small-body-text vt-contact-row"><Icon icon="mdi:email-outline" /> {ticket.user.toLowerCase().replace(' ', '')}@gmail.com</span>
                                <span className="small-body-text vt-contact-row"><Icon icon="mdi:phone-outline" /> +1 (555) 0401</span>
                            </div>
                        </div>
                    </div>

                    <div className="vt-card">
                        <h6 className="vt-card-heading">RELATED EVENT</h6>
                        <div className="vt-event-info">
                            <Icon icon="mdi:calendar-outline" className="vt-icon-red" width="20" height="20" />
                            <span className="regular-body-text fw-600">TechStart Summit 2024</span>
                        </div>
                    </div>

                    <div className="vt-card">
                        <h6 className="vt-card-heading">TICKET DETAILS</h6>
                        <div className="vt-detail-row">
                            <span className="small-body-text vt-label">Status</span>
                            <div className="vt-status-dropdown-wrapper">
                                <select value={ticket.status} onChange={handleStatusChange} className="vt-select-status">
                                    <option value="open">Open</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                        </div>
                        <div className="vt-detail-row">
                            <span className="small-body-text vt-label">Priority</span>
                            <span className="button-label vt-badge-medium">medium</span>
                        </div>
                        <div className="vt-detail-row">
                            <span className="small-body-text vt-label">Category</span>
                            <span className="small-body-text vt-category-val"><Icon icon="mdi:tag-outline" /> Billing</span>
                        </div>
                        
                        <div className="vt-divider"></div>

                        <div className="vt-detail-row vt-assigned-header">
                            <span className="small-body-text vt-label">Assigned To</span>
                            <span className="small-body-text vt-reassign">Reassign</span>
                        </div>
                        <div className="vt-assignee">
                            <div className="vt-avatar-small vt-avatar-red">R</div>
                            <span className="regular-body-text fw-600">Robert Chen</span>
                        </div>
                    </div>

                    <div className="vt-card">
                        <h6 className="vt-card-heading"><Icon icon="mdi:paperclip" width="16" /> ATTACHMENTS</h6>
                        <div className="vt-attachment">
                            <div className="vt-att-icon">
                                <Icon icon="mdi:file-document-outline" width="24" className="vt-icon-gray" />
                            </div>
                            <div className="vt-attach-info">
                                <span className="small-body-text fw-600">receipt.pdf</span>
                                <span className="smaller-body-text">245 KB</span>
                            </div>
                        </div>
                        <div className="vt-attachment">
                            <div className="vt-att-icon">
                                <Icon icon="mdi:image-outline" width="24" className="vt-icon-gray" />
                            </div>
                            <div className="vt-attach-info">
                                <span className="small-body-text fw-600">screenshot.png</span>
                                <span className="smaller-body-text">1.2 MB</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="vt-col-right">
                    <div className="vt-card vt-chat-card">
                        <h6 className="vt-card-heading"><Icon icon="mdi:message-outline" width="18" /> Conversation</h6>
                        <div className="vt-chat-area">
                            <div className="vt-message-wrapper left">
                                <span className="small-body-text vt-chat-name">{ticket.user}</span>
                                <div className="vt-message-bubble user-message">
                                    <p className="regular-body-text">I need a refund for my VIP ticket to TechStart Summit. I can no longer attend due to a scheduling conflict. I purchased the ticket on September 15th.</p>
                                </div>
                                <span className="smaller-body-text vt-message-time">2024-10-02 10:00</span>
                            </div>

                            <div className="vt-message-wrapper right">
                                <span className="small-body-text vt-chat-name right-align">Robert Chen</span>
                                <div className="vt-message-bubble admin-message">
                                    <p className="regular-body-text">Hi {ticket.user.split(' ')[0]}, I can see your purchase. Let me review the refund policy for this event and get back to you shortly.</p>
                                </div>
                                <span className="smaller-body-text vt-message-time right-align">2024-10-02 11:30</span>
                            </div>

                            <div className="vt-message-wrapper left">
                                <span className="small-body-text vt-chat-name">{ticket.user}</span>
                                <div className="vt-message-bubble user-message">
                                    <p className="regular-body-text">Thank you! I attached the receipt for reference.</p>
                                </div>
                                <span className="smaller-body-text vt-message-time">2024-10-02 11:45</span>
                            </div>
                        </div>

                        <div className="vt-reply-area">
                            <textarea
                                placeholder="Type your reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="vt-reply-input regular-body-text"
                            />
                            <div className="vt-reply-actions">
                                <span className="smaller-body-text vt-hint-text">Press Ctrl+Enter to send</span>
                                <button className="primary-button vt-reply-btn">
                                    <Icon icon="mdi:send" color="white" width="16" />
                                    Reply
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="vt-card vt-internal-notes">
                        <div className="vt-notes-header">
                            <h6 className="vt-card-heading vt-orange-heading"><Icon icon="mdi:lock-outline" width="18" /> Internal Notes</h6>
                            <span className="button-label vt-badge-admin">ADMIN ONLY</span>
                        </div>
                        
                        <div className="vt-note">
                            <div className="vt-note-header">
                                <div className="vt-avatar-small vt-avatar-red">R</div>
                                <span className="small-body-text fw-600">Robert Chen</span>
                                <span className="smaller-body-text">2024-10-02 11:35</span>
                                <Icon icon="mdi:pencil-outline" className="vt-edit-icon" />
                            </div>
                            <p className="small-body-text">Checked refund policy — event allows refunds up to 7 days before. This is within the window. Proceeding with refund approval.</p>
                        </div>

                        <div className="vt-note">
                            <div className="vt-note-header">
                                <div className="vt-avatar-small vt-avatar-darkred">A</div>
                                <span className="small-body-text fw-600">Alex Thompson</span>
                                <span className="smaller-body-text">2024-10-02 14:00</span>
                                <Icon icon="mdi:pencil-outline" className="vt-edit-icon" />
                            </div>
                            <p className="small-body-text">Approved. Process the refund through the standard channel.</p>
                        </div>
                        
                        <div className="vt-add-note">
                            <input type="text" placeholder="Add an internal note..." className="small-body-text vt-note-input" />
                        </div>
                        <div className="vt-add-note-action">
                            <button className="vt-add-note-btn">+ Add Note</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewTicket;
