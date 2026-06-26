import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useLogin } from "../hooks/useLogin";
import { useAuthContext } from "../hooks/useAuthContext";
import { showSuccessAlert, showErrorAlert } from "../utils/sweetAlert";
import { forgotPassword } from "../services/authService";

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

// ─── Countdown hook ───────────────────────────────────────────
// Takes remaining milliseconds, counts down to 0, returns seconds left.
function useCountdown(initialMs) {
    const [secondsLeft, setSecondsLeft] = useState(Math.ceil((initialMs || 0) / 1000));
    const timerRef = useRef(null);

    useEffect(() => {
        if (!initialMs || initialMs <= 0) {
            setSecondsLeft(0);
            return;
        }

        setSecondsLeft(Math.ceil(initialMs / 1000));

        timerRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [initialMs]);

    return secondsLeft;
}

// Format mm:ss for display
function formatCountdown(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const Login = ({ role, onBack }) => {
    const [email, setEmail]                   = useState("");
    const [password, setPassword]             = useState("");
    const [showPassword, setShowPassword]     = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [justLoggedIn, setJustLoggedIn]     = useState(false);

    // ── Step 27: Track remaining lockout duration from the server ──
    const [lockoutMs, setLockoutMs]           = useState(null);

    const { login, error, isLoading: loginLoading } = useLogin();
    const { user }                            = useAuthContext();
    const navigate                            = useNavigate();
    const [isResetLoading, setIsResetLoading] = useState(false);

    const isLoading = loginLoading || isResetLoading;

    // Live countdown — driven by the ms the server returned
    const secondsLeft = useCountdown(lockoutMs);
    const isLockedOut = secondsLeft > 0;

    const roleData = ROLES[role];

    // Clear lockout when countdown reaches zero
    useEffect(() => {
        if (secondsLeft === 0 && lockoutMs !== null) {
            setLockoutMs(null);
        }
    }, [secondsLeft, lockoutMs]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent submit while actively locked out
        if (isLockedOut) return;

        if (isForgotPassword) {
            if (!email) {
                showErrorAlert("Input Required", "Please enter your email to receive a password reset link.");
                return;
            }

            setIsResetLoading(true);
            try {
                const response = await forgotPassword(email);
                showSuccessAlert("Success", response.data.message || `A password reset link has been sent to ${email}`);
                setIsForgotPassword(false);
                // ── Step 27: password reset clears server-side lock too ──
                setLockoutMs(null);
            } catch (err) {
                showErrorAlert("Reset Failed", err.response?.data?.error || "Failed to send reset email.");
            } finally {
                setIsResetLoading(false);
            }
            return;
        }

        try {
            // useLogin now returns { remainingMs } on lockout; see updated hook below
            const result = await login(email, password, role);

            // ── Step 27: server told us the account is locked ─────────
            if (result?.locked && result?.remainingMs) {
                setLockoutMs(result.remainingMs);
                return;
            }

            setJustLoggedIn(true);
        } catch (err) {}
    };

    // Handle Login Error Toast (non-lockout errors only — lockout has its own UI)
    useEffect(() => {
        if (error && !isLockedOut) {
            showErrorAlert("Login Failed", error);
        }
    }, [error, isLockedOut]);

    useEffect(() => {
        if (user && justLoggedIn) {
            const closeModalEvent = new CustomEvent("closeLoginModal");
            window.dispatchEvent(closeModalEvent);

            showSuccessAlert("Login Successful", `Welcome ${user.firstName || "User"}`);

            if (user.role === "admin")         navigate("/admin");
            else if (user.role === "promoter") navigate("/promoter");
            else if (user.role === "customer") navigate("/customer");
            else if (user.role === "sponsor")  navigate("/sponsor");
        }
    }, [user, justLoggedIn, navigate]);

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

            {/* ── Step 27: Lockout banner ─────────────────────────────── */}
            {isLockedOut && (
                <div className="auth-lockout-banner" role="alert" aria-live="polite">
                    <Icon icon="mdi:lock-clock" className="auth-lockout-icon" />
                    <div className="auth-lockout-text">
                        <strong>Account temporarily locked</strong>
                        <p className="smaller-body-text">
                            Too many failed attempts. Try again in{" "}
                            <span className="auth-lockout-timer">{formatCountdown(secondsLeft)}</span>
                        </p>
                        <button
                            type="button"
                            className="auth-forgot-link"
                            style={{ marginTop: "6px" }}
                            onClick={() => setIsForgotPassword(true)}
                        >
                            Unlock via forgot password →
                        </button>
                    </div>
                </div>
            )}

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
                            disabled={isLockedOut}
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
                                disabled={isLockedOut}
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
                    disabled={isLoading || isLockedOut}
                >
                    {isLoading ? (
                        "Processing..."
                    ) : isLockedOut ? (
                        <>
                            <Icon icon="mdi:lock" />
                            Locked — {formatCountdown(secondsLeft)}
                        </>
                    ) : isForgotPassword ? (
                        "Send Reset Link"
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

                {error && !isLockedOut && <div className="auth-error-msg">{error}</div>}
            </form>
        </div>
    );
};

export default Login;