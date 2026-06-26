import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { showSuccessAlert, showErrorAlert } from "../utils/sweetAlert";
import { resetPassword } from "../services/authService";
import "./AuthModal.css"; // Reuse existing modal and auth forms styles

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token") || "";
    const email = searchParams.get("email") || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token || !email) {
            showErrorAlert("Invalid Link", "The password reset link is invalid or incomplete.");
            return;
        }

        if (!newPassword || !confirmNewPassword) {
            showErrorAlert("Input Required", "Please fill in all fields.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showErrorAlert("Validation Error", "Passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            showErrorAlert("Validation Error", "Password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await resetPassword({
                token,
                email,
                newPassword,
                confirmNewPassword,
            });

            showSuccessAlert(
                "Success", 
                response.data.message || "Your password has been successfully reset. Please log in with your new password."
            );
            navigate("/");
        } catch (err) {
            showErrorAlert(
                "Reset Failed", 
                err.response?.data?.error || "Failed to reset password. The link may have expired."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0f0c20 0%, #15102a 100%)",
            padding: "20px"
        }}>
            <div className="auth-modal-content" style={{ maxWidth: "450px", width: "100%", padding: "40px", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)", background: "#1a1a2e" }}>
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <img src="/logo/Logo1.png" alt="Logo" style={{ width: "180px", marginBottom: "20px" }} />
                    <h2 style={{ color: "#fff", marginBottom: "10px", fontSize: "24px" }}>Set New Password</h2>
                    <p style={{ color: "#9ca3af", fontSize: "14px" }}>Choose a strong password with at least 8 characters.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="auth-input-group">
                        <label style={{ display: "block", color: "#d1d5db", marginBottom: "8px", fontSize: "14px" }}>New Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "12px 40px 12px 16px",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.05)",
                                    color: "#fff",
                                    fontSize: "15px",
                                    outline: "none",
                                    boxSizing: "border-box"
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    color: "#9ca3af",
                                    cursor: "pointer",
                                    padding: 0
                                }}
                            >
                                <Icon icon={showNewPassword ? "mdi:eye-off" : "mdi:eye"} width="20" />
                            </button>
                        </div>
                    </div>

                    <div className="auth-input-group">
                        <label style={{ display: "block", color: "#d1d5db", marginBottom: "8px", fontSize: "14px" }}>Confirm New Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "12px 40px 12px 16px",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.05)",
                                    color: "#fff",
                                    fontSize: "15px",
                                    outline: "none",
                                    boxSizing: "border-box"
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    color: "#9ca3af",
                                    cursor: "pointer",
                                    padding: 0
                                }}
                            >
                                <Icon icon={showConfirmPassword ? "mdi:eye-off" : "mdi:eye"} width="20" />
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "8px",
                            border: "none",
                            background: "linear-gradient(90deg, #6c63ff 0%, #5a52e6 100%)",
                            color: "#fff",
                            fontSize: "16px",
                            fontWeight: "bold",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            transition: "all 0.3s ease",
                            marginTop: "10px",
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
