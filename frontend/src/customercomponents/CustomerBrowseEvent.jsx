import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import DateRangePicker from '../utils/DateRangePicker';
import { useAuthContext } from '../hooks/useAuthContext';
import eventsService from '../services/eventsService';
import usePagination from '../hooks/usePagination';
import PaginationBar from '../components/PaginationBar';
import './CustomerBrowseEvent.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const CustomerBrowseEvent = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();

    const [allEvents, setAllEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 8;
    const {
        page, totalPages, total,
        setTotal, goTo, next, prev,
        reset: resetPage,
    } = usePagination({ limit: itemsPerPage });

    const [dateRange, setDateRange] = useState(() => ({
        preset: 'all',
        presetLabel: 'All time',
        start: new Date(2000, 0, 1),
        end: new Date(2100, 11, 31),
    }));

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                // Backend handles role-based filtering, but we specify 'approved' to be sure
                const data = await eventsService.getEvents(user?.token, 'approved');
                setAllEvents(data || []);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, [user?.token]);

    const handleDateRangeChange = (newRange) => {
        setDateRange(newRange);
        resetPage();
    };

    const filteredEvents = allEvents.filter((event) => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.venue?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.venue?.city || "").toLowerCase().includes(searchQuery.toLowerCase());

        // Date range filtering
        const eventDate = new Date(event.startDate);
        const matchesDate = eventDate >= dateRange.start && eventDate <= dateRange.end;

        return matchesSearch && matchesDate;
    });

    useEffect(() => {
        setTotal({
            total: filteredEvents.length,
            totalPages: Math.ceil(filteredEvents.length / itemsPerPage) || 1,
        });
    }, [filteredEvents.length, setTotal]);

    const startIndex = (page - 1) * itemsPerPage;
    const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

    const handleEventClick = (eventObj) => {
        navigate(`/customer/event-details/${eventObj._id}`, { state: { event: eventObj } });
    };

    const handleGetTickets = (eventObj) => {
        navigate(`/customer/seats/${eventObj._id}`, { state: { event: eventObj } });
    };

    const formatEventDate = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : null;
        const options = { month: 'short', day: 'numeric' };

        const startStr = start.toLocaleDateString('en-US', options);
        if (!end || start.toDateString() === end.toDateString()) {
            return startStr;
        }

        const endStr = end.toLocaleDateString('en-US', options);
        return `${startStr} - ${endStr}`;
    };

    const getAvailableSeats = (event) => {
    let availableCount = 0;

    let layout = event.layoutData;
    
    // TEMPORARY DEBUG - remove after fixing
    console.log(`[${event.title}] layoutData:`, layout);
    console.log(`[${event.title}] priceLevels:`, event.priceLevels);
    
    if (typeof layout === 'string') {
            try {
                layout = JSON.parse(layout);
            } catch (e) {
                layout = null;
            }
        }

        if (layout && Array.isArray(layout.items)) {
           layout.items.forEach(item => {
    const type = (item.type || "").toLowerCase();
    const status = (item.status || "available").toLowerCase(); // ← normalize case

    const isCircle = type === 'seat';  // ← only trust explicit type
    const isAvailable = status === 'available';

    if (isCircle && isAvailable) {
        availableCount++;
    }
});
        } else if (event.seatMap && event.seatMap.sections) {
            event.seatMap.sections.forEach(sec => {
                (sec.seats || []).forEach(seat => {
                    const isAvailable = !seat.status || seat.status === 'available';
                    if (isAvailable) {
                        availableCount += seat.seatCount || 1;
                    }
                });
            });
        }

        // Check for General Admission or General Fee categories
        if (event.priceLevels && Array.isArray(event.priceLevels)) {
            event.priceLevels.forEach(pl => {
    const plType = (pl.type || "").toLowerCase(); // ← normalize
    if ((event.eventType || "").toLowerCase() === "general admission" || plType === "general fee") {
        const availableQty = Math.max(0, (pl.quantityAvailable || 0) - (pl.quantitySold || 0));
        availableCount += availableQty;
    }
});
        }

        return availableCount;
    };

    return (
        <div className="cbe-page-wrapper">
            <div className="cbe-header-section">
                <div className="cbe-header-title">
                    <Icon icon="mdi:calendar-search-outline" className="cbe-title-icon" />
                    <h1>Browse Events</h1>
                </div>
                <p className="regular-body-text cbe-title-desc">
                    Discover upcoming events, find your favorites, and get your tickets today.
                </p>
            </div>

            <div className="cbe-content-card">
                <div className="cbe-toolbar">
                    <div className="cbe-toolbar-left">
                        <div className="cbe-search">
                            <Icon icon="mdi:magnify" />
                            <input
                                type="text"
                                placeholder="Search events, artist or venue"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    resetPage();
                                }}
                                className="small-body-text"
                            />
                        </div>
                    </div>

                    <div className="cbe-toolbar-right">
                        <div className="cbe-filters">
                            <DateRangePicker
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                buttonClassName="cbe-filter-dropdown-btn small-body-text"
                                placeholder="Date Range"
                            />
                        </div>
                    </div>
                </div>

                <div className="cbe-grid">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="cbe-event-card skeleton">
                                <div className="cbe-card-image-wrap skeleton-box" style={{ height: '160px' }}></div>
                                <div className="cbe-card-details">
                                    <div className="skeleton-box" style={{ height: '24px', width: '70%', marginBottom: '12px' }}></div>
                                    <div className="skeleton-box" style={{ height: '16px', width: '50%', marginBottom: '8px' }}></div>
                                    <div className="skeleton-box" style={{ height: '16px', width: '60%', marginBottom: '20px' }}></div>
                                    <div className="skeleton-box" style={{ height: '40px', width: '100%' }}></div>
                                </div>
                            </div>
                        ))
                    ) : paginatedEvents.length > 0 ? (
                        paginatedEvents.map((event) => (
                            <div key={event._id} className="cbe-event-card" onClick={() => handleEventClick(event)}>
                                <div className="cbe-card-image-wrap">
                                    <img
                                        src={event.image ? `/uploads/${event.image}` : '/assets/eventbg.jpg'}
                                        alt={event.title}
                                        onError={(e) => {
                                            e.target.src = '/assets/eventbg.jpg';
                                            e.target.onerror = null; // Prevent infinite loop if fallback also fails
                                        }}
                                    />
                                    <div className="cbe-category-badge button-label">
                                        {event.category || "Event"}
                                    </div>
                                </div>
                                <div className="cbe-card-details">
                                    <h5 className="cbe-event-title">{event.title}</h5>

                                    <div className="cbe-card-info small-body-text">
                                        <Icon icon="mdi:calendar-blank-outline" />
                                        <span>{formatEventDate(event.startDate, event.endDate)}</span>
                                    </div>
                                    <div className="cbe-card-info small-body-text">
                                        <Icon icon="mdi:map-marker-outline" />
                                        <span>{event.venue?.name || "TBA"}</span>
                                    </div>

                                    <div className="cbe-stats-row">
                                        <div className="cbe-stat-item">
                                            <span className="smaller-body-text stat-label">Time</span>
                                            <span className="large-body-text stat-value">{event.startTime || "TBA"}</span>
                                        </div>
                                        <div className="cbe-stat-item">
                                            <span className="smaller-body-text stat-label">
                                                {event.eventType === "General Admission" ? "Available Tickets" : "Available Seats"}
                                            </span>
                                            <span className="large-body-text stat-value">{getAvailableSeats(event)}</span>
                                        </div>
                                    </div>

                                    <button 
                                        className="primary-button cbe-view-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleGetTickets(event);
                                        }}
                                    >
                                        Get Seats <Icon icon="mdi:arrow-right" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="cbe-empty-state">
                            <Icon icon="mdi:magnify-close" width="48" />
                            <h4>No events found</h4>
                            <p className="small-body-text">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </div>

                <PaginationBar
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPrev={prev}
                    onNext={next}
                    onGoTo={goTo}
                />
            </div>
            <style>{`
                .skeleton-box {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite;
                    border-radius: 4px;
                }
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
};

export default CustomerBrowseEvent;
