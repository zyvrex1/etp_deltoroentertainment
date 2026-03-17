import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './promoterticketsetup.css';
import PromoterAddTicketTypeModal from './PromoterModal/PromoterAddTicketTypeModal';
import PromoterEditTicketTypeModal from './PromoterModal/PromoterEditTicketTypeModal';

const GripIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="12" r="1.5"></circle>
        <circle cx="9" cy="5" r="1.5"></circle>
        <circle cx="9" cy="19" r="1.5"></circle>
        <circle cx="15" cy="12" r="1.5"></circle>
        <circle cx="15" cy="5" r="1.5"></circle>
        <circle cx="15" cy="19" r="1.5"></circle>
    </svg>
);

const UsersIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const EditIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
);

const TrashIcon = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const PromoterTicketSetup = () => {
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState("techstart");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTicketToEdit, setSelectedTicketToEdit] = useState(null);
    const eventDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target)) {
                setIsEventDropdownOpen(false);
            }
        };

        if (isEventDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isEventDropdownOpen]);


    const getSelectedEventLabel = () => {
        const option = eventOptions.find(opt => opt.value === selectedEvent);
        return option ? option.label : "Select Event";
    };

    const handleEventChange = (val) => {
        setSelectedEvent(val);
        setIsEventDropdownOpen(false);
    };

    return (
        <div className="ticket-setup-container">
            <div className="ticket-setup-header">
                <div className="ts-header-left">
                    <h1 className="ts-title">Ticket Setup</h1>
                    <p className="small-body-text ts-header-subtitle">Here's what's happening with your events today.</p>
                </div>
                <div className="ts-header-controls">
                  
                    <button className="primary-button ts-action" onClick={() => setIsAddModalOpen(true)}>Add Ticket Type</button>
                </div>
            </div>

            <div className="ts-main-content">
                {/* Event Banner */}
                <div className="ts-event-banner">
                    <div className="ts-banner-info">
                        <h3>TechStart Summit 2024</h3>
                        <p className='small-body-text'>Oct 12, 2024 &bull; Moscone</p>
                    </div>
                    <div className="ts-banner-stats">
                        <div className="ts-stat-item">
                            <h4>450</h4>
                            <span className="ts-stat-label smaller-body-text">Tickets Sold</span>
                        </div>
                        <div className="ts-stat-item">
                            <h4>600</h4>
                            <span className="ts-stat-label smaller-body-text">Total Available</span>
                        </div>
                        <div className="ts-stat-item ts-stat-revenue">
                            <h4>$ 64,050</h4>
                            <span className="ts-stat-label smaller-body-text">Revenue</span>
                        </div>
                    </div>
                </div>

                <div className="ts-content-columns">
                    {/* Left Column */}
                    <div className="ts-left-col">
                        <div className="ts-ticket-list">
                            {/* Ticket Card 1 */}
                            <div className="ts-ticket-card">
                                <div className="ts-drag-handle"><GripIcon /></div>
                                <div className="ts-ticket-content">
                                    <div className="ts-ticket-header">
                                        <h4>Early Bird General Admission</h4>
                                        <span className="button-label ts-badge-ended">Ended</span>
                                    </div>
                                    <p className="ts-ticket-desc">Access to all main stage talks</p>
                                    <div className="ts-ticket-meta">
                                        <span className="ts-meta-price">$ 99</span>
                                        <span className="ts-meta-sold"><UsersIcon /> 180 / 200 sold</span>
                                        <span className="ts-meta-revenue">$ 17,820 revenue</span>
                                    </div>
                                    <div className="ts-ticket-actions">
                                        <button className="ts-action-btn" onClick={() => {
                                            setSelectedTicketToEdit({
                                                ticketName: "Early Bird General Admission",
                                                price: "99",
                                                quantity: "200",
                                                description: "Access to all main stage talks",
                                                salesStart: "2024-07-01",
                                                salesEnd: "2024-08-31"
                                            });
                                            setIsEditModalOpen(true);
                                        }}><EditIcon /></button>
                                        <button className="ts-action-btn"><TrashIcon /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Card 2 */}
                            <div className="ts-ticket-card">
                                <div className="ts-drag-handle"><GripIcon /></div>
                                <div className="ts-ticket-content">
                                    <div className="ts-ticket-header">
                                        <h4>General Admission</h4>
                                        <span className="button-label ts-badge-active">Active</span>
                                    </div>
                                    <p className="ts-ticket-desc">Full event access</p>
                                    <div className="ts-ticket-meta">
                                        <span className="ts-meta-price">$ 149</span>
                                        <span className="ts-meta-sold"><UsersIcon /> 220 / 300 sold</span>
                                        <span className="ts-meta-revenue">$ 32,780 revenue</span>
                                    </div>
                                    <div className="ts-ticket-actions">
                                        <button className="ts-action-btn" onClick={() => {
                                            setSelectedTicketToEdit({
                                                ticketName: "General Admission",
                                                price: "149",
                                                quantity: "300",
                                                description: "Full event access",
                                                salesStart: "2024-09-01",
                                                salesEnd: "2024-10-12"
                                            });
                                            setIsEditModalOpen(true);
                                        }}><EditIcon /></button>
                                        <button className="ts-action-btn"><TrashIcon /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Card 3 */}
                            <div className="ts-ticket-card">
                                <div className="ts-drag-handle"><GripIcon /></div>
                                <div className="ts-ticket-content">
                                    <div className="ts-ticket-header">
                                        <h4>VIP Access</h4>
                                        <span className="button-label ts-badge-active">Active</span>
                                    </div>
                                    <p className="ts-ticket-desc">VIP lounge, priority seating, meet & greet</p>
                                    <div className="ts-ticket-meta">
                                        <span className="ts-meta-price">$ 299</span>
                                        <span className="ts-meta-sold"><UsersIcon /> 35 / 50 sold</span>
                                        <span className="ts-meta-revenue">$ 10,465 revenue</span>
                                    </div>
                                    <div className="ts-ticket-actions">
                                        <button className="ts-action-btn" onClick={() => {
                                            setSelectedTicketToEdit({
                                                ticketName: "VIP Access",
                                                price: "299",
                                                quantity: "50",
                                                description: "VIP lounge, priority seating, meet & greet",
                                                salesStart: "2024-07-01",
                                                salesEnd: "2024-10-12"
                                            });
                                            setIsEditModalOpen(true);
                                        }}><EditIcon /></button>
                                        <button className="ts-action-btn"><TrashIcon /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Card 4 */}
                            <div className="ts-ticket-card">
                                <div className="ts-drag-handle"><GripIcon /></div>
                                <div className="ts-ticket-content">
                                    <div className="ts-ticket-header">
                                        <h4>Workshop Pass</h4>
                                        <span className="button-label ts-badge-active">Active</span>
                                    </div>
                                    <p className="ts-ticket-desc">Access to hands-on workshops</p>
                                    <div className="ts-ticket-meta">
                                        <span className="ts-meta-price">$ 199</span>
                                        <span className="ts-meta-sold"><UsersIcon /> 15 / 50 sold</span>
                                        <span className="ts-meta-revenue">$ 2,985 revenue</span>
                                    </div>
                                    <div className="ts-ticket-actions">
                                        <button className="ts-action-btn" onClick={() => {
                                            setSelectedTicketToEdit({
                                                ticketName: "Workshop Pass",
                                                price: "199",
                                                quantity: "50",
                                                description: "Access to hands-on workshops",
                                                salesStart: "2024-08-01",
                                                salesEnd: "2024-10-11"
                                            });
                                            setIsEditModalOpen(true);
                                        }}><EditIcon /></button>
                                        <button className="ts-action-btn"><TrashIcon /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="ts-right-col">
                        <div className="ts-side-box ts-fee-config">
                            <h4>Fee Configuration</h4>
                            <div className="ts-checkbox-row">
                                <label htmlFor="pass-fees">Pass fees to customer</label>
                                <input type="checkbox" id="pass-fees" defaultChecked />
                            </div>
                            <div className="ts-checkbox-row">
                                <label htmlFor="absorb-fees">Absorb fees</label>
                                <input type="checkbox" id="absorb-fees" />
                            </div>
                            <div className="ts-fee-note">
                                <p className="smaller-body-text">Current platform fee is 2.5% + $0.99 per ticket.</p>
                            </div>
                        </div>

                        <div className="ts-side-box ts-customer-preview">
                            <div className="ts-preview-header">
                                <h4>Customer Preview</h4>
                            </div>
                            <div className="ts-preview-body">
                                <div className="ts-preview-card">
                                    <div className="ts-pcard-header">
                                        <h5 style={{ fontWeight: 600 }}>Early Bird General Admission</h5>
                                        <h6 className="ts-pcard-price">$ 99.00</h6>
                                    </div>
                                    <p className="ts-pcard-desc smaller-body-text">Access to all main stage talks</p>
                                    <div className="ts-pcard-controls">
                                        <div className="ts-qty-selector">
                                            <button className="ts-qty-btn">-</button>
                                            <span className="ts-qty-value">1</span>
                                            <button className="ts-qty-btn">+</button>
                                        </div>
                                        <button className="primary-button ts-add-btn">ADD</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PromoterAddTicketTypeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={(data) => {
                    console.log('New Ticket Data:', data);
                    // Add logic here when actual backend integration happens
                }}
            />

            <PromoterEditTicketTypeModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialTicket={selectedTicketToEdit}
                onSave={(data) => {
                    console.log('Updated Ticket Data:', data);
                    // Update logic here
                }}
            />
        </div>
    );
};

export default PromoterTicketSetup;
