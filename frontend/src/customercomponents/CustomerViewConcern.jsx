import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { io } from 'socket.io-client';
import { useAuthContext } from '../hooks/useAuthContext';
import concernService from '../services/concernService';
import { showErrorAlert, showSuccessAlert } from '../utils/sweetAlert';
import './CustomerViewConcern.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function CustomerViewConcern({ concern: initialConcern, onBack }) {
    const { user } = useAuthContext();
    const messagesEndRef = useRef(null);
    const [concern, setConcern] = useState(initialConcern);
    const [replyText, setReplyText] = useState("");
    const [replyFiles, setReplyFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [concern?.messages]);

    const fetchConcernDetails = async () => {
        if (!user?.token || !initialConcern?._id) return;
        try {
            const data = await concernService.getConcernById(initialConcern._id, user.token);
            setConcern(data);
        } catch (error) {
            console.error("Error fetching concern details:", error);
        }
    };

    useEffect(() => {
        fetchConcernDetails();
    }, [initialConcern?._id, user]);

    useEffect(() => {
        if (!user?.token || !concern?._id) return;
        const socket = io(BACKEND_URL);

        socket.on('newMessage', (data) => {
            if (data.concernId === concern._id) {
                const maskedMessage = { ...data.message };
                // Mask admin name
                if (maskedMessage.sender !== user._id && !maskedMessage.isSystem && maskedMessage.senderName !== 'System') {
                    maskedMessage.senderName = 'Admin';
                }
                setConcern(prev => ({
                    ...prev,
                    messages: [...prev.messages, maskedMessage]
                }));
            }
        });

        socket.on('statusUpdate', (data) => {
            if (data.concernId === concern._id) {
                const maskedMessage = { ...data.message };
                if (maskedMessage.isSystem && maskedMessage.text.toLowerCase().includes('assigned to')) {
                    maskedMessage.text = 'Concern has been assigned to a support agent';
                }

                setConcern(prev => ({
                    ...prev,
                    status: data.status,
                    priority: data.priority || prev.priority,
                    messages: [...prev.messages, maskedMessage]
                }));
            }
        });
        
        socket.on('concernAssigned', (data) => {
            if (data.concernId === concern._id) {
                const maskedMessage = { ...data.message };
                if (maskedMessage.isSystem && maskedMessage.text.toLowerCase().includes('assigned to')) {
                    maskedMessage.text = 'Concern has been assigned to a support agent';
                }
                
                setConcern(prev => ({
                    ...prev,
                    assignedName: 'Staff',
                    messages: [...prev.messages, maskedMessage]
                }));
            }
        });
        
        return () => socket.disconnect();
    }, [user, concern?._id]);

    if (!concern) return null;

    // Aggregate all attachments from the initial ticket and all messages
    const allAttachments = [
        ...(concern.attachments || []),
        ...concern.messages.reduce((acc, msg) => [...acc, ...(msg.attachments || [])], [])
    ];

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

            await concernService.addMessage(concern._id, formData, user.token);
            setReplyText("");
            setReplyFiles([]);
            showSuccessAlert("Success", "Reply sent.");
        } catch (error) {
            showErrorAlert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!concern) return null;

    const originalRequest = {
        id: concern._id.slice(-6).toUpperCase(),
        category: concern.category,
        status: concern.status,
        description: concern.description,
        attachedFiles: concern.attachments || []
    };

    return (
        <div className="cvc-container fade-in">
            {/* BREADCRUMB */}
            <div className="cvc-breadcrumb smaller-body-text">
                <span className="cvc-breadcrumb-link" onClick={onBack}>My Concerns</span>
                <Icon icon="mdi:chevron-right" />
                <span className="cvc-breadcrumb-current">{originalRequest.id}</span>
            </div>

            {/* HEADER */}
            <div className="cvc-header">
                <button className="cvc-back-icon-btn" onClick={onBack}>
                    <Icon icon="mdi:arrow-left" width="20" />
                </button>
                <div className="cvc-header-info">
                    <div className="cvc-title-row">
                        <h2 className="cvc-page-title">{concern.subject}</h2>
                        <span className={`button-label cvc-status-pill ${originalRequest.status.toLowerCase().replace(' ', '-')}`}>
                            {originalRequest.status}
                        </span>
                    </div>
                    <p className="cvc-metadata smaller-body-text text-secondary">
                        Submitted on {new Date(concern.createdAt).toLocaleString()} • {originalRequest.category}
                    </p>
                </div>
            </div>

            <div className="cvc-main-content">
                {/* LEFT COLUMN: ORIGINAL REQUEST (METADATA) */}
                <div className="cvc-left-col">
                    <h6 className="cvc-card-heading">Original Request</h6>
                    <div className="cvc-request-card">
                        <div className="cvc-detail-group">
                            <label className="cvc-detail-label smaller-body-text text-secondary">CONCERN ID</label>
                            <span className="cvc-detail-value regular-body-text fw-600">#{originalRequest.id}</span>
                        </div>
                        <div className="cvc-detail-group">
                            <label className="cvc-detail-label smaller-body-text text-secondary">CATEGORY</label>
                            <span className="cvc-detail-value regular-body-text">{originalRequest.category}</span>
                        </div>
                        <div className="cvc-detail-group">
                            <label className="cvc-detail-label smaller-body-text text-secondary">CURRENT STATUS</label>
                            <span className={`button-label cvc-status-pill ${originalRequest.status.toLowerCase().replace(' ', '-')}`}>
                                {originalRequest.status}
                            </span>
                        </div>
                        <div className="cvc-detail-group">
                            <label className="cvc-detail-label smaller-body-text text-secondary">PRIORITY</label>
                            <span className={`button-label cvc-priority-pill ${concern.priority?.toLowerCase() || 'medium'}`}>
                                {concern.priority || 'Medium'}
                            </span>
                        </div>

                        <div className="cvc-divider"></div>

                        <div className="cvc-detail-group">
                            <label className="cvc-detail-label smaller-body-text text-secondary">DESCRIPTION</label>
                            <p className="cvc-description small-body-text">{originalRequest.description}</p>
                        </div>

                        <div className="cvc-divider"></div>

                        <div className="cvc-detail-group cvc-attachments-section">
                            <span className="cvc-detail-label smaller-body-text fw-600">
                                <Icon icon="mdi:paperclip" /> ATTACHED FILES ({allAttachments.length})
                            </span>
                            
                            {allAttachments.length > 0 ? (
                                <div className="cvc-files-list">
                                    {allAttachments.map((file, idx) => {
                                        const isPDF = file.name?.toLowerCase().endsWith('.pdf');
                                        const downloadUrl = `${BACKEND_URL}/${file.path}`;
                                        return (
                                            <div key={idx} className="cvc-file-card">
                                                <div className="cvc-file-icon-wrap">
                                                    <Icon 
                                                        icon={isPDF ? "mdi:file-pdf-box" : "mdi:file-document-outline"} 
                                                        className={`cvc-file-icon ${isPDF ? 'text-red' : 'text-blue'}`}
                                                    />
                                                </div>
                                                <div className="cvc-file-info">
                                                    <span className="cvc-file-name smaller-body-text fw-600">{file.name}</span>
                                                    <span className="cvc-file-size smaller-body-text text-secondary">{file.size || 'Unknown size'}</span>
                                                </div>
                                                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="cvc-file-download-btn">
                                                    <Icon icon="mdi:download-outline" />
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="smaller-body-text text-muted" style={{ padding: '8px 4px' }}>No attachments provided.</p>
                            )}
                        </div>

                        <div className="cvc-help-footer-inline">
                            <h5 className="cvc-help-title smaller-body-text">Need more help?</h5>
                            <button className="cvc-contact-support-btn outlined-button">
                                <Icon icon="mdi:phone-outline" /> Contact Support
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: UPDATE TIMELINE (CONVERSATION) */}
                <div className="cvc-right-col">
                    <h6 className="cvc-card-heading">Update Timeline</h6>
                    <div className="cvc-timeline-card">
                        <div className="cvc-timeline">
                            {concern.messages.map((item, index) => (
                                <div key={item._id} className={`cvc-timeline-item ${index === concern.messages.length - 1 ? 'last-item' : ''}`}>
                                    <div className="cvc-timeline-dot-wrapper">
                                        <div className={`cvc-timeline-dot ${index === concern.messages.length - 1 ? 'active-dot' : ''}`}></div>
                                        {index !== concern.messages.length - 1 && <div className="cvc-timeline-line"></div>}
                                    </div>
                                    <div className="cvc-timeline-content-card">
                                        <div className="cvc-timeline-header">
                                            <div className="cvc-author-info">
                                                <Icon 
                                                    icon={item.isSystem ? "mdi:clock-outline" : "mdi:shield-account-outline"} 
                                                    className={item.isSystem ? "cvc-system-icon" : "cvc-admin-icon"} 
                                                />
                                                <span className="cvc-author-name">{item.senderName}</span>
                                                {item.isSystem && (
                                                    <>
                                                        <span className="cvc-dot-separator">•</span>
                                                        <span className={`cvc-inline-status system-badge`}>
                                                            System
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <span className="cvc-timestamp smaller-body-text text-secondary">{new Date(item.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="cvc-message small-body-text">{item.text}</p>
                                        
                                        {item.attachments && item.attachments.length > 0 && (
                                            <div className="cvc-timeline-attachments">
                                                <div className="cvc-att-label smaller-body-text text-secondary">
                                                    <Icon icon="mdi:attachment" /> Attachments
                                                </div>
                                                {item.attachments.map((att, i) => (
                                                    <div key={i} className="cvc-attachment-item">
                                                        <div className="cvc-att-icon-wrap">
                                                            <Icon 
                                                                icon={att.name?.toLowerCase().endsWith('.pdf') ? "mdi:file-pdf-box" : "mdi:file-document-outline"} 
                                                                className={`cvc-att-file-icon ${att.name?.toLowerCase().endsWith('.pdf') ? 'text-red' : 'text-blue'}`} 
                                                            />
                                                        </div>
                                                        <div className="cvc-att-info">
                                                            <span className="cvc-att-name smaller-body-text">{att.name}</span>
                                                            <span className="cvc-att-size smaller-body-text text-tertiary">{att.size}</span>
                                                        </div>
                                                        <a href={`${BACKEND_URL}/${att.path}`} target="_blank" rel="noopener noreferrer" className="cvc-att-download-btn">
                                                            <Icon icon="mdi:download-outline" />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* REPLY AREA */}
                        <div className="cvc-reply-area">
                            <textarea 
                                placeholder="Add a reply or more information..." 
                                className="cvc-reply-input small-body-text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                disabled={loading || concern.status === 'closed'}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        handleReply();
                                    }
                                }}
                            ></textarea>

                            {replyFiles.length > 0 && (
                                <div className="cvc-reply-files-preview">
                                    {replyFiles.map((file, idx) => (
                                        <div key={idx} className="cvc-reply-file-item">
                                            <Icon icon="mdi:paperclip" />
                                            <span className="smaller-body-text">{file.name}</span>
                                            <Icon 
                                                icon="mdi:close" 
                                                className="cvc-remove-file" 
                                                onClick={() => setReplyFiles(replyFiles.filter((_, i) => i !== idx))} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="cvc-reply-actions">
                                <div className="cvc-reply-actions-left">
                                    <button 
                                        className="cvc-attach-btn"
                                        onClick={() => document.getElementById('cvc-reply-upload').click()}
                                        disabled={loading || concern.status === 'closed'}
                                    >
                                        <Icon icon="mdi:paperclip" width="20" />
                                    </button>
                                    <input 
                                        type="file" 
                                        id="cvc-reply-upload" 
                                        multiple 
                                        style={{ display: 'none' }}
                                        onChange={(e) => setReplyFiles([...replyFiles, ...Array.from(e.target.files)])}
                                    />
                                    <span className="cvc-hint smaller-body-text text-secondary">Press Ctrl+Enter to send</span>
                                </div>
                                <button 
                                    className="primary-button cvc-send-btn" 
                                    onClick={handleReply}
                                    disabled={loading || (!replyText.trim() && replyFiles.length === 0) || concern.status === 'closed'}
                                >
                                    <Icon icon={loading ? "mdi:loading" : "mdi:send"} className={loading ? "spin" : ""} /> 
                                    {loading ? "Sending..." : "Send Reply"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
