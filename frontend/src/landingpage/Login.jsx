import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useLogin } from "../admincomponents/hooks/useLogin";
import { useAuthContext } from "../admincomponents/hooks/useAuthContext";

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

const Login = ({ role, onBack }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    const { login, error, isLoading } = useLogin();
    const { user } = useAuthContext();
    const navigate = useNavigate();

    const roleData = ROLES[role];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isForgotPassword) {
            // Simulate sending temporary password
            if (!email) {
                alert("Please enter your email to receive a temporary password.");
                return;
            }
            alert(`A temporary password has been sent to ${email}`);
            setIsForgotPassword(false);
            return;
        }

        await login(email, password);
    };

    useEffect(() => {
        if (user) {
            // Close modal if it exists
            const closeModalEvent = new CustomEvent("closeLoginModal");
            window.dispatchEvent(closeModalEvent);

            if (user.role === "admin") {
                navigate("/admin");
            } else if (user.role === "promoter") {
                navigate("/promoter");
            } else if (user.role === "customer") {
                navigate("/customer");
            } else if (user.role === "sponsor") {
                navigate("/sponsor");
            }
        }
    }, [user, navigate]);

    if (!roleData) return null;

    return (
        <div className="auth-form-container">
            <button className="small-body-text auth-back-btn" onClick={onBack}>
                <Icon icon="mdi:arrow-right" style={{ transform: "rotate(180deg)" }} />
                Back to role selection
            </button>

            <div className={`auth-role-banner role-banner-${roleData.id}`}>
                <div className={`auth-role-icon-box role-${roleData.id}`} style={{ marginBottom: 0 }}>
                    <Icon icon={roleData.icon} className="auth-role-icon" />
                </div>
                <div className="role-banner-content">
                    <h4>
                        {isForgotPassword ? "Reset Password" : `Sign in as ${roleData.title}`}
                    </h4>
                    <p className="smaller-body-text">{roleData.desc}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="auth-form-group">
                    <div className="auth-form-label-row">
                        <label className="auth-form-label">Email Address</label>
                    </div>
                    <div className="auth-input-wrapper">
                        <Icon icon="mdi:email-outline" className="auth-input-icon" />
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="you@example.com"
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                        />
                    </div>
                </div>

                {!isForgotPassword && (
                    <div className="auth-form-group">
                        <div className="auth-form-label-row">
                            <label className="small-body-text auth-form-label">Password</label>
                            <button
                                type="button"
                                className="auth-forgot-link"
                                onClick={() => setIsForgotPassword(true)}
                            >
                                Forgot password?
                            </button>
                        </div>
                        <div className="auth-input-wrapper">
                            <Icon icon="mdi:lock-outline" className="auth-input-icon" />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="auth-input"
                                placeholder="Enter your password"
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                            />
                            <button
                                type="button"
                                className="auth-input-icon-right"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <Icon
                                    icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"}
                                />
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    className={`auth-submit-btn btn-${roleData.id}`}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        "Processing..."
                    ) : isForgotPassword ? (
                        "Send Temporary Password"
                    ) : (
                        <>
                            Sign In <Icon icon="mdi:open-in-new" />
                        </>
                    )}
                </button>

                {isForgotPassword && (
                    <button
                        type="button"
                        className="auth-back-btn"
                        style={{ marginTop: "16px", justifyContent: "center", width: "100%" }}
                        onClick={() => setIsForgotPassword(false)}
                    >
                        Cancel and Return to Login
                    </button>
                )}

                {error && <div className="auth-error-msg">{error}</div>}
            </form>
        </div>
    );
};

export default Login;