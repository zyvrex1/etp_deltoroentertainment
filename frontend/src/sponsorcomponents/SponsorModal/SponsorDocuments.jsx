import React from 'react';
import { Icon } from '@iconify/react';
import './SponsorDocuments.css';

const SponsorDocuments = ({ isOpen, onClose, document, onDownload }) => {
    if (!isOpen) return null;

    // Use provided sections if available, otherwise fallback to general default
    const sections = document?.sections || [
        {
            title: 'General Information',
            content: (
                <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                    This document serves as the general guidelines and agreement for all participating sponsors and exhibitors across our events. Please review carefully to ensure a seamless experience throughout the event lifecycle.
                </p>
            ),
            pdfContent: [
                'This document serves as the general guidelines and agreement for all participating sponsors and exhibitors across our events. Please review carefully to ensure a seamless experience throughout the event lifecycle.'
            ]
        },
        {
            title: 'Compliance & Regulations',
            content: (
                <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>All participants must comply with venue rules and local safety regulations.</li>
                    <li>Exhibits and materials must safely be contained within the assigned footprint.</li>
                    <li>Any hanging structures or heavy utility requirements must be requested in advance.</li>
                    <li>Conduct any activity that competes directly with the Organizer's business is prohibited.</li>
                </ul>
            ),
            pdfContent: [
                '• All participants must comply with venue rules and local safety regulations.',
                '• Exhibits and materials must safely be contained within the assigned footprint.',
                '• Any hanging structures or heavy utility requirements must be requested in advance.',
                '• Conduct any activity that competes directly with the Organizer\'s business is prohibited.'
            ]
        },
        {
            title: 'Inclusions & Requirements',
            content: (
                <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Standard event passes as outlined in your specific booth package.</li>
                    <li>Basic venue amenities unless additional services were requested.</li>
                    <li>Setup materials must meet local fire safety and structural standards.</li>
                </ul>
            ),
            pdfContent: [
                '• Standard event passes as outlined in your specific booth package.',
                '• Basic venue amenities unless additional services were requested.',
                '• Setup materials must meet local fire safety and structural standards.'
            ]
        },
        {
            title: 'Cancellation & Support',
            content: (
                <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                    Cancellations must be submitted in writing. Standard policy allows partial refunds up to 60 days prior to the event, after which all bookings are non-refundable. For detailed questions, contact our Exhibitor Support team at support@eventplatform.com.
                </p>
            ),
            pdfContent: [
                'Cancellations must be submitted in writing. Standard policy allows partial refunds up to 60 days prior to the event, after which all bookings are non-refundable. For detailed questions, contact our Exhibitor Support team at support@eventplatform.com.'
            ]
        }
    ];

    const title = document?.title || 'General Event Document';
    const size = document?.size || '2.4 MB';
    const format = document?.format || 'PDF';

    return (
        <div className="sponsor-documents-overlay">
            <div className="sponsor-documents-modal">
                <div className="sponsor-documents-header-sticky">
                    <div className="sponsor-documents-header-title">
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

                <div className="sponsor-documents-body">
                    <div className="sd-hero">
                        <div className="sd-hero-icon bg-red-primary text-white">
                            <Icon icon="mdi:file-document" width="24" />
                        </div>
                        <h3 className="text-white text-uppercase" style={{ margin: '0 0 16px 0', textAlign: 'center' }}>{title}</h3>
                        <p className="small-body-text text-white" style={{ opacity: 0.8, margin: 0, textAlign: 'center' }}>Event Platform Exhibitor Resources</p>
                        <div className="sd-hero-divider"></div>
                        <div className="sd-hero-details">
                            <span className="smaller-body-text text-white" style={{ opacity: 0.8 }}>Sponsor & Exhibitor Guide</span>
                            <span className="smaller-body-text text-white sd-dot">•</span>
                            <span className="smaller-body-text text-white" style={{ opacity: 0.8 }}>All Events</span>
                        </div>
                    </div>

                    <div className="sd-sections-container">
                        {sections.map((section, idx) => (
                            <div key={idx} className="sd-section">
                                <div className="sd-section-header">
                                    <div className="sd-section-indicator"></div>
                                    <h4 className="sd-section-title">{section.title}</h4>
                                </div>

                                <div className="sd-section-content regular-body-text">
                                    {section.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="sponsor-documents-footer">
                    <button className="outlined-button sd-footer-btn" onClick={onClose}>Close</button>
                    <button className="primary-button sd-footer-btn sd-download-btn" onClick={onDownload}><Icon icon="mdi:download-outline" width="18" /> Download {format}</button>
                </div>
            </div>
        </div>
    );
};

export default SponsorDocuments;
