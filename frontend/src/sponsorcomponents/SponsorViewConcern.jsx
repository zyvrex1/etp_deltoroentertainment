import React from 'react';
import { Icon } from '@iconify/react';
import './SponsorViewConcern.css';

export default function SponsorViewConcern({ concern, onBack }) {
    // Mock data for the timeline as seen in the mockup
    const timelineData = [
        {
            id: 1,
            author: 'System',
            status: 'Pending',
            timestamp: 'Mar 10, 2024, 6:30 PM',
            message: 'Concern submitted successfully.',
            isSystem: true
        },
        {
            id: 2,
            author: 'System',
            status: 'Under Review',
            timestamp: 'Mar 10, 2024, 10:15 PM',
            message: 'Assigned to support agent Sarah.',
            isSystem: true
        },
        {
            id: 3,
            author: 'Admin',
            status: 'In Progress',
            timestamp: 'Mar 11, 2024, 5:20 PM',
            message: 'We have identified a sync issue with your account. Our technical team is currently resolving this and your tickets should appear shortly.',
            isSystem: false,
            attachments: [
                { name: 'sync-fix-instructions.pdf', size: '128 KB' }
            ]
        }
    ];

    // Mock data for original request
    const originalRequest = {
        id: concern?.id || 'CON-1001',
        category: concern?.category || 'Ticket Access',
        status: concern?.status || 'In Progress',
        description: 'I purchased 2 VIP tickets for the TechStart Summit, but they are not showing up in my app. I only see the standard admission tickets. Please help me resolve this before the event tomorrow.',
        attachedFiles: [
            { name: 'purchase-confirmation.pdf', size: '245 KB', type: 'pdf' },
            { name: 'ticket-screen-error.png', size: '1.2 MB', type: 'image' }
        ]
    };

    return (
        <div className="svc-container fade-in">
            {/* BREADCRUMB */}
            <div className="svc-breadcrumb smaller-body-text">
                <span className="svc-breadcrumb-link" onClick={onBack}>My Concerns</span>
                <Icon icon="mdi:chevron-right" />
                <span className="svc-breadcrumb-current">{originalRequest.id}</span>
            </div>

            {/* HEADER */}
            <div className="svc-header">
                <button className="svc-back-icon-btn" onClick={onBack}>
                    <Icon icon="mdi:arrow-left" width="20" />
                </button>
                <div className="svc-header-info">
                    <div className="svc-title-row">
                        <h2 className="svc-page-title">{concern?.subject || 'Unable to access VIP tickets'}</h2>
                        <span className={`button-label svc-status-pill ${originalRequest.status.toLowerCase().replace(' ', '-')}`}>
                            {originalRequest.status}
                        </span>
                    </div>
                    <p className="svc-metadata smaller-body-text text-secondary">
                        Submitted on Mar 10, 2024, 6:30 PM • {originalRequest.category}
                    </p>
                </div>
            </div>

            <div className="svc-main-content">
                {/* LEFT COLUMN: ORIGINAL REQUEST (METADATA) */}
                <div className="svc-left-col">
                    <h6 className="svc-card-heading">Original Request</h6>
                    <div className="svc-request-card">
                        <div className="svc-detail-group">
                            <label className="svc-detail-label smaller-body-text text-secondary">CONCERN ID</label>
                            <span className="svc-detail-value regular-body-text fw-600">#{originalRequest.id}</span>
                        </div>
                        <div className="svc-detail-group">
                            <label className="svc-detail-label smaller-body-text text-secondary">CATEGORY</label>
                            <span className="svc-detail-value regular-body-text">{originalRequest.category}</span>
                        </div>
                        <div className="svc-detail-group">
                            <label className="svc-detail-label smaller-body-text text-secondary">CURRENT STATUS</label>
                            <span className={`button-label svc-status-pill ${originalRequest.status.toLowerCase().replace(' ', '-')}`}>
                                {originalRequest.status}
                            </span>
                        </div>

                        <div className="svc-divider"></div>

                        <div className="svc-detail-group">
                            <label className="svc-detail-label smaller-body-text text-secondary">DESCRIPTION</label>
                            <p className="svc-description small-body-text">{originalRequest.description}</p>
                        </div>

                        <div className="svc-divider"></div>

                        <div className="svc-attachments-section">
                            <label className="svc-detail-label smaller-body-text text-secondary">
                                <Icon icon="mdi:paperclip" /> ATTACHED FILES ({originalRequest.attachedFiles.length})
                            </label>
                            <div className="svc-files-list">
                                {originalRequest.attachedFiles.map((file, idx) => (
                                    <div key={idx} className="svc-file-card">
                                        <div className="svc-file-icon-wrap">
                                            <Icon 
                                                icon={file.type === 'pdf' ? "mdi:file-pdf-box" : "mdi:image-outline"} 
                                                className={`svc-file-icon ${file.type === 'pdf' ? 'text-red' : 'text-blue'}`}
                                            />
                                        </div>
                                        <div className="svc-file-info">
                                            <span className="svc-file-name smaller-body-text fw-600">{file.name}</span>
                                            <span className="svc-file-size smaller-body-text text-secondary">{file.size}</span>
                                        </div>
                                        <button className="svc-file-download-btn">
                                            <Icon icon="mdi:download-outline" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="svc-help-footer-inline">
                            <h5 className="svc-help-title smaller-body-text">Need more help?</h5>
                            <button className="svc-contact-support-btn outlined-button">
                                <Icon icon="mdi:phone-outline" /> Contact Support
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: UPDATE TIMELINE (CONVERSATION) */}
                <div className="svc-right-col">
                    <h6 className="svc-card-heading">Update Timeline</h6>
                    <div className="svc-timeline-card">
                        <div className="svc-timeline">
                            {timelineData.map((item, index) => (
                                <div key={item.id} className={`svc-timeline-item ${index === timelineData.length - 1 ? 'last-item' : ''}`}>
                                    <div className="svc-timeline-dot-wrapper">
                                        <div className={`svc-timeline-dot ${index === timelineData.length - 1 ? 'active-dot' : ''}`}></div>
                                        {index !== timelineData.length - 1 && <div className="svc-timeline-line"></div>}
                                    </div>
                                    <div className="svc-timeline-content-card">
                                        <div className="svc-timeline-header">
                                            <div className="svc-author-info">
                                                <Icon 
                                                    icon={item.isSystem ? "mdi:clock-outline" : "mdi:shield-account-outline"} 
                                                    className={item.isSystem ? "svc-system-icon" : "svc-admin-icon"} 
                                                />
                                                <span className="svc-author-name">{item.author}</span>
                                                <span className="svc-dot-separator">•</span>
                                                <span className={`svc-inline-status ${item.status.toLowerCase().replace(' ', '-')}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <span className="svc-timestamp smaller-body-text text-secondary">{item.timestamp}</span>
                                        </div>
                                        <p className="svc-message small-body-text">{item.message}</p>
                                        
                                        {item.attachments && (
                                            <div className="svc-timeline-attachments">
                                                <div className="svc-att-label smaller-body-text text-secondary">
                                                    <Icon icon="mdi:attachment" /> Attachments
                                                </div>
                                                {item.attachments.map((att, i) => (
                                                    <div key={i} className="svc-attachment-item">
                                                        <div className="svc-att-icon-wrap">
                                                            <Icon icon="mdi:file-pdf-box" className="svc-att-file-icon text-red" />
                                                        </div>
                                                        <div className="svc-att-info">
                                                            <span className="svc-att-name smaller-body-text">{att.name}</span>
                                                            <span className="svc-att-size smaller-body-text text-tertiary">{att.size}</span>
                                                        </div>
                                                        <button className="svc-att-download-btn">
                                                            <Icon icon="mdi:download-outline" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* REPLY AREA - MATCHING ADMIN VIEW */}
                        <div className="svc-reply-area">
                            <textarea 
                                placeholder="Add a reply or more information..." 
                                className="svc-reply-input small-body-text"
                            ></textarea>
                            <div className="svc-reply-actions">
                                <span className="svc-hint smaller-body-text text-secondary">Press Ctrl+Enter to send</span>
                                <button className="primary-button svc-send-btn">
                                    <Icon icon="mdi:send" /> Send Reply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
