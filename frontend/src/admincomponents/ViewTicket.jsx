import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useAuthContext } from '../hooks/useAuthContext';
import { io } from 'socket.io-client';
import concernService from '../services/concernService';
import { showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';
import './ViewTicket.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const ViewTicket = ({ ticket: initialTicket, onUpdateStatus, onUpdatePriority, onBack }) => {
    const { user } = useAuthContext();
    const messagesEndRef = useRef(null);
    const [ticket, setTicket] = useState(initialTicket);
    const [replyText, setReplyText] = useState('');
    const [replyFiles, setReplyFiles] = useState([]);
    const [noteText, setNoteText] = useState('');
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editText, setEditText] = useState('');
    const [loading, setLoading] = useState(false);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [ticket.messages]);

    useEffect(() => {
        setTicket(initialTicket);
    }, [initialTicket]);

    useEffect(() => {
        if (!user?.token || !ticket?._id) return;
        const socket = io(BACKEND_URL);

        socket.on('newMessage', (data) => {
            if (data.concernId === ticket._id) {
                setTicket(prev => ({
                    ...prev,
                    messages: [...prev.messages, data.message]
                }));
            }
        });

        socket.on('statusUpdate', (data) => {
            if (data.concernId === ticket._id) {
                setTicket(prev => ({
                    ...prev,
                    status: data.status,
                    priority: data.priority || prev.priority,
                    messages: [...prev.messages, data.message]
                }));
            }
        });

        socket.on('concernAssigned', (data) => {
            if (data.concernId === ticket._id) {
              setTicket(prev => ({
                ...prev,
                assignedTo: data.assignedTo,
                assignedName: data.assignedName,
                messages: [...prev.messages, data.message]
              }))
            }
        });

        return () => socket.disconnect();
    }, [user, ticket?._id]);

    const handleStatusChange = (e) => {
        onUpdateStatus(ticket._id, e.target.value);
    };

    const handlePriorityChange = (e) => {
        onUpdatePriority(ticket._id, e.target.value);
    };

    const handleReply = async () => {
        if (!replyText.trim() && replyFiles.length === 0) return;
        if (!user?.token) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('text', replyText);
            replyFiles.forEach(file => {
                formData.append('attachments', file);
            });

            const updated = await concernService.addMessage(ticket._id, formData, user.token);
            setReplyText("");
            setReplyFiles([]);
            setTicket(updated);
        } catch (error) {
            showErrorAlert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!noteText.trim() || !user?.token) return;
        setLoading(true);
        try {
            const updated = await concernService.addInternalNote(ticket._id, noteText, user.token);
            setNoteText("");
            setTicket(updated);
            showSuccessAlert("Success", "Internal note added.");
        } catch (error) {
            showErrorAlert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateNote = async (noteId) => {
        if (!editText.trim() || !user?.token) return;
        setLoading(true);
        try {
            const updated = await concernService.updateInternalNote(ticket._id, noteId, editText, user.token);
            setEditingNoteId(null);
            setEditText("");
            setTicket(updated);
            showSuccessAlert("Success", "Note updated.");
        } catch (error) {
            showErrorAlert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!user?.token) return;
        const confirm = window.confirm("Delete this internal note?");
        if (!confirm) return;
        
        setLoading(true);
        try {
            const updated = await concernService.deleteInternalNote(ticket._id, noteId, user.token);
            setTicket(updated);
            showSuccessAlert("Success", "Note deleted.");
        } catch (error) {
            showErrorAlert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!ticket) return null;

    // Aggregate all attachments from the initial ticket and all messages
    const allAttachments = [
        ...(ticket.attachments || []),
        ...ticket.messages.reduce((acc, msg) => [...acc, ...(msg.attachments || [])], [])
    ];

    return (
        <div className="vt-page">
            <div className="vt-header-container">
                <button className="vt-back-btn" onClick={onBack}>
                    <Icon icon="mdi:arrow-left" width="24" height="24" />
                </button>
                <div className="vt-header-titles">
                    <div className="vt-title-row">
                        <h2>{ticket.subject}</h2>
                    </div>
                    <p className="small-body-text vt-subtitle">
                        #{ticket._id.slice(-6).toUpperCase()} • Opened {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="vt-grid">
                <div className="vt-col-left">
                    <div className="vt-card">
                        <h6 className="vt-card-heading">SUBMITTED BY</h6>
                        <div className="vt-user-info">
                            <div className="vt-avatar">
                                {ticket.sponsorName.charAt(0)}
                            </div>
                            <div className="vt-user-details">
                                <div className="vt-user-name-row">
                                    <span className="regular-body-text fw-600">{ticket.sponsorName}</span>
                                    <span className={`button-label vt-badge-${ticket.userRole || 'sponsor'}`}>{(ticket.userRole || 'sponsor').toUpperCase()}</span>
                                </div>
                                <div className="vt-contact-row">
                                    <Icon icon="mdi:email-outline" />
                                    <span className="small-body-text">
                                        ID: {ticket.sponsorId.slice(-8)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="vt-card">
                        <h6 className="vt-card-heading">RELATED EVENT</h6>
                        <div className="vt-event-info">
                            <Icon icon="mdi:calendar-outline" className="vt-icon-red" width="20" height="20" />
                            <span className="regular-body-text fw-600">{ticket.event || "No related event"}</span>
                        </div>
                    </div>

                    <div className="vt-card">
                        <h6 className="vt-card-heading">TICKET DETAILS</h6>
                        <div className="vt-detail-row">
                            <span className="small-body-text vt-label">Status</span>
                            <select 
                                value={ticket.status} 
                                onChange={handleStatusChange} 
                                className={`button-label vt-select-status vt-badge-${ticket.status.toLowerCase().replace(' ', '-')}`}
                                disabled={!ticket.assignedTo}
                                title={!ticket.assignedTo ? "Please assign an admin before updating status" : ""}
                            >
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>
                        <div className="vt-detail-row">
                            <span className="small-body-text vt-label">Priority</span>
                            <select 
                                value={ticket.priority?.toLowerCase() || 'medium'} 
                                onChange={handlePriorityChange} 
                                className={`button-label vt-select-priority vt-badge-${ticket.priority?.toLowerCase() || 'medium'}`}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="vt-detail-row">
                            <span className="small-body-text vt-label">Category</span>
                            <span className="small-body-text vt-category-val"><Icon icon="mdi:tag-outline" /> {ticket.category}</span>
                        </div>

                        <div className="vt-divider"></div>

                        <div className="vt-detail-row vt-assigned-header">
                            <span className="small-body-text vt-label">Assigned To</span>
                        </div>
                        <div className="vt-assignee">
                            <div className="vt-avatar-small vt-avatar-red">{ticket.assignedName?.charAt(0) || 'U'}</div>
                            <span className="regular-body-text fw-600">{ticket.assignedName || 'Unassigned'}</span>
                        </div>
                    </div>

                    <div className="vt-card">
                        <h6 className="vt-card-heading"><Icon icon="mdi:paperclip" width="16" /> ATTACHMENTS ({allAttachments.length})</h6>
                        {allAttachments.length > 0 ? (
                            allAttachments.map((file, idx) => (
                                <div key={idx} className="vt-attachment">
                                    <div className="vt-att-icon">
                                        <Icon icon={file.name.endsWith('.pdf') ? "mdi:file-pdf-box" : "mdi:file-document-outline"} width="24" className="vt-icon-gray" />
                                    </div>
                                    <div className="vt-attach-info">
                                        <span className="small-body-text fw-600">{file.name}</span>
                                        <span className="smaller-body-text">{file.size || 'Unknown size'}</span>
                                    </div>
                                    <a href={file.path?.startsWith('http') ? file.path : `${BACKEND_URL}/${file.path}`} target="_blank" rel="noopener noreferrer" className="vt-download-icon">
                                        <Icon icon="mdi:download-outline" />
                                    </a>
                                </div>
                            ))
                        ) : (
                            <p className="smaller-body-text text-muted" style={{ padding: '8px 4px' }}>No attachments provided.</p>
                        )}
                    </div>
                </div>

                <div className="vt-col-right">
                    <div className="vt-card vt-chat-card">
                        <h6 className="vt-card-heading"><Icon icon="mdi:message-outline" width="18" /> Conversation</h6>
                        <div className="vt-chat-area">
                            {ticket.messages.map((msg, idx) => {
                                const isMe = msg.sender === user?._id;
                                const isSystem = msg.isSystem;
                                
                                if (isSystem) {
                                    return (
                                        <div key={msg._id || idx} className="vt-system-message">
                                            <span className="smaller-body-text">{msg.text} • {new Date(msg.createdAt).toLocaleString()}</span>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg._id || idx} className={`vt-message-wrapper ${isMe ? 'right' : 'left'}`}>
                                        <span className={`small-body-text vt-chat-name ${isMe ? 'right-align' : ''}`}>{msg.senderName}</span>
                                        <div className={`vt-message-bubble ${isMe ? 'admin-message' : 'user-message'}`}>
                                            <p className="regular-body-text">{msg.text}</p>
                                            
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="vt-message-attachments">
                                                    {msg.attachments.map((att, i) => (
                                                        <div key={i} className="vt-message-att-item">
                                                            <Icon 
                                                                icon={att.name.toLowerCase().endsWith('.pdf') ? "mdi:file-pdf-box" : "mdi:file-document-outline"} 
                                                                className={`vt-att-file-icon ${att.name.toLowerCase().endsWith('.pdf') ? 'text-red' : 'text-blue'}`} 
                                                            />
                                                            <span className="smaller-body-text">{att.name}</span>
                                                            <a href={att.path?.startsWith('http') ? att.path : `${BACKEND_URL}/${att.path}`} target="_blank" rel="noopener noreferrer" className="vt-att-link">
                                                                <Icon icon="mdi:eye-outline" />
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className={`smaller-body-text vt-message-time ${isMe ? 'right-align' : ''}`}>{new Date(msg.createdAt).toLocaleString()}</span>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="vt-reply-area">
                            <textarea
                                placeholder="Type your reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="vt-reply-input regular-body-text"
                                disabled={loading || ticket.status === 'resolved' || ticket.status === 'closed'}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        handleReply();
                                    }
                                }}
                            />
                            
                            {replyFiles.length > 0 && (
                                <div className="vt-reply-files-preview">
                                    {replyFiles.map((file, idx) => (
                                        <div key={idx} className="vt-reply-file-item">
                                            <Icon icon="mdi:paperclip" />
                                            <span className="smaller-body-text">{file.name}</span>
                                            <Icon 
                                                icon="mdi:close" 
                                                className="vt-remove-file" 
                                                onClick={() => setReplyFiles(replyFiles.filter((_, i) => i !== idx))} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="vt-reply-actions">
                                <div className="vt-reply-actions-left">
                                    <button 
                                        className="vt-attach-btn"
                                        onClick={() => document.getElementById('vt-reply-upload').click()}
                                        disabled={loading || ticket.status === 'resolved' || ticket.status === 'closed'}
                                    >
                                        <Icon icon="mdi:paperclip" width="20" />
                                    </button>
                                    <input 
                                        type="file" 
                                        id="vt-reply-upload" 
                                        multiple 
                                        style={{ display: 'none' }}
                                        onChange={(e) => setReplyFiles([...replyFiles, ...Array.from(e.target.files)])}
                                    />
                                    <span className="smaller-body-text vt-hint-text">Press Ctrl+Enter to send</span>
                                </div>
                                <button 
                                    className="primary-button vt-reply-btn" 
                                    onClick={handleReply}
                                    disabled={loading || (!replyText.trim() && replyFiles.length === 0) || ticket.status === 'resolved' || ticket.status === 'closed'}
                                >
                                    <Icon icon={loading ? "mdi:loading" : "mdi:send"} color="white" width="16" className={loading ? "spin" : ""} />
                                    {loading ? "Sending..." : "Reply"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="vt-card vt-internal-notes">
                        <div className="vt-notes-header">
                            <h6 className="vt-card-heading vt-orange-heading"><Icon icon="mdi:lock-outline" width="18" /> Internal Notes</h6>
                            <span className="button-label vt-badge-admin">ADMIN ONLY</span>
                        </div>

                        <div className="vt-notes-list">
                            {ticket.internalNotes && ticket.internalNotes.length > 0 ? (
                                ticket.internalNotes.map((note) => (
                                    <div key={note._id} className="vt-note">
                                        <div className="vt-note-header">
                                            <div className="vt-avatar-small vt-avatar-orange">{note.adminName?.charAt(0) || 'A'}</div>
                                            <div className="vt-note-user">
                                                <span className="regular-body-text fw-600">{note.adminName}</span>
                                                <span className="smaller-body-text">{new Date(note.createdAt).toLocaleString()}</span>
                                            </div>
                                            <div className="vt-note-actions">
                                                <Icon 
                                                    icon="mdi:pencil-outline" 
                                                    className="vt-edit-icon" 
                                                    onClick={() => {
                                                        setEditingNoteId(note._id);
                                                        setEditText(note.text);
                                                    }} 
                                                />
                                                <Icon 
                                                    icon="mdi:trash-can-outline" 
                                                    className="vt-delete-icon" 
                                                    onClick={() => handleDeleteNote(note._id)}
                                                />
                                            </div>
                                        </div>

                                        {editingNoteId === note._id ? (
                                            <div className="vt-edit-note-form">
                                                <textarea 
                                                    className="vt-note-input" 
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                ></textarea>
                                                <div className="vt-edit-actions">
                                                    <button className="text-btn" onClick={() => setEditingNoteId(null)}>Cancel</button>
                                                    <button className="primary-button-small" onClick={() => handleUpdateNote(note._id)}>Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="small-body-text">{note.text}</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="smaller-body-text text-muted" style={{ padding: '10px 0' }}>No internal notes yet.</p>
                            )}
                        </div>

                        <div className="vt-add-note">
                            <textarea 
                                placeholder="Add a private internal note..." 
                                className="small-body-text vt-note-input" 
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                            ></textarea>
                            <div className="vt-add-note-action">
                                <button 
                                    className="vt-add-note-btn primary-button"
                                    onClick={handleAddNote}
                                    disabled={loading || !noteText.trim()}
                                >
                                    Add Note
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewTicket;
