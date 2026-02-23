import { useState } from "react";
import { Icon } from "@iconify/react";
import "./promotersettings.css";

const PromoterSettings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const teamMembers = [
    {
      initials: "AT",
      name: "Alex Thompson",
      email: "alex@eventpro.com",
      status: "active",
      events: ["TechStart Summit 2025", "SaaS Growth Meetup"],
    },
    {
      initials: "JP",
      name: "Jessica Park",
      email: "jessica@eventpro.com",
      status: "active",
      events: ["TechStart Summit 2025", "Creator Economy Expo"],
    },
    {
      initials: "RC",
      name: "Ryan Cooper",
      email: "ryan@eventpro.com",
      status: "active",
      events: ["Winter Music Festival", "SaaS Growth Meetup"],
    },
    {
      initials: "ED",
      name: "Emily Davis",
      email: "emily@eventpro.com",
      status: "active",
      events: ["Winter Music Festival", "Creator Economy Expo"],
    },
    {
      initials: "MW",
      name: "Mark Wilson",
      email: "mark@contractor.com",
      status: "invited",
      events: ["Winter Music Festival", "Creator Economy Expo"],
    },
  ];

  const renderProfile = () => (
    <div className="settings-grid">
      <div className="settings-card profile-card">
        <h3>Personal Information</h3>
        <div className="profile-card-body">
          <div className="profile-photo-column">
            <div className="profile-avatar-large">
              <span className="avatar-initials-large">AT</span>
            </div>
            <button className="outlined-button change-photo-btn">
              Change Photo
            </button>
          </div>

          <div className="profile-form-column">
            <div className="two-column-grid">
              <div className="form-group">
                <label className="small-body-text">First Name</label>
                <input
                  className="input-field"
                  type="text"
                  defaultValue="Alex"
                />
              </div>
              <div className="form-group">
                <label className="small-body-text">Last Name</label>
                <input
                  className="input-field"
                  type="text"
                  defaultValue="Thompson"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="small-body-text">Email Address</label>
              <input
                className="input-field"
                type="email"
                defaultValue="alex@eventpro.com"
              />
            </div>
            <div className="form-group">
              <label className="small-body-text">Phone Number</label>
              <input
                className="input-field"
                type="tel"
                defaultValue="+1 (555) 123-4567"
              />
            </div>
            <div className="form-actions">
              <button className="primary-button full-width-mobile">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-card password-card">
        <h3>Password</h3>
        <div className="password-form">
          <div className="form-group">
            <label className="small-body-text">Current Password</label>
            <input className="input-field" type="password" />
          </div>
          <div className="form-group">
            <label className="small-body-text">New Password</label>
            <input className="input-field" type="password" />
          </div>
          <div className="form-group">
            <label className="small-body-text">Confirm New Password</label>
            <input className="input-field" type="password" />
          </div>
          <div className="form-actions">
            <button className="secondary-button full-width-mobile">
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrganization = () => (
    <div className="settings-card organization-card">
      <h3>Organization Details</h3>
      <div className="organization-form">
        <div className="form-group">
          <label className="small-body-text">Organization Name</label>
          <input
            className="input-field"
            type="text"
            defaultValue="EventPro Productions"
          />
        </div>
        <div className="form-group">
          <label className="small-body-text">Website</label>
          <input
            className="input-field"
            type="url"
            defaultValue="https://eventpro.com"
          />
        </div>
        <div className="form-group">
          <label className="small-body-text">Bio / Description</label>
          <textarea
            className="input-field textarea"
            rows={4}
            defaultValue="Leading event production company specializing in tech conferences."
          />
        </div>
        <div className="form-actions">
          <button className="primary-button full-width-mobile">
            Save Organization
          </button>
        </div>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="team-section">
      <div className="team-header-row">
        <div>
          <h3>Team Members</h3>
          <p className="small-body-text">
            Manage who has access to your events.
          </p>
        </div>
        <button className="primary-button invite-btn">
          Invite Member
        </button>
      </div>

      <div className="team-grid">
        {teamMembers.map((member) => (
          <div key={member.email} className="team-card">
            <div className="team-card-header">
              <div className="team-avatar">
                <span>{member.initials}</span>
              </div>
              <span
                className={`status-pill ${
                  member.status === "active" ? "status-active" : "status-invited"
                }`}
              >
                {member.status}
              </span>
            </div>
            <div className="team-card-body">
              <h4>{member.name}</h4>
              <p className="small-body-text team-email">{member.email}</p>
              <div className="assigned-events">
                <p className="small-body-text label">Assigned Events</p>
                <div className="event-tags">
                  {member.events.map((event) => (
                    <span key={event} className="event-tag">
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="settings-card billing-card">
      <h3>Payment Method</h3>
      <div className="billing-body">
        <div className="billing-card-row">
          <div className="billing-card-brand">
            <span className="card-pill">VISA</span>
            <p className="regular-body-text">•••• •••• •••• 4242</p>
            <p className="small-body-text">Expires 12/25</p>
          </div>
          <span className="default-pill">Default</span>
        </div>
        <button className="outlined-button add-payment-btn">
          <Icon icon="mdi:plus" />
          <span>Add Payment Method</span>
        </button>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "organization":
        return renderOrganization();
      case "team":
        return renderTeam();
      case "billing":
        return renderBilling();
      case "profile":
      default:
        return renderProfile();
    }
  };

  return (
    <div className="promoter-settings-page">
      <div className="settings-header-row">
        <h1>Settings</h1>
        <p>
          Manage your profile, organization, team, and billing information.
        </p>
      </div>

      <div className="settings-tabs">
        <button
          type="button"
          className={`settings-tab ${
            activeTab === "profile" ? "active" : ""
          }`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button
          type="button"
          className={`settings-tab ${
            activeTab === "organization" ? "active" : ""
          }`}
          onClick={() => setActiveTab("organization")}
        >
          Organization
        </button>
        <button
          type="button"
          className={`settings-tab ${
            activeTab === "team" ? "active" : ""
          }`}
          onClick={() => setActiveTab("team")}
        >
          Team Members
        </button>
        <button
          type="button"
          className={`settings-tab ${
            activeTab === "billing" ? "active" : ""
          }`}
          onClick={() => setActiveTab("billing")}
        >
          Billing
        </button>
      </div>

      <div className="settings-tab-content">{renderActiveTab()}</div>
    </div>
  );
};

export default PromoterSettings;

