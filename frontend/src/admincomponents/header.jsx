import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useLogout } from "./hooks/useLogout";
import { useAuthContext } from "./hooks/useAuthContext";
import "./header.css";
import { showLogoutConfirmAlert } from "./utils/sweetAlert";

const Header = ({ mobileExpanded, setMobileExpanded }) => {
  const { logout } = useLogout();
  const { user: authUser } = useAuthContext();
  const navigate = useNavigate();

  // Hooks must always be at the top
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef(null);

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "";
    const firstInitial = firstName ? firstName[0] : "";
    const lastInitial = lastName ? lastName[0] : "";
    return (firstInitial + lastInitial).toUpperCase();
  };

  const handleToggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  // const handleSignOut = async () => {
  //   setIsSigningOut(true);
  //   try {
  //     await logout();
  //     setIsDropdownOpen(false);
  //     navigate("/");
  //   } catch (err) {
  //     console.error(err);
  //     setIsSigningOut(false);
  //   }
  // };


  const handleSignOut = async () => {
    const result = await showLogoutConfirmAlert(
      "Logout",
      "Are you sure you want to logout?"
    );

    if (result.isConfirmed) {
      setIsSigningOut(true);
      try {
        await logout();
        setIsDropdownOpen(false);

        window.location.href = "/?logout=success";
      } catch (err) {
        console.error(err);
        setIsSigningOut(false);
      }
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

  // ✅ Early return **after hooks**
  if (!authUser) return null;

  return (
    <header className="app-header">
      <div className="header-left-mobile">
        <button
          className="mobile-header-toggle"
          onClick={() => setMobileExpanded(!mobileExpanded)}
        >
          <Icon icon={mobileExpanded ? "mdi:close" : "mdi:menu"} width="28" />
        </button>
      </div>
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
            {authUser.avatar ? (
              <img src={authUser.avatar} alt="Profile" className="header-avatar-img" />
            ) : (
              <>
                <span className="avatar-initials">
                  {getInitials(authUser.firstName, authUser.lastName)}
                </span>
                <Icon icon="mdi:account-circle" className="avatar-icon" />
              </>
            )}
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