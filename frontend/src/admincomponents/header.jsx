import { Icon } from "@iconify/react";
import "./header.css";

const Header = ({ user = null }) => {
  // Default user data if not provided (can be replaced with actual login data)
  const currentUser = user || {
    name: "Alex Thompson",
    email: "alex@ticketspro.com",
    role: "Super Admin",
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="app-header">
      <div className="header-profile">
        <div className="profile-info">
          <div className="profile-details">
            <h4 className="profile-name">{currentUser.name}</h4>
            <div className="profile-meta">
              <p className="small-body-text profile-email">{currentUser.email}</p>
              <p className="small-body-text profile-role"><strong>{currentUser.role}</strong></p>
            </div>
          </div>
          <div className="profile-avatar">
            <span className="avatar-initials">{getInitials(currentUser.name)}</span>
            <Icon icon="mdi:account-circle" className="avatar-icon" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
