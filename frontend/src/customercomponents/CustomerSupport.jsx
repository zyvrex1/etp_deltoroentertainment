import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import CustomerDocuments from './Modal/CustomerDocuments';
import CustomerViewConcern from './CustomerViewConcern';
import { io } from 'socket.io-client';
import { useAuthContext } from '../hooks/useAuthContext';
import concernService from '../services/concernService';
import policyService from '../services/policyService';
import jsPDF from 'jspdf';
import './CustomerSupport.css';
import usePagination from '../hooks/usePagination';
import PaginationBar from '../components/PaginationBar';
import { 
    loadLogo, 
    addReportHeader, 
    finalizeReport, 
    showExportToast, 
    removeExportToast, 
    drawLongText 
} from '../utils/pdfExport';
import { showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function CustomerSupport() {
    const { user } = useAuthContext();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('My Concerns');
    const [selectedConcern, setSelectedConcern] = useState(null);
    const [openFaq, setOpenFaq] = useState(0);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [concerns, setConcerns] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        subject: '',
        category: 'General Inquiry',
        priority: 'Medium',
        description: '',
        event: ''
    });

    const itemsPerPage = 7;
    const {
        page,
        totalPages,
        total,
        setTotal,
        onPrev,
        onNext,
        onGoTo,
        setPage,
    } = usePagination({ limit: itemsPerPage });

    const fetchPolicies = async () => {
        try {
            const policiesData = await policyService.getPolicies();
            setPolicies(policiesData);
        } catch (error) {
            console.error("Error fetching policies:", error);
        }
    };

    const fetchConcerns = async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const response = await concernService.getMyConcerns({
                page,
                limit: itemsPerPage,
                search: searchQuery,
                status: selectedStatus
            });
            setConcerns(response.data || []);
            if (response.pagination) {
                setTotal(response.pagination);
            }
        } catch (error) {
            console.error("Error fetching concerns:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    // Fetch concerns on mount and when dependencies change (with debounce for search)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchConcerns();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [user, page, searchQuery, selectedStatus]);

    // Socket for real-time updates to the list
    useEffect(() => {
        if (!user?.token) return;
        const socket = io(BACKEND_URL);

        socket.on('newMessage', () => fetchConcerns());
        socket.on('statusUpdate', () => fetchConcerns());

        return () => socket.disconnect();
    }, [user]);

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
            if (location.state.prefill) {
                setFormData(prev => ({
                    ...prev,
                    ...location.state.prefill
                }));
            }
        }
    }, [location.state]);

    const tabs = [
        { name: 'My Concerns', icon: 'mdi:comment-alert-outline', badge: concerns.filter(c => c.status !== 'closed' && c.status !== 'resolved').length },
        { name: 'Submit a Concern', icon: 'mdi:plus' },
        { name: 'Help Center', icon: 'mdi:help-circle-outline' }
    ];

