import React, { useState } from 'react';
import { FaPlus, FaFileContract, FaShieldAlt, FaFileInvoiceDollar } from 'react-icons/fa';
import './content.css';
import { Icon } from "@iconify/react";
import CreateAnnouncementModal from './Modal/CreateAnnouncementModal';


const ContentManager = () => {
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    return (
        <div className="content-manager">
            <div className="content-header">
                <div>
                    <h1>Content Management</h1>
                    <p>Manage platform announcements and static content</p>
                </div>
                <div className="content-actions">
                    <button className="primary-button" onClick={() => setIsAnnouncementModalOpen(true)}>
                        <Icon icon="mdi:plus" /> New Announcement
                    </button>
                </div>
            </div>


            <div className="content-grid">
                <div className="content-card announcements-card">
                    <h3>Announcements</h3>
                    <div className="announcement-list">
                        <div className="announcement-item">
                            <div className="announcement-header">
                                <h5>System Maintenance Scheduled</h5>
                                <span className="small-body-text announcement-date">Jan 12, 2026</span>
                            </div>
                            <p className="small-body-text announcement-desc">
                                We will be performing scheduled maintenance on the payment gateway...
                            </p>
                        </div>

                        <div className="announcement-item">
                            <div className="announcement-header">
                                <h5>New Feature: Booth Maps</h5>
                                <span className="small-body-text announcement-date">Sep 28, 2024</span>
                            </div>
                            <p className="small-body-text announcement-desc">
                                Promoters can now design interactive booth layouts directly...
                            </p>
                        </div>
                    </div>
                </div>

                <div className="content-card legal-card">
                    <h3>Legal & Policies</h3>
                    <div className="legal-list">
                        <button className="legal-item">
                            <div className="legal-icon">
                                <FaFileContract />
                            </div>
                            <h6>Terms of Service</h6>
                        </button>

                        <button className="legal-item">
                            <div className="legal-icon">
                                <FaShieldAlt />
                            </div>
                            <h6>Privacy Policy</h6>
                        </button>

                        <button className="legal-item">
                            <div className="legal-icon">
                                <FaFileInvoiceDollar />
                            </div>
                            <h6>Refund Policy</h6>
                        </button>
                    </div>
                </div>
            </div>
            <CreateAnnouncementModal isOpen={isAnnouncementModalOpen} onClose={() => setIsAnnouncementModalOpen(false)} />
        </div>
    );
};

export default ContentManager;
