import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import Login from "./Login";
import Signup from "./Signup";
import "./AuthModal.css";

const ROLES = {
    customer: {
        id: "customer",
        title: "Customer",
        desc: "Discover events, buy tickets, and manage your bookings.",
        icon: "mdi:account-group",
    },
    sponsor: {
        id: "sponsor",
        title: "Sponsor",
        desc: "Find events to sponsor and track your ROI.",
        icon: "mdi:star-outline",
    },
    promoter: {
        id: "promoter",
        title: "Promoter",
        desc: "Create events, track sales, and manage campaigns.",
        icon: "mdi:calendar-blank",
    },
    admin: {
        id: "admin",
        title: "Admin",
        desc: "Platform oversight, user management, and system settings.",
        icon: "mdi:shield-outline",
    },
};

const AuthModal = ({ isOpen, onClose, initialTab = "login" }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [selectedRole, setSelectedRole] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setSelectedRole(null);
        }
    }, [isOpen, initialTab]);

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleTabSwitch = (tab) => {
        setActiveTab(tab);
        setSelectedRole(null);
    };

    const handleBack = () => {
        setSelectedRole(null);
    };

    const renderRoleSelection = () => {
        const rolesToShow =
            activeTab === "login"
                ? [ROLES.customer, ROLES.sponsor, ROLES.promoter, ROLES.admin]
                : [ROLES.customer, ROLES.sponsor];

        return (
            <>
                <div className="auth-role-grid">
                    {rolesToShow.map((role) => (
                        <div
                            key={role.id}
                            className={`auth-role-card role-${role.id}`}
                            onClick={() => setSelectedRole(role.id)}
                        >
                            <div className="auth-role-icon-box">
                                <Icon icon={role.icon} className="auth-role-icon" />
                            </div>
                            <h4 className="auth-role-title">{role.title}</h4>
                            <p className="auth-role-desc smaller-body-text">{role.desc}</p>
                        </div>
                    ))}
                </div>

                {activeTab === "signup" && (
                    <div className="auth-info-box">
                        <Icon icon="mdi:information-outline" className="auth-info-icon" />
                        <div>
                            <h5 className="auth-info-title">Promoter & Admin Accounts</h5>
                            <div className="smaller-body-text auth-info-text">
                                Promoter and Admin accounts are created exclusively by platform
                                administrators. If you need access, please contact your
                                organization's admin or reach out to our support team.
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="auth-modal-overlay">
            <div className="auth-modal-content">
                <div className="auth-modal-header">
                    <button className="auth-modal-close" onClick={onClose}>
                        <Icon icon="mdi:close" />
                    </button>
                    <h3 className="auth-modal-title">
                        {activeTab === "login" ? "Welcome Back" : "Create Your Account"}
                    </h3>
                    <p className="auth-modal-subtitle small-body-text">
                        {activeTab === "login"
                            ? "Sign in to your eTicketsPro portal"
                            : "Join eTicketsPro and start your journey"}
                    </p>

                    {!selectedRole && (
                        <div className="auth-tabs">
                            <button
                                className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
                                onClick={() => handleTabSwitch("login")}
                            >
                                Sign In
                            </button>
                            <button
                                className={`auth-tab ${activeTab === "signup" ? "active" : ""}`}
                                onClick={() => handleTabSwitch("signup")}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>

                <div className="auth-modal-body">
                    {!selectedRole ? (
                        <>
                            <p className="smaller-body-text choose-role" style={{ marginBottom: "16px" }}>
                                {activeTab === "login"
                                    ? "Select your portal"
                                    : "Choose your account type"}
                            </p>
                            {renderRoleSelection()}
                        </>
                    ) : activeTab === "login" ? (
                        <Login role={selectedRole} onBack={handleBack} />
                    ) : (
                        <Signup role={selectedRole} onBack={handleBack} />
                    )}

                    {!selectedRole && (
                        <div className="auth-footer">
                            <p>
                                {activeTab === "login"
                                    ? "New to eTicketsPro?"
                                    : "Already have an account?"}
                                <button
                                    onClick={() =>
                                        handleTabSwitch(activeTab === "login" ? "signup" : "login")
                                    }
                                >
                                    {activeTab === "login" ? "Create an account" : "Sign In"}
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
