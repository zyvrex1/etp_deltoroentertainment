import React from 'react';
import { Icon } from '@iconify/react';
import './PromoterDocuments.css';

const PromoterDocuments = ({ isOpen, onClose, document, onDownload }) => {
    if (!isOpen) return null;

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
                    This document serves as the general guidelines and agreement for all event promoters on our platform. Please review carefully to ensure a seamless setup, ticket sale process, and event lifecycle.
                </p>
            ),
            pdfContent: [
                'This document serves as the general guidelines and agreement for all event promoters on our platform. Please review carefully to ensure a seamless setup, ticket sale process, and event lifecycle.'
            ]
        },
        {
            title: 'Compliance & Regulations',
            content: (
                <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>All events must comply with local laws and policies.</li>
                    <li>Promoters are responsible for the validity of ticket pricing, quotas, and sales policies.</li>
                    <li>Accurate venue mapping is required for seated events.</li>
                </ul>
            ),
            pdfContent: [
                '• All events must comply with local laws and policies.',
                '• Promoters are responsible for the validity of ticket pricing, quotas, and sales policies.',
                '• Accurate venue mapping is required for seated events.'
            ]
        },
        {
            title: 'Payouts & Fees',
            content: (
                <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                    Payouts are initiated post-event after all tickets and attendance records are fully verified. Standard platform commissions and processing fees will be deducted prior to disbursement.
                </p>
            ),
            pdfContent: [
                'Payouts are initiated post-event after all tickets and attendance records are fully verified. Standard platform commissions and processing fees will be deducted prior to disbursement.'
            ]
        }
    ]);

    const title = document?.title || 'Promoter Guide & Regulations';
    const size = document?.size || '1.8 MB';
    const format = document?.format || 'PDF';

    return (
        <div className="promoter-documents-overlay">
            <div className="promoter-documents-modal">
                <div className="promoter-documents-header-sticky">
                    <div className="promoter-documents-header-title">
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

                <div className="promoter-documents-body">
                    <div className="sd-hero">
                        <div className="sd-hero-icon bg-red-primary text-white">
                            <Icon icon="mdi:file-document" width="24" />
                        </div>
                        <h3 className="text-white text-uppercase" style={{ margin: '0 0 16px 0', textAlign: 'center' }}>{title}</h3>
                        <p className="small-body-text text-white" style={{ opacity: 0.8, margin: 0, textAlign: 'center' }}>Event Platform Promoter Resources</p>
                        <div className="sd-hero-divider"></div>
                        <div className="sd-hero-details">
                            <span className="smaller-body-text text-white" style={{ opacity: 0.8 }}>Promoter Guide</span>
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

                <div className="promoter-documents-footer">
                    <button className="outlined-button sd-footer-btn" onClick={onClose}>Close</button>
                    <button className="primary-button sd-footer-btn sd-download-btn" onClick={onDownload}><Icon icon="mdi:download-outline" width="18" /> Download {format}</button>
                </div>
            </div>
        </div>
    );
};

export default PromoterDocuments;
