import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import './Home.css';
import { Icon } from "@iconify/react";
import announcementService from '../services/announcementService';
import policyService from '../services/policyService';
import eventsService from '../services/eventsService';
import { showSuccessAlert } from '../admincomponents/utils/sweetAlert';
import PromoterViewFullAnnouncement from '../promotercomponents/PromoterModal/PromoterViewFullAnnouncement';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

const Home = () => {
  const { openAuthModal } = useOutletContext() || { openAuthModal: () => { } };

  // Modal State for Policies & Announcements
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState('announcement');
  const [policies, setPolicies] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Track window width for responsive carousel positioning
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Intersection Observer for scroll reveal
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    return () => {
      revealElements.forEach(el => observer.unobserve(el));
    };
  }, [liveEvents, announcements, policies]);

  // Check for logout success message from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'success') {
      showSuccessAlert("Logged Out", "Logged out successfully");

      // Clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const openModal = (item, type) => {
    setModalData(item);
    setModalType(type);
  };
  const closeModal = () => {
    setModalData(null);
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await announcementService.getAnnouncements();
        if (data && data.length > 0) {
          const mappedAnnouncements = data.map(ann => {
            let badgeClass = "general";
            const category = ann.contentcategory?.toLowerCase();
            if (category === "maintenance") badgeClass = "maintenance";
            if (category === "news") badgeClass = "news";
            if (category === "update") badgeClass = "update";
            if (category === "alert") badgeClass = "alert";

            return {
              id: ann._id,
              type: ann.contentcategory,
              badgeClass,
              title: ann.title,
              content: ann.content,
              date: new Date(ann.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              icon: "mdi:bullhorn-outline"
            };
          });
          setAnnouncements(mappedAnnouncements);
        } else {
          setAnnouncements([]);
        }
      } catch (error) {
        console.error("Failed to load live announcements:", error);
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const data = await policyService.getPolicies();
        if (data && data.length > 0) {
          const mappedPolicies = data.map(policy => ({
            id: policy._id,
            title: policy.title,
            content: policy.content,
            key: policy.policyKey,
            date: new Date(policy.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            icon: "mdi:file-document-outline"
          }));
          setPolicies(mappedPolicies);
        } else {
          setPolicies([]);
        }
      } catch (error) {
        console.error("Failed to load live policies:", error);
      }
    };

    fetchPolicies();
  }, []);


  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventsService.getEvents(null);

        if (data && Array.isArray(data)) {
          // Helper for image URL
          const getImg = (evt) => {
            const rawImage = evt.image || evt.eventImage;
            if (!rawImage) return '/assets/eventbg.jpg';
            if (rawImage.startsWith('http')) return rawImage;
            const cleanPath = rawImage.replace(/^(\/)?uploads\//, '');
            return `${BASE_URL}/uploads/${cleanPath}`;
          };

          // 1. Live/Upcoming Events (Status: approved)
          const activeEvents = data.filter(evt => evt.status === 'approved').map(evt => ({
            id: evt._id,
            title: evt.title,
            image: getImg(evt),
            date: evt.startDate ? new Date(evt.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : 'TBA',
            fullDate: evt.startDate ? new Date(evt.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : 'TBA',
            location: evt.venue?.city ? `${evt.venue.city}${evt.venue.state ? ', ' + evt.venue.state : ''}` : 'TBA',
            tag: evt.category || 'General',
            venue: evt.venue?.name || 'To Be Announced',
            time: evt.startDate ? new Date(evt.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBA',
            daysLeft: evt.startDate ? Math.ceil((new Date(evt.startDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0
          }));
          setLiveEvents(activeEvents);

          // 2. Featured Events (Status: completed, sorted by tickets sold)
          const completedEvents = data
            .filter(evt => evt.status === 'completed')
            .map(evt => {
              const totalSold = evt.priceLevels?.reduce((sum, pl) => sum + (pl.quantitySold || 0), 0) || 0;
              return {
                id: evt._id,
                title: evt.title,
                image: getImg(evt),
                creator: evt.createdBy?.firstName || "Deltoro",
                sold: totalSold,
                category: evt.category || "Event"
              };
            })
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 8); // Top 8 featured

          setFeaturedEvents(completedEvents);
          // Set initial carousel index to middle if we have items
          if (completedEvents.length > 0) {
            setCarouselIndex(Math.floor(completedEvents.length / 2));
          }
        }
      } catch (error) {
        console.error("Failed to load events:", error);
      }
    };

    fetchEvents();
  }, []);

  // Auto-play for Featured Events Carousel
  useEffect(() => {
    if (featuredEvents.length === 0) return;

    const interval = setInterval(() => {
      handleNext();
    }, 4000); // 4 seconds for a more relaxed pace

    return () => clearInterval(interval);
  }, [featuredEvents]);

  const [direction, setDirection] = useState('next');

  const handleNext = () => {
    setDirection('next');
    setFeaturedEvents(prev => [...prev.slice(1), prev[0]]);
  };

  const handlePrev = () => {
    setDirection('prev');
    setFeaturedEvents(prev => [prev[prev.length - 1], ...prev.slice(0, -1)]);
  };


  const featuredEvent = liveEvents.length > 0 ? liveEvents[0] : null;

  return (
    <div className="landing-page nft-theme" role="document">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-main">Skip to main content</a>

      {/* Featured Event Hero */}
      <section className="nft-hero-section" aria-label="Hero banner">
        <div className="nft-hero-bg" style={{ backgroundImage: `url('${featuredEvent?.image || '/assets/eventbg.jpg'}')` }}>
          <div className="nft-hero-overlay"></div>
        </div>
        <main id="main-content" className="nft-hero-content container">
          <div className="nft-hero-text">
            <h1 className="nft-title">
              Your Events, One <span className="nft-gradient-text" style={{ background: 'linear-gradient(90deg, #FF3D3D, #FF6B6B)', WebkitBackgroundClip: 'text' }}>Connected</span><br />
              Platform
            </h1>
            <p className="nft-subtitle">
              Advance event management, seamlessly built for hosts, sponsors, and vendors.<br />
              Find, manage, and promote your events effortlessly.
            </p>
            <div className="nft-hero-buttons">
              <button
                className="nft-btn nft-btn-primary"
                onClick={() => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })}
                aria-label="Scroll to explore upcoming events"
              >
                Explore Events
              </button>
              <button className="nft-btn nft-btn-secondary" onClick={(e) => { e.preventDefault(); openAuthModal('signup', 'sponsor'); }} aria-label="Sign up as a sponsor">
                Become a Sponsor
              </button>
            </div>
          </div>


          <div className="nft-stats-cards reveal" role="list" aria-label="Platform statistics">
            <div className="nft-stat-card nft-glass stagger-1" role="listitem">
              <span className="stat-label">REGISTERED</span>
              <h3 aria-label="Over 1,500 events registered">1,500+</h3>
              <p>Events listed on platform</p>
            </div>
            <div className="nft-stat-card nft-glass stagger-2" role="listitem">
              <span className="stat-label">ACTIVE USERS</span>
              <h3 aria-label="Over 50,000 active users">50,000+</h3>
              <p>Registered event enthusiasts</p>
            </div>
            <div className="nft-stat-card nft-glass stagger-3" role="listitem">
              <span className="stat-label">TICKETS SOLD</span>
              <h3 aria-label="Over 100,000 tickets sold">100k+</h3>
              <p>Live event tickets transactions</p>
            </div>
            <div className="nft-stat-card nft-glass stagger-4" role="listitem">
              <span className="stat-label">TRUSTED VENUES</span>
              <h3 aria-label="Over 200 trusted venues">200+</h3>
              <p>Partnered event locations</p>
            </div>
          </div>
        </main>
      </section>

      {/* Announcements */}
      <section className="nft-section-full reveal" aria-label="Platform announcements">
        <div className="container">
          <div className="announcement-header">
            <h3>Platform Announcements</h3>
          </div>
        </div>

        <div className="announcements-marquee-container" role="region" aria-label="Scrolling announcements" aria-live="polite">
          <div className={`announcements-marquee-track ${announcements.length > 0 ? 'animating' : ''}`}>
            {announcements.length > 0 ? (
              // Render list twice for seamless loop
              [...announcements, ...announcements].map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="announcement-marquee-item"
                  onClick={() => openModal(item, 'announcement')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(item, 'announcement'); } }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Read announcement: ${item.title}`}
                >
                  <div className={`nft-announcement-v3 ${item.badgeClass}`}>
                    <div className="nft-v3-header">
                      <div className="nft-v3-icon-box">
                        <Icon icon={item.icon || "mdi:bullhorn-outline"} />
                      </div>
                      <span className={`nft-v3-category ${item.badgeClass}`}>{item.type}</span>
                    </div>
                    <div className="nft-v3-content">
                      <div className="nft-v3-title-row">
                        <h4>{item.title}</h4>
                        <span className="nft-v3-date-top">{item.date}</span>
                      </div>
                      <p className="nft-text-ellipsis-2">{item.content}</p>
                    </div>

                  </div>
                </div>
              ))
            ) : (
              <div className="nft-empty">
                <Icon icon="mdi:announcement-outline" />
                <p>No announcements yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="events" className="nft-section container reveal" aria-label="Live and upcoming events">
        <div className="nft-section-header">
          <div>
            <h3>Live & Upcoming Events</h3>
            <p className="nft-subheading">Secure your spot at the hottest events in town.</p>
          </div>
          <a href="#events" className="nft-link">View All</a>
        </div>

        <div className="nft-grid">
          {liveEvents.length > 0 ? (
            liveEvents.map((evt, idx) => (
              <div className={`nft-event-card-v2 nft-glass reveal stagger-${(idx % 4) + 1}`} key={idx}>
                <div className="nft-v2-image-area">
                  <img src={evt.image} alt={`Event image for ${evt.title}`} className="nft-v2-img" loading="lazy" />
                  <div className="nft-v2-date-badge">
                    <Icon icon="mdi:calendar-month" />
                    <span>{evt.date}</span>
                  </div>
                  <div className="nft-v2-like-badge">
                    <Icon icon="mdi:heart-outline" aria-hidden="true" />
                  </div>
                </div>
                <div className="nft-v2-content">
                  <h5 className="nft-v2-title">{evt.title}</h5>

                  <div className="nft-v2-details-row">
                    <div className="nft-v2-detail-item">
                      <span className="nft-v2-label">Category</span>
                      <span className="nft-v2-value">{evt.tag}</span>
                    </div>
                    <div className="nft-v2-detail-item text-right">
                      <span className="nft-v2-label">Location</span>
                      <span className="nft-v2-value">{evt.location || 'Online'}</span>
                    </div>
                  </div>

                  <div className="nft-v2-footer">
                    <div className="nft-v2-countdown">
                      <span>{evt.daysLeft > 0 ? `${evt.daysLeft} days left` : 'Starting soon'}</span>
                    </div>
                    <button className="nft-v2-btn" aria-label={`Get tickets for ${evt.title}`}>Get Tickets</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="nft-empty">
              <Icon icon="mdi:calendar-blank-outline" />
              <p>No upcoming events at the moment.</p>
            </div>
          )}
        </div>
      </section>


      {/* Featured Events (Web3 Carousel) */}
      <section className="nft-section featured-carousel-section reveal" aria-label="Featured events carousel">
        <div className="container">
          <div className="nft-section-header centered">
            <h2 className="carousel-title">Featured Events</h2>
          </div>

          <div className="carousel-view-container">
            <div
              className={`carousel-track ${direction}`}
              style={{ position: 'relative' }}
            >
              {featuredEvents.length > 0 ? (
                featuredEvents.map((evt, idx) => {
                  const centerIdx = Math.floor(featuredEvents.length / 2);
                  const isCenter = idx === centerIdx;
                  const distance = Math.abs(idx - centerIdx);
                  const opacity = Math.max(0.3, 1 - distance * 0.3);
                  const scale = Math.max(0.8, 1 - distance * 0.1);

                  return (
                    <div
                      key={evt.id}
                      className={`carousel-item ${isCenter ? 'active' : ''}`}
                      style={{
                        opacity,
                        transform: `scale(${scale}) translateX(${(idx - centerIdx) * (windowWidth < 480 ? 240 : windowWidth < 768 ? 260 : windowWidth < 1024 ? 280 : 340)}px)`,
                        zIndex: 10 - distance,
                        position: 'absolute',
                        left: windowWidth < 480 ? '-110px' : windowWidth < 768 ? '-130px' : '-170px'
                      }}
                    >
                      <div className="nft-v3-card">
                        <div className="nft-v3-image-area">
                          <img src={evt.image} alt={`Featured: ${evt.title}`} loading="lazy" />
                        </div>
                        <div className="nft-v3-content">
                          <div className="nft-v3-info">
                            <h4>{evt.title}</h4>
                            <p>by {evt.creator}</p>
                          </div>
                          <div className="nft-v3-stats">
                            <span className="price">{evt.sold.toLocaleString()} Sold</span>
                            <span className="likes"><Icon icon="mdi:heart" /> {Math.floor(evt.sold / 10)}k</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="carousel-item active" style={{ opacity: 0.15, position: 'absolute', transform: `translateX(${(i - 3) * (windowWidth < 480 ? 240 : windowWidth < 768 ? 260 : 340)}px)`, left: windowWidth < 480 ? '-110px' : windowWidth < 768 ? '-130px' : '-170px' }}>
                    <div className="nft-v3-card skeleton">
                      <div className="nft-v3-image-area"></div>
                      <div className="nft-v3-content">
                        <div className="skeleton-line" style={{ width: '80%', height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                        <div className="skeleton-line" style={{ width: '50%', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Navigation Controls */}
            <div className="carousel-controls">
              <button
                className="carousel-nav-btn prev"
                onClick={handlePrev}
                aria-label="Previous featured event"
              >
                <Icon icon="mdi:chevron-left" aria-hidden="true" />
              </button>
              <button
                className="carousel-nav-btn next"
                onClick={handleNext}
                aria-label="Next featured event"
              >
                <Icon icon="mdi:chevron-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Built For You */}
      <section id="benefits" className="nft-section container reveal" aria-label="Platform benefits">
        <div className="nft-section-header">
          <div>
            <h3>Built for You</h3>
            <p className="nft-subheading">Whether you're hosting large events or sponsoring them, our platform is built to maximize your success and audience.</p>
          </div>
        </div>

        <div className="benefits-dual-grid">
          {/* Customer Side */}
          <div className="benefit-role-card customer-card nft-glass reveal stagger-1">
            <h3 className="role-title"><span className="role-accent">|</span> Customer</h3>
            <div className="role-benefits-list">
              <div className="role-benefit-item">
                <div className="role-icon-box blue">
                  <Icon icon="mdi:ticket-confirmation-outline" />
                </div>
                <div className="role-text">
                  <h4>Instant Booking</h4>
                  <p>Secure tickets in seconds with our optimized checkout flow.</p>
                </div>
              </div>
              <div className="role-benefit-item">
                <div className="role-icon-box blue">
                  <Icon icon="mdi:television-play" />
                </div>
                <div className="role-text">
                  <h4>Virtual Events</h4>
                  <p>Access high-quality streams directly from your dashboard.</p>
                </div>
              </div>
              <div className="role-benefit-item">
                <div className="role-icon-box blue">
                  <Icon icon="mdi:heart-outline" />
                </div>
                <div className="role-text">
                  <h4>Loyalty Rewards</h4>
                  <p>Earn points for every event attended and unlock perks.</p>
                </div>
              </div>
            </div>
            <button className="role-btn btn-customer" onClick={() => openAuthModal('signup', 'customer')} aria-label="Sign up as a customer">
              Get Started as Customer →
            </button>
          </div>

          {/* Sponsor Side */}
          <div className="benefit-role-card sponsor-card nft-glass reveal stagger-2">
            <h3 className="role-title"><span className="role-accent">|</span> Sponsor</h3>
            <div className="role-benefits-list">
              <div className="role-benefit-item">
                <div className="role-icon-box green">
                  <Icon icon="mdi:handshake-outline" />
                </div>
                <div className="role-text">
                  <h4>Direct Matching</h4>
                  <p>Find events that perfectly align with your brand values.</p>
                </div>
              </div>
              <div className="role-benefit-item">
                <div className="role-icon-box green">
                  <Icon icon="mdi:shield-check-outline" />
                </div>
                <div className="role-text">
                  <h4>Verified ROI</h4>
                  <p>Transparent reporting on impressions and engagement.</p>
                </div>
              </div>
              <div className="role-benefit-item">
                <div className="role-icon-box green">
                  <Icon icon="mdi:earth" />
                </div>
                <div className="role-text">
                  <h4>Global Reach</h4>
                  <p>Connect with audiences across borders and demographics.</p>
                </div>
              </div>
            </div>
            <button className="role-btn btn-sponsor" onClick={() => openAuthModal('signup', 'sponsor')} aria-label="Sign up as a sponsor">
              Get Started as Sponsor →
            </button>
          </div>
        </div>
      </section>

      {/* Platform Policies */}
      <section id="policies" className="nft-section container reveal" aria-label="Platform policies">
        <div className="nft-section-header">
          <div>
            <h3>Platform Transparency</h3>
            <p className="nft-subheading">Our commitments to safety, security, and fair play.</p>
          </div>
        </div>

        <div className="policy-list">
          {policies.length > 0 ? (
            policies.slice(0, 6).map((policy, idx) => (
              <div
                key={policy.id}
                className={`policy-item reveal stagger-${(idx % 4) + 1}`}
                onClick={() => openModal(policy, 'policy')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(policy, 'policy'); } }}
                tabIndex={0}
                role="button"
                aria-label={`View policy: ${policy.title}`}
              >
                <div className="policy-icon-box">
                  <Icon icon={policy.icon || "mdi:check-decagram-outline"} />
                </div>
                <div className="policy-text">
                  <h4>{policy.title}</h4>
                  <p className="nft-text-ellipsis-2">{policy.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="nft-empty">
              <Icon icon="mdi:shield-outline" />
              <p>No policies available.</p>
            </div>
          )}
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="container reveal" style={{ paddingBottom: '100px' }} aria-label="Company milestones and ecosystem">
        <div className="ecosystem-container">
          <div className="ecosystem-left">
            <span className="nft-badge update" style={{ marginBottom: '20px' }}>SUMMARY</span>
            <h2 className="ecosystem-title">Connecting the Entire Event Ecosystem</h2>
            <div className="ecosystem-description">
              <p>Deltoro Entertainment is a global marketplace where you can discover, book, and promote events across multiple categories and regions.</p>
              <p>Our platform has helped organizers and promoters reach millions of fans, build brand awareness, and increase revenue through our integrated solutions.</p>
              <p>We provide are working closely with hosts to provide the best events for our users. Find, manage and promote your events effortlessly.</p>
            </div>

            <div className="ecosystem-list">
              <div className="ecosystem-item"><Icon icon="mdi:check-circle" /> Visual reach</div>
              <div className="ecosystem-item"><Icon icon="mdi:check-circle" /> Secure payments</div>
              <div className="ecosystem-item"><Icon icon="mdi:check-circle" /> 24/7 Support</div>
              <div className="ecosystem-item"><Icon icon="mdi:check-circle" /> Data Privacy</div>
            </div>
          </div>

          <div className="milestones-list">
            <div className="milestone-item reveal stagger-1">
              <div className="milestone-dot"></div>
              <div className="milestone-point"><div className="m-tag">2021</div></div>
              <div className="milestone-info">
                <h4>Founded</h4>
                <p>Started in a garage with a vision to simplify ticketing.</p>
              </div>
            </div>
            <div className="milestone-item reveal stagger-2">
              <div className="milestone-dot"></div>
              <div className="milestone-point"><div className="m-tag">2022</div></div>
              <div className="milestone-info">
                <h4>10K Users</h4>
                <p>Rapid growth among local music venues and artists.</p>
              </div>
            </div>
            <div className="milestone-item reveal stagger-3">
              <div className="milestone-dot"></div>
              <div className="milestone-point"><div className="m-tag">2023</div></div>
              <div className="milestone-info">
                <h4>Sponsor Portal</h4>
                <p>Launched the first integrated sponsorship marketplace.</p>
              </div>
            </div>
            <div className="milestone-item reveal stagger-4">
              <div className="milestone-dot"></div>
              <div className="milestone-point"><div className="m-tag">2024</div></div>
              <div className="milestone-info">
                <h4>50K Events</h4>
                <p>Expanded globally to support events in 15 countries.</p>
              </div>
            </div>
            <div className="milestone-item reveal stagger-5">
              <div className="milestone-dot"></div>
              <div className="milestone-point"><div className="m-tag">2025</div></div>
              <div className="milestone-info">
                <h4>AI Matching</h4>
                <p>Introduced smart algorithms for attendee-event pairing.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="nft-footer" role="contentinfo">
        <div className="container nft-footer-content">
          <div className="nft-footer-col">
            <img src="/logo/Logo1.png" alt="Deltoro Entertainment Logo" className="nft-footer-logo" />
            <p className="nft-text-muted">
              The easiest way to discover and book tickets for your favorite events.
              Secure, fast, and reliable.
            </p>
            <div className="nft-footer-social-links">
              <a href="https://www.tiktok.com/@eticketspro" target="_blank" rel="noopener noreferrer" className="nft-footer-social-link" aria-label="TikTok">
                <Icon icon="simple-icons:tiktok" />
              </a>
              <a href="https://www.instagram.com/eticketspr0/" target="_blank" rel="noopener noreferrer" className="nft-footer-social-link" aria-label="Instagram">
                <Icon icon="simple-icons:instagram" />
              </a>
              <a href="https://www.facebook.com/eticketspr0" target="_blank" rel="noopener noreferrer" className="nft-footer-social-link" aria-label="Facebook">
                <Icon icon="simple-icons:facebook" />
              </a>
            </div>
          </div>
          <nav className="nft-footer-col" aria-label="Platform navigation">
            <h4>Platform</h4>
            <a href="#home">Home</a>
            <a href="#benefits">Features</a>
            <a href="#events">Events</a>
          </nav>
          <nav className="nft-footer-col" aria-label="User roles navigation">
            <h4>Roles</h4>
            <a href="#home" onClick={(e) => { e.preventDefault(); openAuthModal('login', 'sponsor'); }}>For Sponsors</a>
            <a href="#home" onClick={(e) => { e.preventDefault(); openAuthModal('login', 'customer'); }}>For Attendees</a>
            <a href="#home" onClick={(e) => { e.preventDefault(); openAuthModal('login', 'promoter'); }}>For Promoters</a>
          </nav>
          <div className="nft-footer-col">
            <h4>Contact Us</h4>
            <p className="nft-text-muted">
              717 South 12th St Suite 3<br />
              McAllen, TX
            </p>
            <p><a href="mailto:info@eticketspro.com">info@eticketspro.com</a></p>
          </div>
        </div>
        <div className="nft-footer-bottom container">
          <p>© 2026 Deltoro Entertainment. All rights reserved.</p>
        </div>
      </footer>

      {/* Reusable Info Modal for Policies and Announcements */}
      <PromoterViewFullAnnouncement
        isOpen={!!modalData}
        onClose={closeModal}
        item={modalData}
        type={modalType}
      />
    </div>
  )
}

export default Home;