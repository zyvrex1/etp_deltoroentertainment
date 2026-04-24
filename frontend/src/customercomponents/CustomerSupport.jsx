import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { showSendMessageConfirmAlert, showSuccessAlert } from '../utils/sweetAlert';
import './CustomerSupport.css';

export default function CustomerSupport() {
    const location = useLocation();
    const [openFaq, setOpenFaq] = useState(0);
    const [formData, setFormData] = useState({
        subject: 'Ticket Issue',
        message: ''
    });

    useEffect(() => {
        if (location.state?.prefill) {
            setFormData(prev => ({
                ...prev,
                ...location.state.prefill
            }));
        }
    }, [location.state]);

    const faqs = [
        {
            question: "How do I purchase tickets?",
            answer: "Navigate to the event page, select your desired tickets or seating, add them to your cart, and proceed to checkout. Your tickets will be held for a short period while you complete payment."
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

    const handleSendMessage = async () => {
        const result = await showSendMessageConfirmAlert();
        if (result.isConfirmed) {
            showSuccessAlert('Message Sent!', 'Our support team will get back to you within 24 hours.');
        }
    };

    return (
        <div className="customer-support-container">
            <div className="support-header-section">
                <h2>Support Center</h2>
                <p className="regular-body-text text-muted">Need help with your tickets or account? Browse our FAQs or get in touch with our support team.</p>
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
                    <p className="small-body-text text-muted">Mon-Fri, 9am - 8pm EST<br />Weekends, 10am - 6pm EST</p>
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
                </div>

                <div className="support-side-col">
                    <div className="support-card">
                        <h4 className="card-title">Send Us a Message</h4>
                        <form className="message-form">
                            <div className="form-group">
                                <label className="small-body-text text-muted">Subject</label>
                                <div className="select-wrapper">
                                    <select 
                                        className="form-input regular-body-text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                    >
                                        <option>Ticket Issue</option>
                                        <option>Refund Request</option>
                                        <option>Billing & Payment</option>
                                        <option>Refund Booth</option>
                                        <option>Account Assistance</option>
                                        <option>General Inquiry</option>
                                    </select>
                                    <Icon icon="mdi:chevron-down" className="select-icon text-muted" width="20" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="small-body-text text-muted">Event (if applicable)</label>
                                <input 
                                    type="text" 
                                    className="form-input regular-body-text" 
                                    placeholder="e.g. Neon Dreams Tour" 
                                    value={formData.event}
                                    onChange={(e) => setFormData({...formData, event: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label className="small-body-text text-muted">Message</label>
                                <textarea 
                                    className="form-input form-textarea regular-body-text" 
                                    rows="4" 
                                    placeholder="How can we help you today?"
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                ></textarea>
                            </div>
                            <button type="button" className="primary-button send-msg-btn" onClick={handleSendMessage}>
                                <Icon icon="mdi:send-outline" width="18" /> Send Message
                            </button>
                        </form>
                    </div>

                    <div className="support-card mt-l">
                        <div className="support-hours">
                            <div className="hours-title">
                                <Icon icon="mdi:clock-outline" width="18" />
                                <span className="small-body-text">Support Hours</span>
                            </div>
                            <p className="smaller-body-text text-muted">Monday - Friday: 9am - 8pm EST</p>
                            <p className="smaller-body-text text-muted">Saturday - Sunday: 10am - 6pm EST</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
