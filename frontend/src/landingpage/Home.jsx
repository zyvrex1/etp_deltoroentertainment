import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import './Home.css';
import { Icon } from "@iconify/react";
import announcementService from '../services/announcementService';
import policyService from '../services/policyService';
import eventsService from '../services/eventsService';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

const Home = () => {
  const { openAuthModal } = useOutletContext() || { openAuthModal: () => { } };

  // Hero Mockup Toggle State
  const [heroTab, setHeroTab] = useState('customer');

  // Built For You Tab State
  const [activeTab, setActiveTab] = useState('customer');

  // Modal State for Policies & Announcements
  const [modalData, setModalData] = useState(null);

  const openModal = (title, content) => {
    setModalData({ title, content });
  };
  const closeModal = () => {
    setModalData(null);
  };

  const [policies, setPolicies] = useState([]);

  // Initial state for announcements
  const [announcements, setAnnouncements] = useState([]);

  // Initial state for events
  const [liveEvents, setLiveEvents] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await announcementService.getAnnouncements();
        if (data && data.length > 0) {
          const mappedAnnouncements = data.map(ann => {
            let badgeClass = "blue-badge";
            if (ann.contentcategory === "Maintenance") badgeClass = "green-badge";
            if (ann.contentcategory === "News" || ann.contentcategory === "News") badgeClass = "purple-badge";
            if (ann.contentcategory === "Update" || ann.contentcategory === "Update") badgeClass = "yellow-badge";
            if (ann.contentcategory === "Alert" || ann.contentcategory === "Alert") badgeClass = "red-badge";
            if (ann.contentcategory === "General" || ann.contentcategory === "General") badgeClass = "blue-badge";

            return {
              type: ann.contentcategory,
              badgeClass,
              title: ann.title,
              content: ann.content
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
            title: policy.title,
            content: policy.content
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
        const data = await eventsService.getEvents();
        // data might be { events: [...] } or just [...]
        const eventsArray = data.events || data;

        if (Array.isArray(eventsArray) && eventsArray.length > 0) {
          // Get only the recent 6 events added (backend already sorts by createdAt: -1)
          const recentEvents = eventsArray.slice(0, 6).map(evt => {
            // Format date for the badge (e.g., "Nov 12")
            const dateObj = new Date(evt.startDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

            return {
              tag: evt.category?.toUpperCase() || "EVENT",
              title: evt.title,
              date: formattedDate,
              location: `${evt.venue?.city || ""}, ${evt.venue?.address || ""}`.trim() || "Location TBD",
              image: evt.image ? `${BASE_URL}/uploads/${evt.image}` : '/assets/eventbg.jpg'
            };
          });
          setLiveEvents(recentEvents);
        } else {
          setLiveEvents([]);
        }
      } catch (error) {
        console.error("Failed to load live events:", error);
      }
    };

    fetchEvents();
  }, []);


  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section id="home" className="hero-section" style={{ backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%), url('/assets/eventbg.jpg')` }}>
        <div className="hero-content">
          <h1>Your Events, One <span className="highlight-red">Connected</span> Platform</h1>
          <p className="large-body-text hero-subtitle">Streamline your event management journey with all the tools you need. <br /> Find, manage, and promote your events effortlessly.</p>
          <div className="hero-buttons">
            <button className="primary-button"
              onClick={() => {
                const section = document.getElementById("events");
                section?.scrollIntoView({ behavior: "smooth" });
              }}
            >Explore Events</button>
            <button className="outlined-button hero-outlined-btn" onClick={(e) => { e.preventDefault(); openAuthModal('signup', 'sponsor'); }}>Become a sponsor</button>
          </div>

          <div className="hero-mockup-wrapper">
            <div className="hero-mockup-toggle">
              <button
                className={`hero-toggle-btn ${heroTab === 'customer' ? 'active' : ''}`}
                onClick={() => setHeroTab('customer')}
              >
                Customer
              </button>
              <button
                className={`hero-toggle-btn ${heroTab === 'sponsor' ? 'active' : ''}`}
                onClick={() => setHeroTab('sponsor')}
              >
                Sponsor
              </button>
            </div>

            <div className="hero-browser-mockup">
              <div className="browser-header">
                <div className="browser-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <div className="browser-url">
                  eticketspro.com/app/{heroTab}
                </div>
              </div>

              <div className="browser-body">
                {heroTab === 'customer' ? (
                  <div className="mockup-view mockup-customer">
                    <div className="mockup-view-header">
                      <div className="mockup-view-icon blue-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      </div>
                      <div className="mockup-view-titles">
                        <h3>Event Discovery</h3>
                        <span className='small-body-text'>Dashboard Overview</span>
                      </div>
                      <div className="mockup-view-stats">
                        <span className='regular-body-text'>PERFORMANCE</span>
                        <h4>2M+ Users</h4>
                      </div>
                    </div>
                    <div className="mockup-checklist">
                      <div className="checklist-item">
                        <span className="check-icon">✓</span>
                        <p className='small-body-text'>Personalized recommendations</p>
                      </div>
                      <div className="checklist-item">
                        <span className="check-icon">✓</span>
                        <p className='small-body-text'>One-click checkout</p>
                      </div>
                      <div className="checklist-item">
                        <span className="check-icon">✓</span>
                        <p className='small-body-text'>Digital wallet integration</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mockup-view mockup-sponsor">
                    <div className="mockup-view-header">
                      <div className="mockup-view-icon green-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      </div>
                      <div className="mockup-view-titles">
                        <h3>Brand Visibility</h3>
                        <span className='small-body-text'>Dashboard Overview</span>
                      </div>
                      <div className="mockup-view-stats">
                        <span className='regular-body-text'>PERFORMANCE</span>
                        <h4>3.5x Engagement</h4>
                      </div>
                    </div>
                    <div className="mockup-checklist">
                      <div className="checklist-item">
                        <span className="check-icon">✓</span>
                        <p className='small-body-text'>ROI tracking dashboard</p>
                      </div>
                      <div className="checklist-item">
                        <span className="check-icon">✓</span>
                        <p className='small-body-text'>Automated asset delivery</p>
                      </div>
                      <div className="checklist-item">
                        <span className="check-icon">✓</span>
                        <p className='small-body-text'>Direct attendee engagement</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Announcements Marquee/List */}
      <section className="latest-announcements">
        <div className={`announcements-container ${announcements.length > 0 ? 'scrolling' : ''}`}>
          {announcements.length > 0 ? (
            announcements.map((ann, idx) => (
              <div
                className="announcement-item clickable"
                key={idx}
                onClick={() => openModal(ann.title, ann.content)}
              >
                <span
                  className={`button-label announcement-badge ${ann.badgeClass}`}
                >
                  {ann.type}
                </span>

                <h5 className="announcement-text">{ann.title}</h5>
                <p className="small-body-text announcement-desc">{ann.content}</p>
              </div>
            ))
          ) : (
            <div className="no-announcements">
              <h3>There is no announcement yet</h3>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="events" className="upcoming-events">
        <div className="section-header">
          <div>
            <h2>Upcoming Events</h2>
            <p>Discover trending events happening soon. Tap into your next adventure.</p>
          </div>
          <a href="#events" className="see-all-link">See All Events &gt;</a>
        </div>

        <div className="events-grid">
          {liveEvents.length > 0 ? (
            liveEvents.map((evt, idx) => (
              <div className="event-card" key={idx}>
                <div
                  className="event-image"
                  style={{ 
                    backgroundImage: `url('${evt.image}')`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center' 
                  }}
                >
                  <span className="button-label event-date-badge">{evt.date}</span>
                </div>
                <div className="event-details">
                  <span className="button-label event-tag">{evt.tag}</span>
                  <h4>{evt.title}</h4>
                  <p className="event-location">📍 {evt.location}</p>
                  <button className="primary-button full-width-btn">Get Tickets</button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-events-container" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
               <h3 className="medium-body-text">No upcoming events at the moment.</h3>
            </div>
          )}
        </div>
      </section>

      {/* Success Stories */}
      <section className="success-stories">
        <div className="success-section-header">
          <h2>Success Stories</h2>
          <p>See how event organizers unlock their potential using our platform tools to manage their events.</p>
        </div>
        <div className="stories-grid">
          <div className="story-card">
            <div className="story-header">★ Featured</div>
            <h3>TechCrunch Disrupt 2023</h3>
            <div className="story-stats">
              <div><span className="small-body-text stat-label">Tickets</span><br /><span className="large-body-text stat-value">124K</span></div>
              <div><span className="small-body-text stat-label">Revenue</span><br /><span className="large-body-text stat-value">$2.1M</span></div>
            </div>
          </div>
          <div className="story-card">
            <div className="story-header">★ Featured</div>
            <h3>Coachella Valley Music</h3>
            <div className="story-stats">
              <div><span className="small-body-text stat-label">Attendees</span><br /><span className="large-body-text stat-value">125K+</span></div>
              <div><span className="small-body-text stat-label">Revenue</span><br /><span className="large-body-text stat-value">$20M+</span></div>
            </div>
          </div>
          <div className="story-card">
            <div className="story-header">★ Featured</div>
            <h3>SXSW Conference</h3>
            <div className="story-stats">
              <div><span className="small-body-text stat-label">Attendees</span><br /><span className="large-body-text stat-value">45K</span></div>
              <div><span className="small-body-text stat-label">Revenue</span><br /><span className="large-body-text stat-value">$18.5M</span></div>
            </div>
          </div>
          <div className="story-card">
            <div className="story-header">★ Featured</div>
            <h3>Def Con Hacking Expo</h3>
            <div className="story-stats">
              <div><span className="small-body-text stat-label">Attendees</span><br /><span className="large-body-text stat-value">30K</span></div>
              <div><span className="small-body-text stat-label">Revenue</span><br /><span className="large-body-text stat-value">$5.5M</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Built for You */}
      <section id="benefits" className="built-for-you">
        <div className="built-section-header">
          <h2>Built for You</h2>
          <p>Whether you're hosting large events or sponsoring them, our platform is built to maximize your success and audience.</p>
        </div>

        <div className="built-for-you-grid">
          {/* Customer Side */}
          <div className="built-for-you-column customer-column">
            <h3 className="column-title customer-title">Customer</h3>
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon blue-bg-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
                </div>
                <div className="feature-text">
                  <h5>Instant Booking</h5>
                  <p>Secure tickets in seconds with our optimized checkout flow.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon blue-bg-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                </div>
                <div className="feature-text">
                  <h5>Virtual Events</h5>
                  <p>Access high-quality streams directly from your dashboard.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon blue-bg-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </div>
                <div className="feature-text">
                  <h5>Loyalty Rewards</h5>
                  <p>Earn points for every event attended and unlock perks.</p>
                </div>
              </div>
              <button
                className="primary-button blue-btn full-width-mobile"
                onClick={() => openAuthModal("signup", "customer")}
              >
                Get Started as Customer &rarr;
              </button>
            </div>
          </div>

          {/* Sponsor Side */}
          <div className="built-for-you-column sponsor-column">
            <h3 className="column-title sponsor-title">Sponsor</h3>
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon green-bg-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v11"></path><path d="m14 2 2.5 2.5L22 2"></path></svg>
                </div>
                <div className="feature-text">
                  <h5>Direct Matching</h5>
                  <p>Find events that perfectly align with your brand values.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon green-bg-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                </div>
                <div className="feature-text">
                  <h5>Verified ROI</h5>
                  <p>Transparent reporting on impressions and engagement.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon green-bg-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                </div>
                <div className="feature-text">
                  <h5>Global Reach</h5>
                  <p>Connect with audiences across borders and demographics.</p>
                </div>
              </div>
              <button
                className="primary-button green-btn full-width-mobile"
                onClick={() => openAuthModal("signup", "sponsor")}
              >
                Get Started as Sponsor &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Policies */}
      <section id="policies" className="platform-policies">
        <div className="policy-section-header">
          <h2>Platform Policies</h2>
          <p>Transparency is our priority. Review our policies below to understand how we operate.</p>
        </div>

        <div className="policy-grid">
          {policies.length > 0 ? (
            policies.map((policy, idx) => (
              <div className="policy-item" key={idx} onClick={() => openModal(policy.title, policy.content)}>
                <span className="policy-icon">📄</span>
                <h4 className="policy-title">{policy.title}</h4>
              </div>
            ))
          ) : (
            <div className="no-policies">
              <h3>There is no policy yet</h3>
            </div>
          )}
        </div>
      </section>

      {/* History Section (eTicketsPro) */}
      <section id="about" className="history-section">
        <div className="history-container">
          <div className="history-text">
            <span className="button-label light-blue-badge">Our Story</span>
            <h2>Connecting the Entire <br /><span className="highlight-red">Event Ecosystem</span></h2>
            <p className="history-paragraph">eTicketsPro wasn't built just to sell tickets. It was built to solve the fragmentation in the event industry. For too long, promoters, sponsors, and attendees operated in silos.</p>
            <p className="history-paragraph">Our mission is to create a unified platform where value flows freely between all stakeholders. By integrating ticketing, marketing, and sponsorship into one dashboard, we empower organizers to create sustainable, profitable events.</p>
            <p className="history-paragraph">Today, we power thousands of experiences daily, from intimate workshops to massive festivals, ensuring that every connection counts.</p>
            <div className="history-checks">
              <div className="large-body-text history-check-item"><span className="green-check">✓</span> Global Reach</div>
              <div className="large-body-text history-check-item"><span className="green-check">✓</span> Secure Payments</div>
              <div className="large-body-text history-check-item"><span className="green-check">✓</span> 24/7 Support</div>
              <div className="large-body-text history-check-item"><span className="green-check">✓</span> Data Privacy</div>
            </div>
          </div>
          <div className="history-timeline">
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="button-label timeline-year">2021</span>
                  <h4>Founded</h4>
                </div>
                <p>Started in a garage with a vision to simplify ticketing.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="button-label timeline-year">2022</span>
                  <h4>10K Users</h4>
                </div>
                <p className='small-body-text'>Rapid growth among local music venues and artists.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="button-label timeline-year">2023</span>
                  <h4>Sponsor Portal</h4>
                </div>
                <p className='small-body-text'>Launched the first integrated sponsorship marketplace.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="button-label timeline-year">2024</span>
                  <h4>50K Events</h4>
                </div>
                <p className='small-body-text'>Expanded globally to support events in 15 countries.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="button-label timeline-year">2025</span>
                  <h4>AI Matching</h4>
                </div>
                <p className='small-body-text'>Introduced smart algorithms for attendee-event pairing.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer-section">
        <div className="footer-top">
          <div className="footer-logo-col">
            <img src="/logo/Logo1.png" alt="App Logo" className="sponsor-logo" />
            <p className="small-body-text footer-desc">
              The easiest way to discover and book tickets for your favorite events.
              Secure, fast, and reliable.
            </p>
          </div>
          <div className="footer-column">
            <h4>Platform</h4>
            <a href="#home">Home</a>
            <a href="#benefits">Features</a>
            <a href="#home">Pricing</a>
            <a href="#about">API Documentation</a>
            <a href="#policies">Integrations</a>
          </div>
          <div className="footer-column">
            <h4>Roles</h4>
            <a href="#home" onClick={(e) => { e.preventDefault(); openAuthModal('login', 'sponsor'); }}>For Sponsors</a>
            <a href="#home" onClick={(e) => { e.preventDefault(); openAuthModal('login', 'customer'); }}>For Attendees</a>
            <a href="#home" onClick={(e) => { e.preventDefault(); openAuthModal('login', 'promoter'); }}>For Promoters</a>
            <a href="#home" onClick={(e) => { e.preventDefault(); openAuthModal('login', 'admin'); }}>For Admin</a>
            <a href="#home" onClick={(e) => { e.preventDefault(); openAuthModal('login', 'promoter'); }}>Partner Program</a>
          </div>
          <div className="footer-column">
            <h4>Legal & Support</h4>
            <a href="#policies">Terms of Service</a>
            <a href="#policies">Privacy Policy</a>
            <a href="#policies">Cookie Policy</a>
            <a href="#home">Help Center</a>
            <a href="#home">Contact Us</a>
          </div>
          <div className="footer-column">
            <h4>Contact Us</h4>
            <p>
              717 South 12th St Suite 3<br />
              McAllen, TX, United States, Texas
            </p>
            <p>
              <a href="tel:+19564671080">
                +1 956-467-1080
              </a>
            </p>

            <p>
              <a href="mailto:info@eticketspro.com">
                info@eticketspro.com
              </a>
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Deltoro Entertainment. All rights reserved.</p>
          <div className="social-links">
            <a
              href="https://www.tiktok.com/@eticketspro"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
            >
              <Icon icon="simple-icons:tiktok" width="22" />
            </a>

            <a
              href="https://www.instagram.com/eticketspr0/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <Icon icon="simple-icons:instagram" width="22" />
            </a>

            <a
              href="https://www.facebook.com/eticketspr0"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <Icon icon="simple-icons:facebook" width="22" />
            </a>
          </div>
        </div>
      </footer>

      {/* Reusable Info Modal for Policies and Announcements */}
      {modalData && (
        <div className="info-modal-overlay" onClick={closeModal}>
          <div className="info-modal-content" onClick={e => e.stopPropagation()}>
            <div className="info-modal-header">
              <h3>{modalData.title}</h3>
              <button className="info-modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="info-modal-body">
              <p>{modalData.content}</p>
            </div>
            <button className="info-modal-close-btn" onClick={closeModal}>Close</button>

          </div>
        </div>
      )}
    </div>
  )
}

export default Home;