import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUrl';
import DateRangePicker from '../utils/DateRangePicker';
import { useAuthContext } from '../hooks/useAuthContext';
import eventsService from '../services/eventsService';
import usePagination from '../hooks/usePagination';
import PaginationBar from '../components/PaginationBar';
import './SponsorBrowseEvents.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const SponsorBrowseEvents = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();

    const [allEvents, setAllEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const itemsPerPage = 8;
    const {
        page, totalPages, total,
        setTotal, goTo, next, prev,
        reset: resetPage,
    } = usePagination({ limit: itemsPerPage });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
                setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const categories = ["All", ...new Set(allEvents.map(evt => evt.category).filter(Boolean))];

    const [dateRange, setDateRange] = useState(() => ({
        preset: 'all',
        presetLabel: 'All time',
        start: new Date(2000, 0, 1),
        end: new Date(9999, 11, 31),
    }));

    const handleGetBooths = (eventObj) => {
        navigate(`/sponsor/sponsor-venue-layout/${eventObj._id}`, { state: { event: eventObj } });
    };
    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const data = await eventsService.getEvents(user?.token);
                // Only show approved events
                const approvedEvents = data.filter(evt => evt.status === 'approved');
                setAllEvents(approvedEvents);
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

        const matchesCategory = selectedCategory === "All" || event.category === selectedCategory;

        return matchesSearch && matchesDate && matchesCategory;
    });

    useEffect(() => {
        setTotal({
            total: filteredEvents.length,
            totalPages: Math.ceil(filteredEvents.length / itemsPerPage) || 1,
        });
    }, [filteredEvents.length, setTotal]);

    const startIndex = (page - 1) * itemsPerPage;
    const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

    const handleEventClick = (eventId) => {
        navigate(`/sponsor/sponsor-event/${eventId}`);
    };

    return (
        <div className="sponsor-browse-container">
            <div className="sbe-header-section">
                <div className="sbe-header-title">
                    <Icon icon="mdi:calendar-search-outline" className="sbe-title-icon" />
                    <h1>Browse Events</h1>
                </div>
                <p className="regular-body-text sbe-title-desc">
                    Discover upcoming sponsorship opportunities and find the perfect event for your brand.
                </p>
            </div>

            <div className="sponsor-browse-content-card">
                <div className="sbe-toolbar">
                    <div className="sbe-toolbar-left">
                        <div className="sbe-search">
                            <Icon icon="mdi:magnify" />
                            <input
                                type="text"
                                placeholder="Search events"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    resetPage();
                                }}
                                className="small-body-text sbe-search-input"
                            />
                        </div>
                    </div>
                    <div className="sbe-toolbar-right">
                        <div className="sbe-filters" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className="sbe-filter-dropdown" ref={categoryDropdownRef}>
                                <button
                                    className="sbe-filter-dropdown-btn small-body-text"
                                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                >
                                    <span className="truncate-text">{selectedCategory}</span>
                                    <Icon
                                        icon="mdi:chevron-down"
                                        className={`dropdown-icon ${isCategoryDropdownOpen ? "open" : ""}`}
                                    />
                                </button>

                                {isCategoryDropdownOpen && (
                                    <div className="sbe-filter-dropdown-menu">
                                        {categories.map((option) => (
                                            <button
                                                key={option}
                                                className={`sbe-filter-dropdown-item small-body-text ${selectedCategory === option ? "active" : ""}`}
                                                onClick={() => {
                                                    setSelectedCategory(option);
                                                    setIsCategoryDropdownOpen(false);
                                                    resetPage();
                                                }}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <DateRangePicker
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                buttonClassName="sbe-filter-dropdown-btn small-body-text"
                                placeholder="Date Range"
                            />
                        </div>
                    </div>
                </div>

                <div className="sbe-events-grid">
                    {isLoading ? (
                        [...Array(8)].map((_, i) => (
                            <div key={i} className="sbe-skeleton-card">
                                <div className="sbe-skeleton-image"></div>
                                <div className="sbe-skeleton-details">
                                    <div className="sbe-skeleton-text sbe-skeleton-title"></div>
                                    <div className="sbe-skeleton-text sbe-skeleton-meta"></div>
                                    <div className="sbe-skeleton-text sbe-skeleton-meta"></div>
                                    <div className="sbe-skeleton-stats">
                                        <div className="sbe-skeleton-stat-box"></div>
                                        <div className="sbe-skeleton-stat-box"></div>
                                    </div>
                                    <div className="sbe-skeleton-button"></div>
                                </div>
                            </div>
                        ))
                    ) : paginatedEvents.length > 0 ? (
                        paginatedEvents.map((event) => (
                            <div key={event._id} className="sbe-event-card" onClick={() => handleEventClick(event._id)}>
                                <div className="sbe-card-image-wrap">
                                    <img
                                        src={getImageUrl(event.image)}
                                        alt={event.title}
                                        className="ticket-image"
                                        onError={(e) => { e.target.src = "/assets/eventbg.jpg" }}
                                    />
                                    <div className="sbe-category-badge button-label">
                                        {event.category || "Event"}
                                    </div>
                                </div>
                                <div className="sbe-card-details">
                                    <h5 className="sbe-event-title">{event.title}</h5>

                                    <div className="sbe-card-info small-body-text">
                                        <Icon icon="mdi:calendar-blank-outline" />
                                        <span>
                                            {(() => {
                                                const start = new Date(event.startDate);
                                                const end = event.endDate ? new Date(event.endDate) : null;
                                                const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                                                if (!end || start.toDateString() === end.toDateString()) {
                                                    return startStr;
                                                }

                                                const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                return `${startStr} - ${endStr}`;
                                            })()}
                                        </span>
                                    </div>
                                    <div className="sbe-card-info small-body-text">
                                        <Icon icon="mdi:map-marker-outline" />
                                        <span>{event.venue?.name || "TBA"}</span>
                                    </div>

                                    <div className="sbe-stats-row">
                                        <div className="sbe-stat-item">
                                            <span className="smaller-body-text stat-label">Time</span>
                                            <span className="large-body-text stat-value">{event.startTime || "TBA"} - {event.endTime || "TBA"}</span>
                                        </div>
                                        <div className="sbe-stat-item">
                                            <span className="smaller-body-text stat-label">Booths Available</span>
                                            <span className="large-body-text stat-value">{event.booths?.filter(b => b.status === "available").length || 0}</span>
                                        </div>
                                    </div>

                                    <button className="primary-button sbe-view-btn" onClick={(e) => {
                                        e.stopPropagation();
                                        handleGetBooths(event);
                                    }}>
                                        Get Booths <Icon icon="mdi:arrow-right" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="sbe-empty-state">
                            <Icon icon="mdi:magnify-close" width="48" />
                            <h4>No events found</h4>
                            <p className="small-body-text">
                                {searchQuery ? (
                                    <>No events match "<strong>{searchQuery}</strong>".</>
                                ) : (
                                    <>No events available for the selected dates.</>
                                )}
                            </p>
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
        </div>
    );
};

export default SponsorBrowseEvents;
