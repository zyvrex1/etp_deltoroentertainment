import { useState } from "react";
import { Icon } from "@iconify/react";
import { useSignup } from "../admincomponents/hooks/useSignup";

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
};

const Signup = ({ role, onBack }) => {
  const { signup, isLoading, error } = useSignup();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    companyName: "",
    industry: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFullNameChange = (e) => {
    const fullName = e.target.value;
    const parts = fullName.trim().split(" ");
    const first = parts[0] || "";
    const last = parts.slice(1).join(" ") || "";

    setForm({
      ...form,
      fullName: fullName,
      firstName: first,
      lastName: last
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password || !form.confirmPassword) {
      alert("Email and passwords are required");
      return;
    }

    if (
      role === "sponsor" &&
      (!form.firstName ||
        !form.lastName ||
        !form.phone ||
        !form.companyName ||
        !form.industry)
    ) {
      alert("Please fill all sponsor fields");
      return;
    }

    if (
      role === "customer" &&
      (!form.firstName || !form.lastName || !form.phone)
    ) {
      alert("Please fill all customer fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    await signup(form, role);
    // Modal will be closed via parent or redirect if successful (depends on useSignup implementation)
  };

  const roleData = ROLES[role];
  if (!roleData) return null;

  return (
    <div className="auth-form-container">
      <button className="auth-back-btn" onClick={onBack}>
        <Icon icon="mdi:arrow-right" style={{ transform: "rotate(180deg)" }} />
        Back to role selection
      </button>

      <div className={`auth-role-banner role-banner-${roleData.id}`}>
        <div
          className={`auth-role-icon-box role-${roleData.id}`}
          style={{ marginBottom: 0 }}
        >
          <Icon icon={roleData.icon} className="auth-role-icon" />
        </div>
        <div className="role-banner-content">
          <h4>Sign up as {roleData.title}</h4>
          <p>{roleData.desc}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        <div>
          <label className="small-body-text auth-form-label" style={{ marginBottom: "8px" }}>
            Full Name
          </label>
          <div className="auth-input-wrapper">
            <Icon icon="mdi:account-outline" className="auth-input-icon" />
            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={form.fullName || ""}
              onChange={handleFullNameChange}
              required
              className="auth-input"
            />
          </div>
        </div>

        <div>
          <label className="auth-form-label" style={{ marginBottom: "8px" }}>
            Email Address
          </label>
          <div className="auth-input-wrapper">
            <Icon icon="mdi:email-outline" className="auth-input-icon" />
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>
        </div>

        <div>
          <label className="auth-form-label" style={{ marginBottom: "8px" }}>
            Phone Number
          </label>
          <div className="auth-input-wrapper">
            <Icon icon="mdi:phone-outline" className="auth-input-icon" />
            <input
              type="text"
              name="phone"
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>
        </div>

        {role === "sponsor" && (
          <div className="auth-form-row">
            <div>
              <label className="auth-form-label" style={{ marginBottom: "8px" }}>
                Company Name
              </label>
              <div className="auth-input-wrapper">
                <Icon icon="mdi:domain" className="auth-input-icon" />
                <input
                  type="text"
                  name="companyName"
                  placeholder="ACME Corp"
                  value={form.companyName}
                  onChange={handleChange}
                  required
                  className="auth-input"
                />
              </div>
            </div>
            <div>
              <label className="auth-form-label" style={{ marginBottom: "8px" }}>
                Industry
              </label>
              <div className="auth-input-wrapper">
                <Icon icon="mdi:briefcase-outline" className="auth-input-icon" />
                <input
                  type="text"
                  name="industry"
                  placeholder="Technology"
                  value={form.industry}
                  onChange={handleChange}
                  required
                  className="auth-input"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="auth-form-label-row">
            <label className="auth-form-label">
              Password
            </label>
            <button
              type="button"
              className="auth-forgot-link"
            >
              Forgot password?
            </button>
          </div>
          <div className="auth-input-wrapper">
            <Icon icon="mdi:lock-outline" className="auth-input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Create a Strong Password"
              value={form.password}
              onChange={handleChange}
              required
              className="auth-input"
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

        <div>
          <label className="auth-form-label" style={{ marginBottom: "8px" }}>
            Confirm Password
          </label>
          <div className="auth-input-wrapper">
            <Icon icon="mdi:lock-outline" className="auth-input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="auth-input"
            />
            <button
              type="button"
              className="auth-input-icon-right"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Icon
                icon={showConfirmPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"}
              />
            </button>
          </div>
        </div>

        <p style={{ fontSize: "12px", color: "var(--color-white-secondary)", marginTop: "8px" }}>
          By creating an account, you agree to our <a href="#" style={{ color: "var(--color-red-primary)" }}>Terms of Service</a> and <a href="#" style={{ color: "var(--color-red-primary)" }}>Privacy Policy</a>.
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className={`auth-submit-btn btn-${roleData.id}`}
          style={{ marginTop: "16px" }}
        >
          {isLoading ? (
            "Signing up..."
          ) : (
            <>
              Sign Up <Icon icon="mdi:open-in-new" />
            </>
          )}
        </button>

        {error && <p className="auth-error-msg">{error}</p>}
      </form>
    </div>
  );
};

export default Signup;