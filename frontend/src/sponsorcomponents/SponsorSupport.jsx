import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './SponsorSupport.css';

export default function SponsorSupport() {
    const [openFaq, setOpenFaq] = useState(0);

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
        { title: "Exhibitor Handbook 2024", desc: "Complete guide for exhibitors", format: "PDF", size: "4.2 MB", active: true },
        { title: "Booth Setup Guidelines", desc: "Setup and teardown instructions", format: "PDF", size: "2.1 MB", active: false },
        { title: "Marketing Assets Kit", desc: "Logos and promotional materials", format: "ZIP", size: "15.8 MB", active: false },
        { title: "Shipping & Logistics Guide", desc: "Freight and material handling", format: "PDF", size: "1.5 MB", active: false },
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
                                    <button className="download-btn">
                                        <Icon icon="mdi:download-outline" width="20" color={item.active ? "var(--color-red-primary)" : "var(--color-black-secondary)"} />
                                    </button>
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
        </div>
    );
}
