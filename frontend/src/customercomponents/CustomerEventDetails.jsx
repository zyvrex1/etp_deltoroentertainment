import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import eventsService from '../services/eventsService';
import './CustomerEventDetails.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
 
const CustomerEventDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { user } = useAuthContext();
    const [activeTab, setActiveTab] = useState('Overview');
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [heroImage, setHeroImage] = useState('/assets/eventbg.jpg');

    const stateEvent = location.state?.event;

    const tabs = ['Overview', 'Pricing'];

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const data = await eventsService.getEvent(id, user?.token);
                setEvent(data);
                // Set initial hero image and validate it
                if (data?.image) {
                    const imgUrl = `/uploads/${data.image}`;
                    setHeroImage(imgUrl);
                    const img = new Image();
                    img.src = imgUrl;
                    img.onerror = () => setHeroImage('/assets/eventbg.jpg');
                } else {
                    setHeroImage('/assets/eventbg.jpg');
                }
            } catch (error) {
                console.error("Error fetching event:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvent();
    }, [id, user?.token, BACKEND_URL]);

    const handleBuyTickets = () => {
        navigate(`/customer/seats/${id}`, { state: { event } });
    };

    const handleBack = () => {
        navigate('/customer/browse-events');
    };

    const calculateDays = (startDate, endDate) => {
        if (!startDate || !endDate) return 1;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    };

    const stats = React.useMemo(() => {
        let totalCount = 0;
        let availableCount = 0;
        let ticketsSold = 0;
        const plStats = {}; // priceLevelId -> { total, available, sold }

        let layout = event?.layoutData;
        if (typeof layout === 'string') {
            try {
                layout = JSON.parse(layout);
            } catch (e) {
                layout = null;
            }
        }

        if (layout?.items && Array.isArray(layout.items)) {
            layout.items.forEach(item => {
                const isCircle = item.type === 'seat' || item.isSeat || (!item.isBooth && !item.isElement && !item.isBackground && item.type !== 'booth');
                if (isCircle) {
                    totalCount++;
                    const isAvailable = !item.status || item.status === 'available';
                    const isSold = item.status === 'sold' || item.status === 'partially-sold';
                    
                    if (isAvailable) availableCount++;
                    if (isSold) ticketsSold++;

                    if (item.priceLevelId) {
                        const plId = item.priceLevelId;
                        if (!plStats[plId]) {
                            plStats[plId] = { total: 0, available: 0, sold: 0 };
                        }
                        plStats[plId].total++;
                        if (isAvailable) plStats[plId].available++;
                        if (isSold) plStats[plId].sold++;
                    }
                }
            });
        } else if (event?.seatMap?.sections) {
            event.seatMap.sections.forEach(sec => {
                (sec.seats || []).forEach(seat => {
                    const count = seat.seatCount || 1;
                    totalCount += count;
                    const isAvailable = !seat.status || seat.status === 'available';
                    if (isAvailable) availableCount += count;
                    else ticketsSold += count;
                });
            });
        } else {
            // "Display ONLY what is placed" - if no layout/seatMap found, 0 is the correct count for "placed" items
            totalCount = 0;
            ticketsSold = 0;
            availableCount = 0;
        }

        if (event?.priceLevels && Array.isArray(event.priceLevels)) {
            event.priceLevels.forEach(pl => {
                if (event.eventType === "General Admission" || pl.type === "General Fee") {
                    const plTotal = pl.quantityAvailable || 0;
                    const plSold = pl.quantitySold || 0;
                    const plAvail = Math.max(0, plTotal - plSold);
                    totalCount += plTotal;
                    ticketsSold += plSold;
                    availableCount += plAvail;

                    const plId = pl._id || pl.id;
                    if (plId) {
                        if (!plStats[plId]) {
                            plStats[plId] = { total: 0, available: 0, sold: 0 };
                        }
                        plStats[plId].total += plTotal;
                        plStats[plId].available += plAvail;
                        plStats[plId].sold += plSold;
                    }
                }
            });
        }

        return { totalCount, availableCount, ticketsSold, plStats };
    }, [event]);

    const displayEvent = event || stateEvent;

    if (isLoading) {
        return (
            <div className="sed-page-wrapper">
                <div className="sed-top-header">
                    <div className="sed-header-left">
                        <button className="sed-back-btn" onClick={handleBack}>
                            <Icon icon="mdi:arrow-left" width="24" />
                        </button>
                        {displayEvent ? (
                            <h1>{displayEvent.title}</h1>
                        ) : (
                            <div className="skeleton skeleton-text title" style={{width: '300px', margin: '0 0 0 20px'}}></div>
                        )}
                    </div>
                </div>

                <div 
                    className={displayEvent ? "sed-hero-banner" : "sed-hero-banner skeleton"} 
                    style={displayEvent && stateEvent?.image ? { backgroundImage: `url(/uploads/${stateEvent.image})` } : { background: '#eee' }}
                >
                    {displayEvent && (
                        <>
                            <div className="sed-hero-overlay"></div>
                            <div className="sed-hero-content">
                                <span className="sed-open-pill button-label">
                                    {displayEvent.category?.toUpperCase() || "EVENT"}
                                </span>
                                <h1 className="sed-hero-title">{displayEvent.title}</h1>

                                <div className="sed-hero-info">
                                    <div className="sed-hero-info-item">
                                        <Icon icon="mdi:calendar" />
                                        <span className="regular-body-text">
                                            {new Date(displayEvent.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="sed-hero-info-item">
                                        <Icon icon="mdi:map-marker" />
                                        <span className="regular-body-text">{displayEvent.venue?.name || "TBA"}, {displayEvent.venue?.city || ""}, {displayEvent.venue?.state || ""}</span>
                                    </div>
                                    <div className="sed-hero-info-item">
                                        <Icon icon="mdi:clock-outline" />
                                        <span className="regular-body-text">{displayEvent.startTime || "TBA"} - {displayEvent.endTime || "TBA"}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="sed-main-container">
                    <div className="sed-content-left">
                        <div className="sed-tabs" style={{gap: '20px'}}>
                            <div className="skeleton" style={{width: '100px', height: '40px', borderRadius: '8px'}}></div>
                            <div className="skeleton" style={{width: '150px', height: '40px', borderRadius: '8px'}}></div>
                        </div>
                        <div className="sed-tab-content">
                            <div className="skeleton skeleton-text title" style={{width: '40%'}}></div>
                            <div className="skeleton skeleton-text" style={{width: '100%'}}></div>
                            <div className="sed-summary-grid" style={{marginTop: '30px'}}>
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="skeleton" style={{height: '80px', borderRadius: '12px'}}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="sed-content-right">
                        <div className="sed-reserve-card skeleton" style={{height: '350px', borderRadius: '16px'}}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="sed-error-container">
                <Icon icon="mdi:alert-circle-outline" width="48" />
                <h3>Event not found</h3>
                <button className="primary-button" onClick={handleBack}>Go Back</button>
            </div>
        );
    }



    return (
        <div className="sed-page-wrapper">
            <div className="sed-top-header">
                <div className="sed-header-left">
                    <button className="sed-back-btn" onClick={handleBack}>
                        <Icon icon="mdi:arrow-left" width="24" />
                    </button>
                    <h1>{event.title}</h1>
                </div>
            </div>

            <div
                className="sed-hero-banner"
                style={{
                    backgroundImage: `url(${heroImage})`
                }}
            >
                <div className="sed-hero-overlay"></div>
                <div className="sed-hero-content">
                    <span className="sed-open-pill button-label">
                        {event.category?.toUpperCase() || "EVENT OPEN"}
                    </span>
                    <h1 className="sed-hero-title">{event.title}</h1>

                    <div className="sed-hero-info">
                        <div className="sed-hero-info-item">
                            <Icon icon="mdi:calendar" />
                            <span className="regular-body-text">
                                {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="sed-hero-info-item">
                            <Icon icon="mdi:map-marker" />
                            <span className="regular-body-text">{event.venue?.name || "TBA"}, {event.venue?.city || ""}, {event.venue?.state || ""}</span>
                        </div>
                        <div className="sed-hero-info-item">
                            <Icon icon="mdi:clock-outline" />
                            <span className="regular-body-text">{event.startTime || "TBA"} - {event.endTime || "TBA"}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="sed-main-container">
                <div className="sed-content-left">
                    <div className="sed-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                className={`sed-tab h6 ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="sed-tab-content">
                        {activeTab === 'Overview' && (
                            <div className="sed-tab-pane">
                                <h3>About the Event</h3>
                                <p className="regular-body-text text-secondary sed-desc">
                                    {event.description || "No description available for this event."}
                                </p>

                                <h4>Event Highlights</h4>
                                <div className="sed-summary-grid">
                                    <div className="sed-summary-card">
                                        <div className="sed-summary-icon bg-red-light text-red">
                                            <Icon icon="mdi:calendar-clock" />
                                        </div>
                                        <div className="sed-summary-text">
                                            <p className="smaller-body-text text-secondary">Duration</p>
                                            <h6>{calculateDays(event.startDate, event.endDate)} Day(s)</h6>
                                        </div>
                                    </div>
                                    <div className="sed-summary-card">
                                        <div className="sed-summary-icon bg-blue-light text-blue">
                                            <Icon icon="mdi:ticket-outline" />
                                        </div>
                                        <div className="sed-summary-text">
                                            <p className="smaller-body-text text-secondary">
                                                {event.eventType === "General Admission" ? "Total Tickets" : "Total Seats"}
                                            </p>
                                            <h6>{stats.totalCount} Capacity</h6>
                                        </div>
                                    </div>
                                    <div className="sed-summary-card">
                                        <div className="sed-summary-icon bg-green-light text-green">
                                            <Icon icon="mdi:tag-outline" />
                                        </div>
                                        <div className="sed-summary-text">
                                            <p className="smaller-body-text text-secondary">Category</p>
                                            <h6>{event.category}</h6>
                                        </div>
                                    </div>
                                    <div className="sed-summary-card">
                                        <div className="sed-summary-icon bg-purple-light text-purple">
                                            <Icon icon="mdi:map-marker-radius" />
                                        </div>
                                        <div className="sed-summary-text">
                                            <p className="smaller-body-text text-secondary">Location</p>
                                            <h6>{event.venue?.city || "TBA"}</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

{activeTab === 'Pricing' && (
    <div className="sed-tab-pane">
        <h3>Seats Pricing</h3>

        <div className="sed-pricing-grid">
            {(event.priceLevels || [])
                .filter(pl => {
                    const isGA = event.eventType === "General Admission" || pl.type === "General Fee";
                    const isSeat = (pl.type || '').toLowerCase().includes("seat") ||
                                   (pl.type || '').toLowerCase().includes("circle") ||
                                   (pl.type || '').toLowerCase().includes("ticket");
                    const isBooth = (pl.type || '').toLowerCase().includes("booth");

                    // Exclude booth price levels
                    if (isBooth) return false;

                    // Always show GA
                    if (isGA) return true;

                    // For physical seats, check if any layoutData item references this price level
                    const layout = event.layoutData;
                    const items = Array.isArray(layout?.items) ? layout.items : [];
                    const isPlaced = items.some(item =>
                        (item.type || '').toLowerCase() === 'seat' &&
                        (
                            item.categoryId?.toString() === pl._id?.toString() ||
                            item.priceLevelId?.toString() === pl._id?.toString()
                        )
                    );

                    return isSeat || isPlaced;
                })
                .map((pl, idx) => {
                    const isGA = event.eventType === "General Admission" || pl.type === "General Fee";
                    const layout = event.layoutData;
                    const items = Array.isArray(layout?.items) ? layout.items : [];

                    const placedAvailable = isGA
                        ? Math.max(0, (pl.quantityAvailable || 0) - (pl.quantitySold || 0))
                        : items.filter(item =>
                            (item.type || '').toLowerCase() === 'seat' &&
                            (
                                item.categoryId?.toString() === pl._id?.toString() ||
                                item.priceLevelId?.toString() === pl._id?.toString()
                            ) &&
                            (!item.status || item.status === 'available')
                        ).length;

                    const totalPlaced = isGA
                        ? (pl.quantityAvailable || 0)
                        : items.filter(item =>
                            (item.type || '').toLowerCase() === 'seat' &&
                            (
                                item.categoryId?.toString() === pl._id?.toString() ||
                                item.priceLevelId?.toString() === pl._id?.toString()
                            )
                        ).length;

                    return (
                        <div className="sed-pricing-card" key={idx}>
                            <h6 className="text-primary text-center">{pl.priceName}</h6>
                            <p className="small-body-text text-primary text-center font-bold">
                                {pl.description || "General Entry"}
                            </p>
                            <h3 className="text-red text-center mt-2">
                                ${(pl.facePrice || 0).toLocaleString()}
                            </h3>
                            <div className="text-center mt-2">
                                <span className={`smaller-body-text ${placedAvailable > 0 ? 'text-green' : 'text-red'}`}>
                                    {placedAvailable} / {totalPlaced} {isGA ? 'Tickets Available' : 'Seats Available'}
                                </span>
                            </div>
                        </div>
                    );
                })
            }
            {(event.priceLevels || []).filter(pl => !(pl.type || '').toLowerCase().includes("booth")).length === 0 && (
                <p className="text-secondary">No ticket pricing available yet.</p>
            )}
        </div>
    </div>
)}                    </div>
                </div>

                <div className="sed-content-right">
                    <div className="sed-reserve-card">
                        <h4 className="text-primary">Get your Tickets</h4>
                        <p className="small-body-text text-secondary mb-4">
                            Tickets are selling fast! Secure your seats now and enjoy the event from the best location.
                        </p>

                        {(event.priceLevels || [])
                            .filter(pl => {
                                const isSeat = (pl.type || '').toLowerCase().includes("seat") || (pl.type || '').toLowerCase().includes("circle");
                                const isGA = event.eventType === "General Admission" || pl.type === "General Fee";
                                const isPlaced = stats.plStats[pl._id]?.total > 0 || stats.plStats[pl.id]?.total > 0;
                                if (!event.layoutData && !event.seatMap && !isGA) return false;
                                return (isSeat && isPlaced) || isGA;
                            })
                            .slice(0, 3)
                            .map((pl, idx) => {
                                const plStat = stats.plStats[pl._id] || stats.plStats[pl.id] || { available: 0 };
                                const totalAvailable = plStat.available;

                                return (
                                    <div className="sed-availability-row" key={idx}>
                                        <span className="small-body-text text-secondary font-medium">{pl.priceName}</span>
                                        <span className={`small-body-text font-bold ${totalAvailable > 0 ? 'text-green' : 'text-red'}`}>
                                            {totalAvailable > 0 ? `${totalAvailable} Avail` : 'Sold Out'}
                                        </span>
                                    </div>
                                );
                            })
                        }

                        {(() => {
                            const totalCapacity = stats.totalCount;
                            const sold = stats.ticketsSold;
                            const percent = totalCapacity > 0 ? Math.round((sold / totalCapacity) * 100) : 0;

                            return (
                                <>
                                    <div className="sed-progress-bar-container">
                                        <div className="sed-progress-bar" style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <div className="sed-progress-text">
                                        <span className="smaller-body-text text-secondary">{percent}% Sold</span>
                                    </div>
                                </>
                            );
                        })()}

                        <button className="primary-button sed-full-btn" onClick={handleBuyTickets}>Buy Tickets Now</button>

                        <div className="sed-help-link mt-4">
                            <span className="smaller-body-text text-secondary">Need help with this event? </span>
                            <button
                                className="link-btn text-red smaller-body-text"
                                onClick={() => navigate('/customer/support', {
                                    state: {
                                        tab: 'Submit a Concern',
                                        prefill: { event: event.title }
                                    }
                                })}
                            >
                                Contact Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerEventDetails;
