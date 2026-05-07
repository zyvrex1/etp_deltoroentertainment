import React from 'react';
import { Icon } from '@iconify/react';
import './CustomerDocuments.css';

const CustomerDocuments = ({ isOpen, onClose, document, onDownload }) => {
    if (!isOpen) return null;

    // Use provided sections if available, otherwise fallback to document content or general default
    const sections = document?.sections ? document.sections : (document?.content ? [
        {
            title: document.title,
            content: (
                <p className="small-body-text text-secondary" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {document.content}
                </p>
            ),
            pdfContent: [document.content]
        }
    ] : [
        {
            title: 'General Information',
            content: (
                <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                    This document serves as the general guidelines and agreement for all customers. Please review carefully to ensure a seamless experience throughout the event lifecycle.
                </p>
            ),
            pdfContent: [
                'This document serves as the general guidelines and agreement for all customers. Please review carefully to ensure a seamless experience throughout the event lifecycle.'
            ]
        },
        // ... (keep other default sections if needed, or just keep it simple)
    ]);

    const title = document?.title || 'General Customer Document';
    const size = document?.size || '2.4 MB';
    const format = document?.format || 'PDF';

    return (
        <div className="customer-documents-overlay">
            <div className="customer-documents-modal">
                <div className="customer-documents-header-sticky">
                    <div className="customer-documents-header-title">
                        <div className="document-header-icon-wrapper">
                            <Icon icon="mdi:file-document-outline" className="text-red" width="24" />
                        </div>
                        <div>
                            <h3>{title}</h3>
                            <p className="small-body-text text-secondary" style={{ margin: 0 }}>{format} • {size}</p>
                        </div>
                    </div>
                    <button className="doc-close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <div className="customer-documents-body">
                    <div className="cd-hero">
                        <div className="cd-hero-icon bg-red-primary text-white">
                            <Icon icon="mdi:file-document" width="24" />
                        </div>
                        <h3 className="text-white text-uppercase" style={{ margin: '0 0 16px 0', textAlign: 'center' }}>{title}</h3>
                        <p className="small-body-text text-white" style={{ opacity: 0.8, margin: 0, textAlign: 'center' }}>Event Platform Customer Resources</p>
                        <div className="cd-hero-divider"></div>
                        <div className="cd-hero-details">
                            <span className="smaller-body-text text-white" style={{ opacity: 0.8 }}>Customer Guide</span>
                            <span className="smaller-body-text text-white cd-dot">•</span>
                            <span className="smaller-body-text text-white" style={{ opacity: 0.8 }}>All Events</span>
                        </div>
                    </div>

                    <div className="cd-sections-container">
                        {sections.map((section, idx) => (
                            <div key={idx} className="cd-section">
                                <div className="cd-section-header">
                                    <div className="cd-section-indicator"></div>
                                    <h4 className="cd-section-title">{section.title}</h4>
                                </div>

                                <div className="cd-section-content">
                                    {section.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="customer-documents-footer">
                    <button className="outlined-button cd-footer-btn" onClick={onClose}>Close</button>
                    <button className="primary-button cd-footer-btn cd-download-btn" onClick={onDownload}><Icon icon="mdi:download-outline" width="18" /> Download {format}</button>
                </div>
            </div>
        </div>
    );
};

export default CustomerDocuments;
