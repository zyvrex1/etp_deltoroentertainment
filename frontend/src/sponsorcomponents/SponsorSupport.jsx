import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import SponsorDocuments from './SponsorModal/SponsorDocuments';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawLongText, finalizeReport } from '../admincomponents/utils/pdfExport';
import './SponsorSupport.css';

export default function SponsorSupport() {
    const [openFaq, setOpenFaq] = useState(0);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

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
                // Check if we need a new page for the section title
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
                y += 8; // Extra padding between sections
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
                            <p className="small-body-text" style={{ marginBottom: '12px', }}>
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
                        <p className="small-body-text text-secondary" style={{ margin: 0, }}>
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

    return (
        <div className="sponsor-support-container">
            <div className="support-header-section">
                <h2>Support Center</h2>
                <p className="regular-body-text text-muted">Need help with your sponsorship? Browse our FAQs or get in touch with our dedicated support team.</p>
            </div>

            <div className="support-contact-cards">
                <div className="contact-card">
                    <div className="icon-circle icon-email">
                        <Icon icon="mdi:email-outline" width="32" color="var(--color-green-primary)" />
                    </div>
                    <h5>Email Us</h5>
                    <p className="small-body-text text-muted">Get a response within 24 hours</p>
                </div>
                <div className="contact-card">
                    <div className="icon-circle icon-phone">
                        <Icon icon="mdi:phone-outline" width="32" color="var(--color-purple-primary)" />
                    </div>
                    <h5>Phone Support</h5>
                    <p className="small-body-text text-muted">Mon-Fri, 9am - 6pm CST</p>
                </div>
            </div>

            <div className="support-content-layout">
                <div className="support-main-col">
                    <div className="support-card">
                        <h4 className="card-title">Frequently Asked Questions</h4>
                        <div className="faq-list">
                            {faqs.map((faq, index) => (
                                <div className={`faq-item ${openFaq === index ? 'active' : ''}`} key={index}>
                                    <button className="faq-toggle" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                                        <h6 className="faq-question">{faq.question}</h6>
                                        <Icon
                                            icon={openFaq === index ? "mdi:chevron-up" : "mdi:chevron-down"}
                                            width="24"
                                            color={openFaq === index ? "var(--color-red-primary)" : "var(--color-black-secondary)"}
                                        />
                                    </button>
                                    {openFaq === index && (
                                        <div className="faq-answer">
                                            <p className="small-body-text text-muted">{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="support-card">
                        <h4 className="card-title">Send Us a Message</h4>
                        <form className="message-form">
                            <div className="form-group">
                                <label className="small-body-text text-muted">Subject</label>
                                <div className="select-wrapper">
                                    <select className="form-input regular-body-text">
                                        <option>General Inquiry</option>
                                        <option>Billing Issue</option>
                                        <option>Technical Support</option>
                                    </select>
                                    <Icon icon="mdi:chevron-down" className="select-icon text-muted" width="20" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="small-body-text text-muted">Message</label>
                                <textarea className="form-input form-textarea regular-body-text" rows="4" placeholder="How can we help you?"></textarea>
                            </div>
                            <button type="button" className="primary-button send-msg-btn">
                                <Icon icon="mdi:send-outline" width="18" /> Send Message
                            </button>
                        </form>
                    </div>
                </div>

                <div className="support-side-col">
                    <div className="support-card resources-card">
                        <h4 className="card-title">Resources</h4>
                        <div className="resources-list">
                            {resources.map((item, index) => (
                                <div className={`resource-item ${item.active ? 'active' : ''}`} key={index}>
                                    <div className="resource-info">
                                        <h6 className="resource-title">{item.title}</h6>
                                        <span className="smaller-body-text text-muted">{item.desc}</span>
                                        <span className="smaller-body-text text-muted format-size">{item.format} • {item.size}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="download-btn" onClick={() => { setSelectedDocument(item); setIsDocumentModalOpen(true); }}>
                                            <Icon icon="mdi:eye-outline" width="20" color={item.active ? "var(--color-red-primary)" : "var(--color-black-secondary)"} />
                                        </button>
                                        <button className="download-btn" onClick={() => exportDocumentToPDF(item)}>
                                            <Icon icon="mdi:download-outline" width="20" color={item.active ? "var(--color-red-primary)" : "var(--color-black-secondary)"} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="support-hours">
                            <div className="hours-title">
                                <Icon icon="mdi:clock-outline" width="18" />
                                <span className="small-body-text">Support Hours</span>
                            </div>
                            <p className="smaller-body-text text-muted">Monday - Friday: 9am - 6pm EST</p>
                            <p className="smaller-body-text text-muted">Saturday - Sunday: Closed</p>
                        </div>
                    </div>
                </div>
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
