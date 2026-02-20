import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './ViewTicketModal.css';

const ViewTicketModal = ({ isOpen, onClose, ticket, onUpdateStatus }) => {
    if (!isOpen || !ticket) return null;

    const [replyText, setReplyText] = useState('');

    const handleUpdateClick = () => {
        let newStatus = 'open';
        if (ticket.status === 'open') newStatus = 'in-progress';
        else if (ticket.status === 'in-progress') newStatus = 'resolved';
        // if resolved, maybe stays resolved or goes back to open? User status 'from open to in progress to resolved'.
        // Assuming terminal state 'resolved' doesn't loop automatically, but for functionality sake I will just make it loop back to open or stay resolved?
        // User request: "open to in progress to resolved". 
        // I will implement: Open -> In Progress -> Resolved -> (Disable button or Loop?)
        // Let's loop for demo purposes or stop. User phrasing "to resolved" implies end. 
        // But to make it testable, maybe loop? Or just check current status.

        if (ticket.status === 'resolved') return; // Do nothing or reopen? Let's stop at resolved.

        onUpdateStatus(ticket.id, newStatus);
    };

    const getButtonText = () => {
        if (ticket.status === 'open') return 'Update Status'; // to In Progress
        if (ticket.status === 'in-progress') return 'Update Status'; // to Resolved
        if (ticket.status === 'resolved') return 'Resolved';
        return 'Update Status';
    };

    const isUpdateDisabled = ticket.status === 'resolved';

    return (
        <div className="ticket-modal-overlay" onClick={onClose}>
            <div className="ticket-modal-container" onClick={e => e.stopPropagation()}>
                <div className="ticket-modal-header">
                    <h3>Ticket #{ticket.id}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" height="24" />
                    </button>
                </div>

                <div className="ticket-modal-body">
                    <div className="ticket-info">
                        <h4>{ticket.subject}</h4>
                        <p className='small-body-text'>Opened by {ticket.user} on {ticket.created}</p>
                    </div>

                    <div className="chat-area">
                        {/* Mock Messages */}
                        <div className="message-wrapper left">
                            <div className="message-bubble user-message">
                                <p className='regular-body-text'>I need a refund for my ticket.</p>
                            </div>
                            <span className="smaller-body-text left-message-time">2026-01-02 10:00</span>
                        </div>

                        {ticket.status !== 'open' && (
                            <div className="message-wrapper right">
                                <div className="message-bubble admin-message">
                                    <p className='regular-body-text'>Working on it</p>
                                </div>
                                <span className="smaller-body-text right-message-time">2026-01-02 10:02</span>
                            </div>
                        )}
                    </div>

                    <div className="reply-area">
                        <input
                            type="text"
                            placeholder="Type your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        />
                        <button className="primary-button reply-btn">
                            <Icon icon="mdi:send" color="white" />
                            Reply
                        </button>
                    </div>
                </div>

                <div className="general-ticket-modal-footer">
                    <button className="outlined-button closeticket-btn" onClick={onClose}>Close Ticket</button>
                    <button
                        className={`primary-button update-status-btn ${isUpdateDisabled ? 'disabled' : ''}`}
                        onClick={handleUpdateClick}
                        disabled={isUpdateDisabled}
                    >
                        {getButtonText()}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewTicketModal;
