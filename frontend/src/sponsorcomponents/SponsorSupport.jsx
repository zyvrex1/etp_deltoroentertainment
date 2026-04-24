import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import SponsorDocuments from './SponsorModal/SponsorDocuments';
import SponsorViewConcern from './SponsorViewConcern';
import { io } from 'socket.io-client';
import { useAuthContext } from '../hooks/useAuthContext';
import concernService from '../services/concernService';
import jsPDF from 'jspdf';
import './SponsorSupport.css';
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

export default function SponsorSupport() {
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

    const fetchConcerns = async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const data = await concernService.getSponsorConcerns(user.token);
            setConcerns(data);
        } catch (error) {
            console.error("Error fetching concerns:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConcerns();
    }, [user]);

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

    // Remove mockTickets

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

            pdf.setFontSize(14);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Document Export', MARGIN, y);
            y += 10;

            doc.sections.forEach(sec => {
                if (y > pdfHeight - FOOTER_HEIGHT - 20) {
                    pdf.addPage();
                    addReportHeader(pdf, DOCUMENT_TITLE, logoData);
                    y = 45;
                }

                pdf.setFontSize(12);
                pdf.setTextColor(30, 60, 114);
                pdf.setFont('helvetica', 'bold');
                pdf.text(sec.title, MARGIN, y);
                y += 6;

                const sectionContent = sec.pdfContent && sec.pdfContent.length > 0 
                    ? sec.pdfContent.join('\n') 
                    : 'Please refer to the application portal for the full detailed content of this section.';

                y = drawLongText(pdf, y, sectionContent, MARGIN, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, logoData, DOCUMENT_TITLE);
                y += 8;
            });

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
            question: "How do I reserve a booth?",
            answer: "Navigate to the event page, click 'View Booth Map', select an available green booth, and follow the checkout process. Your booth is temporarily held for 15 minutes while you complete payment."
        },
        {
            question: "Can I cancel my sponsorship?",
            answer: "Yes, you can cancel your sponsorship based on our cancellation policy. Please refer to the Exhibitor Handbook for detailed terms."
        },
        {
            question: "When will I receive my exhibitor manual?",
            answer: "The exhibitor manual is usually sent out 30 days prior to the event."
        },
        {
            question: "Do booths come with power and internet?",
            answer: "Basic booths do not include power and internet unless specified. You can add these services during checkout."
        },
        {
            question: "How do I add exhibitor passes?",
            answer: "Extra passes can be purchased in the 'My Booths' section of your dashboard."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept Visa, Mastercard, American Express, and standard bank transfers."
        }
    ];

    const resources = [
        {
            id: 1,
            title: 'Sponsorship Contract',
            size: '2.4 MB',
            format: "PDF",
            sections: [
                {
                    title: 'Parties',
                    content: (
                        <div className="sd-parties" >
                            <p className="small-body-text" style={{ marginBottom: '12px' }}>
                                This Sponsorship Agreement ("Agreement") is entered into between:
                            </p>

                            <ul className="sd-list small-body-text text-secondary">
                                <li>Sponsor: The participating company or individual</li>
                                <li>Organizer: Event Platform Events LLC.</li>
                            </ul>
                        </div>
                    ),
                    pdfContent: [
                        'This Sponsorship Agreement ("Agreement") is entered into between:',
                        '• Sponsor: The participating company or individual',
                        '• Organizer: Event Platform Events LLC.'
                    ]
                },
                {
                    title: 'Booth Assignment',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            The Organizer agrees to provide the Sponsor with the exhibition space as detailed in the booking summary (including Booth Number, Type, Dimensions, and Location).
                        </p>
                    ),
                    pdfContent: [
                        'The Organizer agrees to provide the Sponsor with the exhibition space as detailed in the booking summary (including Booth Number, Type, Dimensions, and Location).'
                    ]
                },
                {
                    title: 'Sponsorship Fee',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            The total sponsorship fee includes the Booth Base Price, Processing Fee, and Applicable Tax. Payment is processed upon confirmation.
                        </p>
                    ),
                    pdfContent: [
                        'The total sponsorship fee includes the Booth Base Price, Processing Fee, and Applicable Tax. Payment is processed upon confirmation.'
                    ]
                },
                {
                    title: 'Inclusions',
                    content: (
                        <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Exhibitor Passes (quantity based on booth type)</li>
                            <li>Dedicated power circuit and WiFi access (if applicable)</li>
                            <li>Company listing in the official event directory</li>
                            <li>Access to post-event lead report</li>
                        </ul>
                    ),
                    pdfContent: [
                        '• Exhibitor Passes (quantity based on booth type)',
                        '• Dedicated power circuit and WiFi access (if applicable)',
                        '• Company listing in the official event directory',
                        '• Access to post-event lead report'
                    ]
                },
                {
                    title: 'Cancellation Policy',
                    content: (
                        <div className="sd-cancellation" >
                            <p className="small-body-text" style={{ marginBottom: '12px' }}>
                                Cancellations must be submitted in writing.
                            </p>

                            <ul className="sd-list small-body-text text-secondary">
                                <li>60+ days before event: 50% refund of total fees paid</li>
                                <li>Less than 60 days before event: No refund</li>
                                <li>Force majeure events will be handled on a case-by-case basis.</li>
                            </ul>
                        </div>
                    ),
                    pdfContent: [
                        'Cancellations must be submitted in writing.',
                        '• 60+ days before event: 50% refund of total fees paid',
                        '• Less than 60 days before event: No refund',
                        '• Force majeure events will be handled on a case-by-case basis.'
                    ]
                },
                {
                    title: 'Conduct & Compliance',
                    content: (
                        <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Comply with all venue rules and regulations.</li>
                            <li>Not obstruct neighboring booths or common areas.</li>
                            <li>Ensure all booth materials meet fire safety standards.</li>
                            <li>Maintain a professional and respectful environment.</li>
                        </ul>
                    ),
                    pdfContent: [
                        '• Comply with all venue rules and regulations.',
                        '• Not obstruct neighboring booths or common areas.',
                        '• Ensure all booth materials meet fire safety standards.',
                        '• Maintain a professional and respectful environment.'
                    ]
                }
            ]
        },
        {
            id: 2,
            title: 'Exhibitor Manual',
            size: '5.1 MB',
            format: "PDF",
            sections: [
                {
                    title: 'Welcome Message',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Welcome to the Event. We are thrilled to have you as a sponsor. This manual contains everything you need to know to make your exhibition experience seamless and successful.
                        </p>
                    ),
                    pdfContent: [
                        'Welcome to the Event. We are thrilled to have you as a sponsor. This manual contains everything you need to know to make your exhibition experience seamless and successful.'
                    ]
                },
                {
                    title: 'Event Schedule Overview',
                    content: (
                        <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Setup Days: Dedicated times for booth construction and material preparation.</li>
                            <li>Event Days: General exhibition hours and specific keynote timings.</li>
                            <li>Teardown Days: Designated windows for booth dismantling.</li>
                        </ul>
                    ),
                    pdfContent: [
                        '• Setup Days: Dedicated times for booth construction and material preparation.',
                        '• Event Days: General exhibition hours and specific keynote timings.',
                        '• Teardown Days: Designated windows for booth dismantling.'
                    ]
                },
                {
                    title: 'Booth Regulations',
                    content: (
                        <div className="small-body-text text-secondary" style={{ margin: 0 }}>
                            <strong>Height Restrictions:</strong> Standard booths max 8 feet; Island booths max 12 feet. <br />
                            <strong>Display Rules:</strong> All displays must remain within your assigned footprint. No audio exceeding 85 dB.
                        </div>
                    ),
                    pdfContent: [
                        'Height Restrictions: Standard booths max 8 feet; Island booths max 12 feet.',
                        'Display Rules: All displays must remain within your assigned footprint. No audio exceeding 85 dB.'
                    ]
                },
                {
                    title: 'Electrical & Technical',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Basic booth inclusions provide standard drops. High-speed wired internet and dedicated WiFi access must be secured prior to the event. All equipment must be UL-listed.
                        </p>
                    ),
                    pdfContent: [
                        'Basic booth inclusions provide standard drops. High-speed wired internet and dedicated WiFi access must be secured prior to the event. All equipment must be UL-listed.'
                    ]
                },
                {
                    title: 'Shipping & Materials',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Advance shipments are recommended to the unified warehouse. Direct-to-show shipments are only accepted during loading dock hours. All shipments must be labeled with the booth number and company name.
                        </p>
                    ),
                    pdfContent: [
                        'Advance shipments are recommended to the unified warehouse. Direct-to-show shipments are only accepted during loading dock hours. All shipments must be labeled with the booth number and company name.'
                    ]
                }
            ]
        },
        {
            id: 3,
            title: 'Floor Plan',
            size: '1.8 MB',
            format: "PDF",
            sections: [
                {
                    title: 'Your Booth Location',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Details regarding your assigned booth zone, structural dimensions, and proximity to major aisles or features like the Main Entrance.
                        </p>
                    ),
                    pdfContent: [
                        'Details regarding your assigned booth zone, structural dimensions, and proximity to major aisles or features like the Main Entrance.'
                    ]
                },
                {
                    title: 'Adjacent Booths',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            An overview of neighboring booth allocations and standard 10-foot aisle separations.
                        </p>
                    ),
                    pdfContent: [
                        'An overview of neighboring booth allocations and standard 10-foot aisle separations.'
                    ]
                },
                {
                    title: 'Hall Layout Overview',
                    content: (
                        <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Premium Island Zones (Zone A)</li>
                            <li>Corner and Standard Booths (Zones B & C)</li>
                            <li>Startup Pavilions (Zone D)</li>
                        </ul>
                    ),
                    pdfContent: [
                        '• Premium Island Zones (Zone A)',
                        '• Corner and Standard Booths (Zones B & C)',
                        '• Startup Pavilions (Zone D)'
                    ]
                },
                {
                    title: 'Parking & Access',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Exhibitor parking rates and designated loading dock operating hours. Includes public transit details for attendee guidance.
                        </p>
                    ),
                    pdfContent: [
                        'Exhibitor parking rates and designated loading dock operating hours. Includes public transit details for attendee guidance.'
                    ]
                },
                {
                    title: 'Emergency Exits',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Familiarize yourself with primary, secondary, and tertiary emergency exits. Do not use elevators during emergencies; assembly points are located exteriorly.
                        </p>
                    ),
                    pdfContent: [
                        'Familiarize yourself with primary, secondary, and tertiary emergency exits. Do not use elevators during emergencies; assembly points are located exteriorly.'
                    ]
                }
            ]
        },
        {
            id: 4,
            title: 'Setup Guidelines',
            size: '3.2 MB',
            format: "PDF",
            sections: [
                {
                    title: 'Setup Schedule',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Premium island exhibitors receive priority setup access. All setup must be completed prior to the final inspection deadline before the hall opens.
                        </p>
                    ),
                    pdfContent: [
                        'Premium island exhibitors receive priority setup access. All setup must be completed prior to the final inspection deadline before the hall opens.'
                    ]
                },
                {
                    title: 'What to Bring for Setup',
                    content: (
                        <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Basic toolkits and power extension cords</li>
                            <li>Carpet tape and ladders</li>
                            <li>Company signage and promotional materials</li>
                            <li>Lead capture devices</li>
                        </ul>
                    ),
                    pdfContent: [
                        '• Basic toolkits and power extension cords',
                        '• Carpet tape and ladders',
                        '• Company signage and promotional materials',
                        '• Lead capture devices'
                    ]
                },
                {
                    title: 'Height & Display Restrictions',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Maximum structure heights apply. Hanging signs require prior management approval. Open flames, live animals, and unsecured helium balloons are strictly prohibited.
                        </p>
                    ),
                    pdfContent: [
                        'Maximum structure heights apply. Hanging signs require prior management approval. Open flames, live animals, and unsecured helium balloons are strictly prohibited.'
                    ]
                },
                {
                    title: 'Cable Management',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            All cables must be properly managed to ensure attendee safety. Floor cables must be covered and taped down. No cables may cross public aisles.
                        </p>
                    ),
                    pdfContent: [
                        'All cables must be properly managed to ensure attendee safety. Floor cables must be covered and taped down. No cables may cross public aisles.'
                    ]
                },
                {
                    title: 'Teardown Schedule',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Exhibits must remain intact until the official exhibition close. All materials must be removed or staged for freight pickup within the designated windows. Late teardowns result in escorted material removal at exhibitor expense.
                        </p>
                    ),
                    pdfContent: [
                        'Exhibits must remain intact until the official exhibition close. All materials must be removed or staged for freight pickup within the designated windows. Late teardowns result in escorted material removal at exhibitor expense.'
                    ]
                }
            ]
        },
    ];

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

    const filteredTickets = concerns.filter(ticket => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             ticket._id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === "All" || ticket.status.toLowerCase() === selectedStatus.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    if (selectedConcern) {
        return (
            <SponsorViewConcern 
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
                        <div className="loading-state">
                            <Icon icon="mdi:loading" className="spin" />
                            <p>Loading concerns...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="empty-state">
                            <Icon icon="mdi:comment-alert-outline" width="48" />
                            <p>No concerns found.</p>
                        </div>
                    ) : (
                        filteredTickets.map(ticket => (
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
                        <label>Involved Event</label>
                        <input 
                            type="text" 
                            placeholder="e.g. TechInnovate Summit 2026" 
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
                                <option>Billing & Payment</option>
                                <option>Technical Support</option>
                                <option>Booth/Event Issue</option>
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
                    <p className="smaller-body-text text-muted">Mon-Fri, 9am - 6pm EST</p>
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
                        {resources.map((item, index) => (
                            <div className="resource-item" key={index}>
                                <div className="resource-icon">
                                    <Icon icon="mdi:file-document-outline" className="text-red" width="24" />
                                </div>
                                <div className="resource-info">
                                    <h6 className="resource-title">{item.title}</h6>
                                    <span className="smaller-body-text text-muted">PDF • {item.size}</span>
                                </div>
                                <div className="resource-actions">
                                    <button 
                                        className="download-btn" 
                                        onClick={() => {
                                            setSelectedDocument(item);
                                            setIsDocumentModalOpen(true);
                                        }}
                                    >
                                        <Icon icon="mdi:eye-outline" width="20" />
                                    </button>
                                    <button className="download-btn" onClick={() => exportDocumentToPDF(item)}>
                                        <Icon icon="mdi:download-outline" width="20" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="support-hours">
                        <div className="hours-header">
                            <Icon icon="mdi:clock-outline" />
                            <span className="small-body-text">Support Hours</span>
                        </div>
                        <p className="smaller-body-text text-muted">Monday - Friday: 9am - 6pm EST</p>
                        <p className="smaller-body-text text-muted">Saturday - Sunday: Closed</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="sponsor-support-page">
            <div className="support-header">
                <h2>Support Center</h2>
                <p className="regular-body-text text-muted">Submit concerns, track their status, and communicate with our support team. Browse FAQs or download resources.</p>
            </div>

            <div className="support-tabs-container">
                <div className="support-tabs">
                    {tabs.map(tab => (
                        <button 
                            key={tab.name}
                            className={`tab-btn ${activeTab === tab.name ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.name)}
                        >
                            <Icon icon={tab.icon} width="20" />
                            {tab.name}
                            {tab.badge && <span className="tab-badge">{tab.badge}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="support-tab-content">
                {activeTab === 'My Concerns' && renderMyConcerns()}
                {activeTab === 'Submit a Concern' && renderSubmitConcern()}
                {activeTab === 'Help Center' && renderHelpCenter()}
            </div>

            <SponsorDocuments
                isOpen={isDocumentModalOpen}
                onClose={() => setIsDocumentModalOpen(false)}
                document={selectedDocument}
                onDownload={() => exportDocumentToPDF(selectedDocument)}
            />
        </div>
    );
}
