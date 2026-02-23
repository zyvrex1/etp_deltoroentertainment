import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useLogout } from "./hooks/useLogout";
import { useAuthContext } from "./hooks/useAuthContext";
import "./header.css";

const Header = () => {
  const { logout } = useLogout();
  const { user: authUser } = useAuthContext();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef(null);

  // Hide header if no user
  if (!authUser) return null;

  // Safe getInitials function using firstName + lastName
  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "";
    const firstInitial = firstName ? firstName[0] : "";
    const lastInitial = lastName ? lastName[0] : "";
    return (firstInitial + lastInitial).toUpperCase();
  };

  const handleToggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      setIsDropdownOpen(false);
      navigate("/");
    } catch (err) {
      console.error(err);
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <div className="header-profile" ref={dropdownRef}>
        <button className="profile-info profile-toggle" onClick={handleToggleDropdown}>
          <div className="profile-details">
            <h4 className="profile-name">
              {authUser.firstName && authUser.lastName
                ? `${authUser.firstName} ${authUser.lastName}`
                : "User"}
            </h4>
            <p className="small-body-text profile-email">{authUser.email}</p>
            <p className="small-body-text profile-role">
              <strong>{authUser.role}</strong>
            </p>
          </div>
          <div className="profile-avatar">
            <span className="avatar-initials">
              {getInitials(authUser.firstName, authUser.lastName)}
            </span>
            <Icon icon="mdi:account-circle" className="avatar-icon" />
          </div>
        </button>

        {isDropdownOpen && (
          <div className="profile-dropdown">
            <Link
              to="/admin/settings"
              className="dropdown-item"
              onClick={() => setIsDropdownOpen(false)}
            >
              <Icon icon="mdi:cog-outline" className="dropdown-icon" />
              <span>Settings</span>
            </Link>
            <button
              className="dropdown-item dropdown-signout"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <Icon icon="mdi:logout" className="dropdown-icon" />
              <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;