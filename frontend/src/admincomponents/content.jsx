import React, { useState } from 'react';
import { FaPlus, FaFileContract, FaShieldAlt, FaFileInvoiceDollar } from 'react-icons/fa';
import './content.css';
import { Icon } from "@iconify/react";
import CreateAnnouncementModal from './Modal/CreateAnnouncementModal';
import ManagePolicyModal from './Modal/ManagePolicyModal';

const ContentManager = () => {
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

    // Initial dummy data
    const [announcements, setAnnouncements] = useState([
        {
            id: 1,
            title: "System Maintenance Scheduled",
            date: "2026-01-12",
            content: "We will be performing scheduled maintenance on the payment gateway to improve security and reliability. Services may be intermittent during this time.",
            category: "Maintenance"
        },
        {
            id: 2,
            title: "New Feature: Booth Maps",
            date: "2024-09-28",
            content: "Promoters can now design interactive booth layouts directly from the dashboard. This new feature allows for drag-and-drop configuration of exhibition spaces.",
            category: "News"
        }
    ]);

    // Policies State
    const [policies, setPolicies] = useState([
        {
            id: 'tos',
            title: 'Terms of Service',
            icon: <FaFileContract />,
            lastUpdated: 'Jan 01, 2026',
            content: "Welcome to ETP Deltoro Entertainment. By using our website and services, you agree to comply with and be bound by the following terms and conditions of use...\n\n1. Acceptance of Terms\nBy accessing this website we assume you accept these terms and conditions. Do not continue to use ETP Deltoro Entertainment if you do not agree to take all of the terms and conditions stated on this page.\n\n2. License\nUnless otherwise stated, ETP Deltoro Entertainment and/or its licensors own the intellectual property rights for all material on ETP Deltoro Entertainment. All intellectual property rights are reserved."
        },
        {
            id: 'privacy',
            title: 'Privacy Policy',
            icon: <FaShieldAlt />,
            lastUpdated: 'Dec 15, 2025',
            content: "At ETP Deltoro Entertainment, accessible from our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by ETP Deltoro Entertainment and how we use it.\n\n1. Information We Collect\nThe personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information."
        },
        {
            id: 'refund',
            title: 'Refund Policy',
            icon: <FaFileInvoiceDollar />,
            lastUpdated: 'Nov 20, 2025',
            content: "We want you to be completely satisfied with your purchase on ETP Deltoro Entertainment. If you are not satisfied, we are here to help.\n\n1. Returns\nYou have 30 calendar days to return an item from the date you received it. To be eligible for a return, your item must be unused and in the same condition that you received it.\n\n2. Refunds\nOnce we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item."
        }
    ]);

    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

    const handleSaveAnnouncement = (newAnnouncement) => {
        const announcement = {
            id: announcements.length + 1,
            ...newAnnouncement
        };
        setAnnouncements([announcement, ...announcements]);
        setIsAnnouncementModalOpen(false);
    };

    const handleOpenPolicyModal = (policy) => {
        setSelectedPolicy(policy);
        setIsPolicyModalOpen(true);
    };

    const handleSavePolicy = (updatedPolicy) => {
        setPolicies(policies.map(p => p.id === updatedPolicy.id ? {
            ...updatedPolicy,
            lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        } : p));
        setIsPolicyModalOpen(false);
        setSelectedPolicy(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

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
                        {announcements.map((announcement) => (
                            <div className="announcement-item" key={announcement.id}>
                                <div className="announcement-header">
                                    <h5>{announcement.title}</h5>
                                    <span className="small-body-text announcement-date">{formatDate(announcement.date)}</span>
                                </div>
                                <p className="small-body-text announcement-desc">
                                    {announcement.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="content-card legal-card">
                    <h3>Legal & Policies</h3>
                    <div className="legal-list">
                        {policies.map(policy => (
                            <button
                                key={policy.id}
                                className="legal-item"
                                onClick={() => handleOpenPolicyModal(policy)}
                            >
                                <div className="legal-icon">
                                    {policy.icon}
                                </div>
                                <h6>{policy.title}</h6>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <CreateAnnouncementModal
                isOpen={isAnnouncementModalOpen}
                onClose={() => setIsAnnouncementModalOpen(false)}
                onSave={handleSaveAnnouncement}
            />

            <ManagePolicyModal
                isOpen={isPolicyModalOpen}
                policy={selectedPolicy}
                onClose={() => setIsPolicyModalOpen(false)}
                onSave={handleSavePolicy}
            />
        </div>
    );
};

export default ContentManager;