const exportDocumentToPDF = async (doc) => {
    const loadingToast = showExportToast();
    const DOCUMENT_TITLE = doc.title;

    try {
        const logoData = await loadLogo();
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const MARGIN = 15;
        const FOOTER_HEIGHT = 15;
        let y = 45;

        addReportHeader(pdf, DOCUMENT_TITLE, logoData);

        // ── helpers ──────────────────────────────────────────────────────────
        const newPageIfNeeded = (needed) => {
            if (y + needed > pdfHeight - FOOTER_HEIGHT - 5) {
                pdf.addPage();
                addReportHeader(pdf, DOCUMENT_TITLE, logoData);
                y = 45;
            }
        };



        // ══════════════════════════════════════════════════════════════════════
        // FULL SECTION CONTENT
        // ══════════════════════════════════════════════════════════════════════

        if (doc.sections) {
            doc.sections.forEach((sec, idx) => {
                newPageIfNeeded(20);

                // Section title row
                const rowBg = idx % 2 === 0 ? [245, 247, 255] : [255, 255, 255];
                pdf.setFillColor(...rowBg);
                pdf.setDrawColor(220, 225, 245);
                pdf.setLineWidth(0.2);
                pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 8, 1, 1, 'FD');

                pdf.setFontSize(9);
                pdf.setTextColor(30, 60, 114);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`${idx + 1}.  ${sec.title}`, MARGIN + 4, y + 5.5);
                y += 15;

                const sectionContent = sec.pdfContent && sec.pdfContent.length > 0
                    ? sec.pdfContent.join('\n')
                    : 'Please refer to the application portal for the full detailed content of this section.';

                y = drawLongText(pdf, y, sectionContent, MARGIN + 4, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, logoData, DOCUMENT_TITLE);
                y += 6;
            });
        } else if (doc.content) {
            // Plain policy from Content Manager — render as a single section
            newPageIfNeeded(20);

            pdf.setFillColor(245, 247, 255);
            pdf.setDrawColor(220, 225, 245);
            pdf.setLineWidth(0.2);
            pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 8, 1, 1, 'FD');

            pdf.setFontSize(9);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`1.  Policy Content`, MARGIN + 4, y + 5.5);
            y += 15;

            y = drawLongText(pdf, y, doc.content, MARGIN + 4, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, logoData, DOCUMENT_TITLE);
            y += 6;
        }

        // ══════════════════════════════════════════════════════════════════════
        // FOOTER STRIP
        // ══════════════════════════════════════════════════════════════════════
        y += 8;
        newPageIfNeeded(16);
        pdf.setFillColor(245, 247, 255);
        pdf.setDrawColor(210, 218, 245);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 14, 2, 2, 'FD');
        pdf.setFontSize(8);
        pdf.setTextColor(80, 90, 130);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
            `${DOCUMENT_TITLE}  •  Generated by eTicketsPro`,
            pdfWidth / 2, y + 9, { align: 'center' }
        );

        finalizeReport(pdf);
        pdf.save(`${DOCUMENT_TITLE.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    } finally {
        removeExportToast(loadingToast);
    }
};
    const faqs = [
        {
            question: "How do I purchase tickets?",
            answer: "Navigate to the browse event page, select your desired tickets or seating, add them to your cart, and proceed to checkout. Your tickets will be held for a short period while you complete payment."
        },
        {
            question: "Can I get a refund for my tickets?",
            answer: "Refunds are subject to the event organizer's policy. Generally, tickets are non-refundable unless the event is canceled or rescheduled. Please check the specific event details for more information."
        },
        {
            question: "How do I access my purchased tickets?",
            answer: "You can find all your purchased tickets in the 'My Tickets' section of your account. You can also print them or present the digital QR code at the venue."
        },
        {
            question: "What if I lose my digital ticket?",
            answer: "Don't worry, your tickets are securely stored in your account. Just log in from any device to access and display them."
        },
        {
            question: "Are mobile tickets accepted at the venue?",
            answer: "Yes, our digital tickets with QR codes are accepted at all partner venues. Just make sure your screen brightness is turned up for easy scanning."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept all major credit cards (Visa, Mastercard, American Express), Apple Pay, and Google Pay."
        }
    ];

    const resources = policies.map(p => ({
        id: p._id,
        title: p.title,
        content: p.content,
        format: 'PDF',
        size: '0.5 MB' // Placeholder or calculated size
    }));

    const getStatusIcon = (status) => {
        switch(status) {
            case 'Open': return 'mdi:circle-outline';
            case 'In Progress': return 'mdi:loading';
            case 'Resolved': return 'mdi:check-circle-outline';
            case 'Closed': return 'mdi:close-circle-outline';
            default: return 'mdi:circle-outline';
        }
    };

    const getStatusColorClass = (status) => {
        return status.toLowerCase().replace(/\s+/g, '-');
    };

    const getPriorityColorClass = (priority) => {
        return priority?.toLowerCase() || 'medium';
    };

    const handleViewConcern = (ticket) => {
        setSelectedConcern(ticket);
    };

    const handleBackToSupport = () => {
        setSelectedConcern(null);
    };

    useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedStatus]);

    const paginatedTickets = concerns;

    if (selectedConcern) {
        return (
            <CustomerViewConcern 
                concern={selectedConcern} 
                onBack={handleBackToSupport} 
            />
        );
    }

    const renderMyConcerns = () => (
        <div className="tab-pane active fade-in">
            <div className="concerns-card">
                <div className="concerns-toolbar">
                    <div className="search-box">
                        <Icon icon="mdi:magnify" width="20" />
                        <input 
                            type="text" 
                            placeholder="Search by ticket ID, subject..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="filter-dropdown-wrapper">
                        <Icon icon="mdi:filter-variant" className="filter-icon" />
                        <select 
                            value={selectedStatus} 
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="status-dropdown"
                        >
                            <option value="All">All Status</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                </div>

                <div className="tickets-list">
                    {loading ? (
                        <>
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="ticket-card skeleton" style={{ width: '100%' }}>
                                    <div className="ticket-header">
                                        <div className="skeleton-box support-skeleton-id" />
                                        <div className="badges">
                                            <div className="skeleton-box support-skeleton-badge" />
                                            <div className="skeleton-box support-skeleton-badge" />
                                        </div>
                                    </div>
                                    <div className="skeleton-box support-skeleton-title" />
                                    <div className="ticket-footer">
                                        <div className="ticket-meta">
                                            <div className="skeleton-box support-skeleton-meta" />
                                            <div className="skeleton-box support-skeleton-meta" style={{ width: '80px' }} />
                                            <div className="skeleton-box support-skeleton-meta" style={{ width: '90px' }} />
                                        </div>
                                        <div className="skeleton-box support-skeleton-btn" />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : paginatedTickets.length === 0 ? (
                        <div className="empty-state">
                            <Icon icon="mdi:comment-alert-outline" width="48" />
                            <p>No concerns found.</p>
                        </div>
                    ) : (
                        paginatedTickets.map(ticket => (
                            <div key={ticket._id} className="ticket-card">
                                <div className="ticket-header">
                                    <span className="ticket-id">#{ticket._id.slice(-6).toUpperCase()}</span>
                                    <div className="badges">
                                        <span className={`status-badge ${getStatusColorClass(ticket.status)}`}>
                                            <Icon icon={getStatusIcon(ticket.status)} />
                                            {ticket.status}
                                        </span>
                                        <span className={`priority-badge ${getPriorityColorClass(ticket.priority)}`}>
                                            {ticket.priority || 'Medium'}
                                        </span>
                                    </div>
                                </div>
                                <h5 className="ticket-title">{ticket.subject}</h5>
                                <div className="ticket-footer">
                                    <div className="ticket-meta">
                                        <span className="meta-item"><Icon icon="mdi:tag-outline" /> {ticket.category}</span>
                                        <span className="meta-item"><Icon icon="mdi:clock-outline" /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                        <span className="meta-item"><Icon icon="mdi:message-outline" /> {ticket.messages.length} messages</span>
                                    </div>
                                    <button className="view-ticket-btn" onClick={() => handleViewConcern(ticket)}>
                                        <Icon icon="mdi:eye-outline" /> View
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <PaginationBar
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPrev={onPrev}
                    onNext={onNext}
                    onGoTo={onGoTo}
                />
            </div>
        </div>
    );

    const renderSubmitConcern = () => (
        <div className="tab-pane active fade-in">
            <div className="submit-concern-card">
                <div className="card-header">
                    <h4>Submit a New Concern</h4>
                    <p className="small-body-text text-muted">Describe your issue and our team will get back to you as soon as possible.</p>
                </div>
                <form className="concern-form" onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user?.token) return;
                    setIsSubmitting(true);
                    try {
                        const submitData = new FormData();
                        submitData.append('subject', formData.subject);
                        submitData.append('category', formData.category);
                        submitData.append('priority', formData.priority);
                        submitData.append('description', formData.description);
                        submitData.append('event', formData.event);
                        
                        selectedFiles.forEach(file => {
                            submitData.append('attachments', file);
                        });

                        await concernService.createConcern(submitData, user.token);
                        showSuccessAlert("Success", "Your concern has been submitted successfully.");
                        setFormData({
                            subject: '',
                            category: 'General Inquiry',
                            priority: 'Medium',
                            description: '',
                            event: ''
                        });
                        setSelectedFiles([]);
                        setActiveTab('My Concerns');
                        fetchConcerns();
                    } catch (error) {
                        showErrorAlert("Error", error.message);
                    } finally {
                        setIsSubmitting(false);
                    }
                }}>
                    <div className="form-group">
                        <label>Subject <span className="required">*</span></label>
                        <input 
                            type="text" 
                            required
                            placeholder="Brief summary of your concern" 
                            value={formData.subject}
                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Involved Event (Optional)</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Neon Dreams Tour" 
                            value={formData.event}
                            onChange={(e) => setFormData({...formData, event: e.target.value})}
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group col">
                            <label>Category</label>
                            <select 
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                <option>General Inquiry</option>
                                <option>Ticket Issue</option>
                                <option>Refund Request</option>
                                <option>Billing & Payment</option>
                                <option>Account Assistance</option>
                                <option>Technical Support</option>
                            </select>
                        </div>
                        <div className="form-group col">
                            <label>Priority</label>
                            <select 
                                value={formData.priority}
                                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Description <span className="required">*</span></label>
                        <textarea 
                            required
                            rows="5" 
                            placeholder="Provide as much detail as possible about your concern..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label>Attachments (Optional)</label>
                        <div 
                            className="attachment-upload"
                            onClick={() => document.getElementById('file-upload').click()}
                        >
                            <Icon icon="mdi:attachment-plus" width="32" />
                            <p className="small-body-text">Click to attach files (images, PDFs, documents)</p>
                            <span className="smaller-body-text text-muted">Max 5 files, 10MB each</span>
                            <input 
                                type="file" 
                                id="file-upload" 
                                multiple 
                                style={{ display: 'none' }} 
                                onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    if (selectedFiles.length + files.length > 5) {
                                        showErrorAlert("Limit Exceeded", "You can only upload up to 5 files.");
                                        return;
                                    }
                                    setSelectedFiles([...selectedFiles, ...files]);
                                }}
                            />
                        </div>
                        {selectedFiles.length > 0 && (
                            <div className="selected-files-preview">
                                {selectedFiles.map((file, idx) => (
                                    <div key={idx} className="file-preview-item">
                                        <Icon icon="mdi:file-document-outline" />
                                        <span className="smaller-body-text truncate-text">{file.name}</span>
                                        <button 
                                            type="button" 
                                            className="remove-file-btn"
                                            onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                                        >
                                            <Icon icon="mdi:close-circle" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button type="submit" className="primary-button submit-btn" disabled={isSubmitting}>
                        <Icon icon={isSubmitting ? "mdi:loading" : "mdi:send-outline"} className={isSubmitting ? "spin" : ""} />
                        {isSubmitting ? "Submitting..." : "Submit Concern"}
                    </button>
                </form>
            </div>
        </div>
    );

    const renderHelpCenter = () => (
        <div className="tab-pane active fade-in">
            <div className="contact-grid">
                <div className="contact-card border-red">
                    <div className="icon-wrap bg-red-q">
                        <Icon icon="mdi:comment-question-outline" color="var(--color-red-primary)" width="24" />
                    </div>
                    <h5>Submit a Concern</h5>
                    <p className="smaller-body-text text-muted">Report an issue and track its resolution.</p>
                    <button className="link-btn text-red" onClick={() => setActiveTab('Submit a Concern')}>
                        Get Started <Icon icon="mdi:arrow-right" />
                    </button>
                </div>
                <div className="contact-card border-green">
                    <div className="icon-wrap bg-green-q">
                        <Icon icon="mdi:email-outline" color="var(--color-green-primary)" width="24" />
                    </div>
                    <h5>Email Support</h5>
                    <p className="smaller-body-text text-muted">Response within 24 hours.</p>
                    <span className="contact-info text-green">support@eticketspro.com</span>
                </div>
                <div className="contact-card border-purple">
                    <div className="icon-wrap bg-purple-q">
                        <Icon icon="mdi:phone-outline" color="var(--color-purple-primary)" width="24" />
                    </div>
                    <h5>Phone Support</h5>
                    <p className="smaller-body-text text-muted">Mon-Fri, 9am - 8pm EST</p>
                    <span className="contact-info text-purple">+1 (555) 123-4567</span>
                </div>
            </div>

            <div className="help-content-layout">
                <div className="faq-section">
                    <h4>Frequently Asked Questions</h4>
                    <div className="faq-list">
                        {faqs.map((faq, index) => (
                            <div className={`faq-item ${openFaq === index ? 'active' : ''}`} key={index}>
                                <button className="faq-toggle" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                                    <h6 className="faq-question">{faq.question}</h6>
                                    <Icon
                                        icon={openFaq === index ? "mdi:chevron-up" : "mdi:chevron-down"}
                                        width="20"
                                        color={openFaq === index ? "var(--color-red-primary)" : "var(--color-black-secondary)"}
                                    />
                                </button>
                                {openFaq === index && (
                                    <div className="faq-answer fade-in">
                                        <p className="small-body-text text-muted">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="resources-section">
                    <h4>Resources</h4>
                    <div className="resources-list">
                        {resources.map((doc) => (
                            <div className="resource-item" key={doc.id}>
                                <div className="resource-icon">
                                    <Icon icon="mdi:file-document-outline" width="20" />
                                </div>
                                <div className="resource-info">
                                    <h6 className="resource-title">{doc.title}</h6>
                                    <span className="smaller-body-text text-muted">{doc.format} • {doc.size}</span>
                                </div>
                                <div className="resource-actions">
                                    <button className="download-btn" onClick={() => {
                                        setSelectedDocument(doc);
                                        setIsDocumentModalOpen(true);
                                    }}>
                                        <Icon icon="mdi:eye-outline" width="18" />
                                    </button>
                                    <button className="download-btn" onClick={() => exportDocumentToPDF(doc)}>
                                        <Icon icon="mdi:download-outline" width="18" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="support-hours">
                        <div className="hours-header">
                            <Icon icon="mdi:clock-outline" />
                            <span>Support Hours</span>
                        </div>
                        <p className="smaller-body-text">Mon - Fri: 9am - 8pm EST</p>
                        <p className="smaller-body-text">Sat - Sun: 10am - 6pm EST</p>
                    </div>
                </div>
            </div>
            {isDocumentModalOpen && (
                <CustomerDocuments 
                    isOpen={isDocumentModalOpen}
                    onClose={() => setIsDocumentModalOpen(false)}
                    document={selectedDocument}
                    onDownload={() => exportDocumentToPDF(selectedDocument)}
                />
            )}
        </div>
    );

    return (
        <div className="customer-support-page">
            <div className="support-header">
                <h2>Support Center</h2>
                <p className="regular-body-text">How can we help you today? Search our help center or submit a ticket.</p>
            </div>

            <div className="support-tabs-container">
                <div className="support-tabs">
                    {tabs.map((tab) => (
                        <button 
                            key={tab.name}
                            className={`tab-btn ${activeTab === tab.name ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.name)}
                        >
                            <Icon icon={tab.icon} width="20" />
                            {tab.name}
                            {tab.badge > 0 && <span className="tab-badge">{tab.badge}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="support-tab-content">
                {activeTab === 'My Concerns' && renderMyConcerns()}
                {activeTab === 'Submit a Concern' && renderSubmitConcern()}
                {activeTab === 'Help Center' && renderHelpCenter()}
            </div>
        </div>
    );
}
