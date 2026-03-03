import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import './SponsorMyBooth.css';

export default function SponsorMyBooth() {
    const myBooths = [
        {
            id: 1,
            image: '/assets/eventbg.jpg',
            title: 'TechInnovate Summit 2026',
            date: 'Jun 16, 2026',
            location: 'Starlight Arena, Los Angeles, CA',
            type: 'Premium Island',
        },
        {
            id: 2,
            image: '/assets/eventbg.jpg',
            title: 'TechInnovate Summit 2026',
            date: 'Jun 16, 2026',
            location: 'Starlight Arena, Los Angeles, CA',
            type: 'Premium Island',
        }
    ];

    return (
        <div className="sponsor-my-booth-container">
            <div className="my-booth-header">
                <div>
                    <h2>My Reserved Booths</h2>
                    <p className="regular-body-text text-secondary">Manage your event sponsorships and exhibitor details</p>
                </div>
                <NavLink to="/sponsor/sponsor-events" className="primary-button sponsor-events-btn">
                    Find more Events
                </NavLink>
            </div>

            <div className="my-booth-list">
                {myBooths.map(booth => (
                    <div key={booth.id} className="my-booth-card">
                        <div className="my-booth-image-container">
                            <img src={booth.image} alt={booth.title} className="my-booth-image" />
                        </div>
                        <div className="my-booth-content">
                            <div className="my-booth-details-top">
                                <div className="my-booth-title-row">
                                    <h3>{booth.title}</h3>
                                </div>
                                <div className="my-booth-info-row">
                                    <Icon icon="mdi:calendar-blank" width="20" />
                                    <span className="regular-body-text">{booth.date}</span>
                                </div>
                                <div className="my-booth-info-row">
                                    <Icon icon="mdi:map-marker-outline" width="20" />
                                    <span className="regular-body-text">{booth.location}</span>
                                </div>
                                <div className="button-label my-booth-type-pill">
                                    {booth.type}
                                </div>
                            </div>

                            <hr className="my-booth-divider" />

                            <div className="my-booth-actions">
                                <div className="my-booth-actions-left">
                                    <NavLink to="/sponsor/sponsor-booth-details" className="my-booth-dark-btn">
                                        <Icon icon="mdi:eye-outline" width="18" /> View Full Details
                                    </NavLink>
                                    <NavLink to={`/sponsor/sponsor-event/${booth.id}`} className="outlined-button my-booth-outlined-btn">
                                        <Icon icon="mdi:open-in-new" width="18" /> Event Page
                                    </NavLink>
                                </div>
                            </div>
                        </div>
                        <div className="my-booth-qr-section">
                            <div className="my-booth-qr-code">
                                <Icon icon="mdi:qrcode" width="100" color="var(--color-black-secondary)" />
                            </div>
                            <span className="small-body-text text-secondary">Tap to enlarge</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
