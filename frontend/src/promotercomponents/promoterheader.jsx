import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import "./promoterheader.css";
import { showConfirmAlert, showSuccessAlert } from "../admincomponents/utils/sweetAlert";

const PromoterHeader = ({ user = null }) => {
  const currentUser = user || {
    name: "Alex Thompson",
    email: "alex@ticketspro.com",
    role: "Promoter",
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleToggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    const result = await showConfirmAlert(
      "Sign Out?",
      "Are you sure you want to sign out?",
      "Yes, Sign Out",
      "Cancel"
    );

    if (result.isConfirmed) {
      await showSuccessAlert("Signed Out", "You have been successfully signed out.");
      navigate("/login");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="app-header">
      <div className="header-profile" ref={dropdownRef}>
        <button
          type="button"
          className="profile-info profile-toggle"
          onClick={handleToggleDropdown}
        >
          <div className="profile-details">
            <h4 className="profile-name">{currentUser.name}</h4>
            <div className="profile-meta">
              <p className="small-body-text profile-email">
                {currentUser.email}
              </p>
              <p className="small-body-text profile-role">
                <strong>{currentUser.role}</strong>
              </p>
            </div>
          </div>
          <div className="profile-avatar">
            <span className="avatar-initials">
              {getInitials(currentUser.name)}
            </span>
            <Icon icon="mdi:account-circle" className="avatar-icon" />
          </div>
        </button>

        {isDropdownOpen && (
          <div className="profile-dropdown">
            <Link
              to="/promoter/settings"
              className="dropdown-item"
              onClick={() => setIsDropdownOpen(false)}
            >
              <Icon icon="mdi:cog-outline" className="dropdown-icon" />
              <span>Settings</span>
            </Link>
            <button
              type="button"
              className="dropdown-item dropdown-signout"
              onClick={handleSignOut}
            >
              <Icon icon="mdi:logout" className="dropdown-icon" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default PromoterHeader;
