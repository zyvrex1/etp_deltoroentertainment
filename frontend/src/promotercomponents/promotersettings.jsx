import { useState } from "react";
import { Icon } from "@iconify/react";
import "./promotersettings.css";

const PromoterSettings = () => {
  const [profile, setProfile] = useState({
    fullName: "Alex Thompson",
    email: "alex@eventpro.com",
    phone: "+1 (555) 123-4567",
  });

  const [organization, setOrganization] = useState({
    name: "EventPro Productions",
    website: "https://eventpro.com",
    bio: "Leading event production company specializing in tech conferences.",
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
  });

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

  const renderProfileTab = () => (
    <div className="promoter-settings-content">
      <div className="promoter-settings-card promoter-account-card">
        <h3>Account Settings</h3>

        <div className="promoter-account-form-section">
          <div className="promoter-profile-photo-section">
            <div className="promoter-settings-profile-avatar">
              <Icon icon="ph:user" className="avatar-icon" />
              <button type="button" className="camera-btn">
                <Icon icon="mdi:camera-outline" />
              </button>
            </div>
          </div>

          <div className="promoter-top-profile-grid">
            <div className="form-group promoter-full-name-group">
              <label className="small-body-text">Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                className="input-field"
                onChange={(e) =>
                  setProfile({ ...profile, fullName: e.target.value })
                }
              />
            </div>

            <div className="form-group promoter-email-group">
              <label className="small-body-text">Email Address</label>
              <input
                type="email"
                value={profile.email}
                className="input-field"
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>

            <div className="form-group promoter-phone-group">
              <label className="small-body-text">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                className="input-field"
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="promoter-account-actions">
          <button type="button" className="primary-button promoter-save-profile-btn">
            Save Profile
          </button>
        </div>
      </div>

      <div className="promoter-settings-card promoter-organization-card">
        <h3>Organization Details</h3>

        <div className="promoter-org-form">
          <div className="form-group">
            <label className="small-body-text">Organization Name</label>
            <input
              type="text"
              value={organization.name}
              className="input-field"
              onChange={(e) =>
                setOrganization({ ...organization, name: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="small-body-text">Website</label>
            <input
              type="url"
              value={organization.website}
              className="input-field"
              onChange={(e) =>
                setOrganization({ ...organization, website: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="small-body-text">Bio / Description</label>
            <textarea
              rows={4}
              value={organization.bio}
              className="input-field"
              onChange={(e) =>
                setOrganization({ ...organization, bio: e.target.value })
              }
            />
          </div>

          <button type="button" className="primary-button promoter-save-org-btn">
            Save Organization
          </button>
        </div>
      </div>
    </div>
  );

  const renderTeamMembersTab = () => (
    <div className="promoter-settings-content">
      <div className="promoter-settings-card promoter-team-card">
        <div className="promoter-team-header">
          <div>
            <h3>Team Members</h3>
            <p className="small-body-text">
              Manage who has access to your events.
            </p>
          </div>
        </div>

        <div className="promoter-team-grid">
          {teamMembers.map((member) => (
            <div key={member.email} className="promoter-team-member-card">
              <div className="promoter-team-card-header">
                <div className="promoter-team-avatar">
                  <span>{member.initials}</span>
                </div>
                <span
                  className={`button-label ${
                    member.status === "active" ? "status-active" : "status-invited"
                  }`}
                >
                  {member.status}
                </span>
              </div>

              <div className="promoter-team-card-body">
                <h4>{member.name}</h4>
                <p className="smaller-body-text promoter-team-email">{member.email}</p>

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
    </div>
  );

  const renderBillingTab = () => (
    <div className="promoter-settings-content">
      <div className="promoter-settings-card promoter-payment-card">
        <h3>Payment Method</h3>
        <div className="billing-body">
          <div className="billing-card-row">
            <div className="billing-card-brand">
              <span className="button-label card-pill">VISA</span>
              <p className="regular-body-text">•••• •••• •••• 4242</p>
              <p className="small-body-text">Expires 12/25</p>
            </div>
            <span className="button-label default-pill">Default</span>
          </div>
          <button type="button" className="outlined-button add-payment-btn">
            <Icon icon="mdi:plus" />
            <span>Add Payment Method</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="promoter-settings-container">
      <div className="promoter-settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account, team, and billing preferences.</p>
        </div>
      </div>

      {renderProfileTab()}
      {renderTeamMembersTab()}
      {renderBillingTab()}
    </div>
  );
};

export default PromoterSettings;
