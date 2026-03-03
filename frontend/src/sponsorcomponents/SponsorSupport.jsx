import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import SponsorDocuments from './SponsorModal/SponsorDocuments';
import './SponsorSupport.css';

export default function SponsorSupport() {
    const [openFaq, setOpenFaq] = useState(0);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

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
                    )
                },
                {
                    title: 'Booth Assignment',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            The Organizer agrees to provide the Sponsor with the exhibition space as detailed in the booking summary (including Booth Number, Type, Dimensions, and Location).
                        </p>
                    )
                },
                {
                    title: 'Sponsorship Fee',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            The total sponsorship fee includes the Booth Base Price, Processing Fee, and Applicable Tax. Payment is processed upon confirmation.
                        </p>
                    )
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
                    )
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
                    )
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
                    )
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
                    )
                },
                {
                    title: 'Event Schedule Overview',
                    content: (
                        <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Setup Days: Dedicated times for booth construction and material preparation.</li>
                            <li>Event Days: General exhibition hours and specific keynote timings.</li>
                            <li>Teardown Days: Designated windows for booth dismantling.</li>
                        </ul>
                    )
                },
                {
                    title: 'Booth Regulations',
                    content: (
                        <div className="small-body-text text-secondary" style={{ margin: 0 }}>
                            <strong>Height Restrictions:</strong> Standard booths max 8 feet; Island booths max 12 feet. <br />
                            <strong>Display Rules:</strong> All displays must remain within your assigned footprint. No audio exceeding 85 dB.
                        </div>
                    )
                },
                {
                    title: 'Electrical & Technical',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Basic booth inclusions provide standard drops. High-speed wired internet and dedicated WiFi access must be secured prior to the event. All equipment must be UL-listed.
                        </p>
                    )
                },
                {
                    title: 'Shipping & Materials',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Advance shipments are recommended to the unified warehouse. Direct-to-show shipments are only accepted during loading dock hours. All shipments must be labeled with the booth number and company name.
                        </p>
                    )
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
                    )
                },
                {
                    title: 'Adjacent Booths',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            An overview of neighboring booth allocations and standard 10-foot aisle separations.
                        </p>
                    )
                },
                {
                    title: 'Hall Layout Overview',
                    content: (
                        <ul className="sd-list small-body-text text-secondary" style={{ margin: 0, paddingLeft: '20px' }}>
                            <li>Premium Island Zones (Zone A)</li>
                            <li>Corner and Standard Booths (Zones B & C)</li>
                            <li>Startup Pavilions (Zone D)</li>
                        </ul>
                    )
                },
                {
                    title: 'Parking & Access',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Exhibitor parking rates and designated loading dock operating hours. Includes public transit details for attendee guidance.
                        </p>
                    )
                },
                {
                    title: 'Emergency Exits',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Familiarize yourself with primary, secondary, and tertiary emergency exits. Do not use elevators during emergencies; assembly points are located exteriorly.
                        </p>
                    )
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
                    )
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
                    )
                },
                {
                    title: 'Height & Display Restrictions',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Maximum structure heights apply. Hanging signs require prior management approval. Open flames, live animals, and unsecured helium balloons are strictly prohibited.
                        </p>
                    )
                },
                {
                    title: 'Cable Management',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            All cables must be properly managed to ensure attendee safety. Floor cables must be covered and taped down. No cables may cross public aisles.
                        </p>
                    )
                },
                {
                    title: 'Teardown Schedule',
                    content: (
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>
                            Exhibits must remain intact until the official exhibition close. All materials must be removed or staged for freight pickup within the designated windows. Late teardowns result in escorted material removal at exhibitor expense.
                        </p>
                    )
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
                                        <button className="download-btn">
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
            />
        </div>
    );
}
