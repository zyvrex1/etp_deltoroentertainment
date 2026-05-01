import React from 'react';
import { Icon } from '@iconify/react';
import { useAuthContext } from '../../hooks/useAuthContext';
import './SponsorViewFullHistory.css';

const SponsorViewFullHistory = ({ isOpen, onClose, historyItem, onDownload }) => {
    const { user: authUser } = useAuthContext();
    if (!isOpen) return null;

    // Map backend reservation data (passed as historyItem.fullReservation or historyItem)
    const res = historyItem?.fullReservation || historyItem;
    
    const item = {
        eventStatus: historyItem?.eventStatus || 'Upcoming',
        booth: historyItem?.booth || `Booth #${res?.boothCode}`,
        title: historyItem?.title || res?.event?.title,
        date: historyItem?.date || (res?.event?.startDate ? new Date(res.event.startDate).toLocaleDateString() : 'TBA'),
        location: res?.event?.venue?.name || 'Venue TBA',
        confirmation: res?._id || 'N/A',
        boothType: res?.event?.priceLevels?.find(pl => pl._id === res?.event?.booths?.find(b => b.code === res?.boothCode)?.priceLevelId)?.priceName || 'Standard',
        bookingDate: historyItem?.paymentDate || (res?.createdAt ? new Date(res.createdAt).toLocaleDateString() : 'N/A'),
        paymentMethod: res?.paymentMethod === 'card' ? 'Credit Card' : 'Invoice',
        paymentDate: historyItem?.paymentDate || 'N/A',
        paymentStatus: historyItem?.paymentStatus || 'Paid',
        exhibitors: (() => {
            const leadId = res?.user?._id || res?.user;
            const isLeadAuthUser = authUser?._id === leadId;
            
            // Try user object, then flattened fields, then auth user if it matches
            let leadFirstName = res?.user?.firstName || res?.user?.name || res?.firstName || res?.billingAddress?.firstName || res?.billingAddress?.name || res?.userName || (isLeadAuthUser ? authUser?.firstName : "");
            let leadLastName = res?.user?.lastName || res?.lastName || res?.billingAddress?.lastName || (isLeadAuthUser ? authUser?.lastName : "");
            const leadCompanyName = res?.user?.companyName || res?.billingAddress?.companyName || res?.companyName;
            const leadEmail = res?.user?.email || res?.email;

            // NEW: Check if the lead is also listed in the exhibitors array (common for populated lists)
            const leadFromExhibitors = res?.exhibitors?.find(ex => (ex._id || ex.id) === leadId);
            if (leadFromExhibitors) {
                if (!leadFirstName) leadFirstName = leadFromExhibitors.firstName;
                if (!leadLastName) leadLastName = leadFromExhibitors.lastName;
            }

            let leadName = "";
            if (leadFirstName || leadLastName) {
                leadName = `${leadFirstName || ''} ${leadLastName || ''}`.trim();
            } 
            
            if (!leadName && leadEmail) {
                leadName = leadEmail.split('@')[0];
            }

            if (!leadName) {
                leadName = "Lead Representative";
            }

            const leadInitial = leadFirstName?.[0] || leadCompanyName?.[0] || leadEmail?.[0] || "S";

            return [
                { 
                    initial: leadInitial, 
                    name: leadName, 
                    company: leadCompanyName,
                    role: 'Sponsor Lead' 
                },
                ...(res?.exhibitors || []).map(ex => ({
                    initial: ex.firstName?.[0] || 'E',
                    name: `${ex.firstName || ''} ${ex.lastName || ''}`.trim() || "Exhibitor",
                    company: ex.companyName || leadCompanyName,
                    role: 'Exhibitor'
                }))
            ];
        })(),
        features: res?.event?.priceLevels?.find(pl => pl._id === res?.event?.booths?.find(b => b.code === res?.boothCode)?.priceLevelId)?.description?.split(',') || [
            'Standard Booth Inclusions', 'WiFi Access', 'Power Circuit'
        ],
        performance: {
            leads: '0',
            scans: '0',
            interactions: '0'
        },
        paymentInfo: {
            boothPrice: `$${(res?.amount?.subtotal || 0).toLocaleString()}`,
            processingFee: `$${(res?.amount?.fee || 0).toLocaleString()}`,
            tax: `$${(res?.amount?.tax || 0).toLocaleString()}`,
            totalPaid: `$${(res?.amount?.total || 0).toLocaleString()}`
        }
    };

    return (
        <div className="svfh-modal-overlay">
            <div className="svfh-modal-container">
                <div className="svfh-modal-header">
                    <h4 className="text-black m-0">View History Details</h4>
                    <button className="svfh-modal-close-icon" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="svfh-modal-body">
                    {/* Hero Section */}
                    <div className="svfh-event-header">
                        <div className="svfh-event-labels">
                            <span
                                className={`button-label svfh-status-event ${item.eventStatus
                                    ? item.eventStatus.toLowerCase().replace(/\s/g, "-")
                                    : "upcoming"
                                    }`}
                            >
                                {item.eventStatus}
                            </span>                            <span className="button-label svfh-booth-label">{item.booth}</span>
                        </div>
                        <h2 className="svfh-event-title">{item.title}</h2>
                        <div className="svfh-event-details">
                            <span className="small-body-text"><Icon icon="mdi:calendar-blank-outline" width="18" /> {item.date}</span>
                            <span className="small-body-text"><Icon icon="mdi:map-marker-outline" width="18" /> {item.location}</span>
                        </div>
                    </div>

                    <div className="svfh-content-grid">
                        {/* Booking & Payment Info */}
                        <div className="svfh-info-section">
                            <h4 className="text-black m-0">Booking Information</h4>
                            <div className="svfh-info-item">
                                <span className="small-body-text text-secondary">Confirmation Number</span>
                                 <h5>Booth-{item.confirmation.toString().slice(-6).toUpperCase()}</h5>
                            </div>
                            <div className="svfh-info-item">
                                <span className="small-body-text text-secondary">Booth Type</span>
                                <h5>{res.boothCode}</h5>
                            </div>
                            <div className="svfh-info-item">
                                <span className="small-body-text text-secondary">Booking Date</span>
                                <h6 className="text-black m-0">{item.bookingDate}</h6>
                            </div>
                            {res.poNumber && (
                                <div className="svfh-info-item">
                                    <span className="small-body-text text-secondary">PO Number</span>
                                    <h6 className="text-black m-0">{res.poNumber}</h6>
                                </div>
                            )}
                        </div>

                        <div className="svfh-info-section">
                            <h4 className="text-black m-0">Payment Information</h4>
                            <div className="svfh-info-item">
                                <span className="small-body-text text-secondary">Payment Method</span>
                                <h6 className="text-black m-0">{item.paymentMethod}</h6>
                            </div>
                            <div className="svfh-info-item">
                                <span className="small-body-text text-secondary">Payment Date</span>
                                <h6 className="text-black m-0">{item.paymentDate}</h6>
                            </div>
                            <div className="svfh-info-item">
                                <span className="small-body-text text-secondary">Status</span>
                                <div><span className={`button-label svfh-status-label ${item.paymentStatus ? item.paymentStatus.toLowerCase() : 'paid'}`}>{item.paymentStatus}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Exhibitors */}
                    <div className="svfh-section-block">
                        <h4 className="text-black m-0">Exhibitors</h4>
                        <div className="svfh-exhibitors-grid">
                            {item.exhibitors.map((ex, idx) => (
                                <div key={idx} className="svfh-exhibitor-card">
                                    <div className="svfh-exhibitor-avatar">
                                        <h6 className="m-0 text-black">{ex.initial}</h6>
                                    </div>
                                    <div className="svfh-exhibitor-info">
                                        <h6 className="text-black m-0">{ex.name}</h6>
                                        {ex.company && <p className="smaller-body-text text-black m-0" style={{ fontWeight: '500', fontSize: '11px' }}>{ex.company}</p>}
                                        <p className="smaller-body-text text-secondary m-0" style={{ fontSize: '10px' }}>{ex.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Included Features */}
                    {/* <div className="svfh-section-block">
                        <h4 className="text-black m-0">Included Features</h4>
                        <div className="svfh-features-grid">
                            {item.features.map((feature, idx) => (
                                <div key={idx} className="svfh-feature-item">
                                    <Icon icon="mdi:check-circle-outline" className="text-green" width="20" />
                                    <span className="small-body-text text-secondary">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div> */}

                    {/* Event Performance */}
                    {/* <div className="svfh-section-block">
                        <h4 className="text-black m-0">Event Performance</h4>
                        <div className="svfh-performance-grid">
                            <div className="svfh-performance-card svfh-card-blue">
                                <h2 className="svfh-performance-number text-blue">{item.performance.leads}</h2>
                                <span className="smaller-body-text text-secondary">Leads Collected</span>
                            </div>
                            <div className="svfh-performance-card svfh-card-green">
                                <h2 className="svfh-performance-number text-green">{item.performance.scans}</h2>
                                <span className="smaller-body-text text-secondary">Badge Scans</span>
                            </div>
                            <div className="svfh-performance-card svfh-card-purple">
                                <h2 className="svfh-performance-number text-purple">{item.performance.interactions}</h2>
                                <span className="smaller-body-text text-secondary">Total Interactions</span>
                            </div>
                        </div>
                    </div> */}

                    {/* Payment Summary */}
                    <div className="svfh-section-block">
                        <h4 className="text-black m-0">Payment Summary</h4>
                        <div className="svfh-summary-box">
                            <div className="svfh-summary-row">
                                <span className="small-body-text text-secondary">Booth Price</span>
                                <h6 className="text-black">{item.paymentInfo.boothPrice}</h6>
                            </div>
                            <div className="svfh-summary-row">
                                <span className="small-body-text text-secondary">Processing Fee</span>
                                <h6 className="text-black">{item.paymentInfo.processingFee}</h6>
                            </div>
                            <div className="svfh-summary-row">
                                <span className="small-body-text text-secondary">Tax</span>
                                <h6 className=" text-black">{item.paymentInfo.tax}</h6>
                            </div>
                            <div className="svfh-summary-divider"></div>
                            <div className="svfh-summary-row svfh-total-row">
                                <h4 className="text-black m-0">Total Paid</h4>
                                <h4 className="text-red m-0">{item.paymentInfo.totalPaid}</h4>
                            </div>
                        </div>
                        <button className="outlined-button svfh-receipt-btn" onClick={onDownload}>
                            <Icon icon="mdi:download-outline" width="18" /> Download Receipt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorViewFullHistory;
