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
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    industry: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic required validation
    const requiredFields =
      role === "sponsor"
        ? ["firstName", "lastName", "email", "phone", "companyName", "industry", "password", "confirmPassword"]
        : ["firstName", "lastName", "email", "phone", "password", "confirmPassword"];

    for (let field of requiredFields) {
      if (!form[field]) {
        alert(`Please fill in the ${field} field.`);
        return;
      }
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Prepare payload without confirmPassword
    const { confirmPassword, ...dataToSend } = form;
    dataToSend.role = role; // ensure role is included

    // Call signup hook
    await signup(dataToSend, role);
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
        <div className={`auth-role-icon-box role-${roleData.id}`} style={{ marginBottom: 0 }}>
          <Icon icon={roleData.icon} className="auth-role-icon" />
        </div>
        <div className="role-banner-content">
          <h4>Sign up as {roleData.title}</h4>
          <p>{roleData.desc}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* First Name */}
        <div>
          <label className="small-body-text auth-form-label">First Name</label>
          <div className="auth-input-wrapper">
            <Icon icon="mdi:account-outline" className="auth-input-icon" />
            <input
              type="text"
              name="firstName"
              placeholder="Enter your first name"
              value={form.firstName}
              onChange={handleChange}
              className="auth-input"
            />
          </div>
        </div>

        {/* Last Name */}
        <div>
          <label className="small-body-text auth-form-label">Last Name</label>
          <div className="auth-input-wrapper">
            <Icon icon="mdi:account-outline" className="auth-input-icon" />
            <input
              type="text"
              name="lastName"
              placeholder="Enter your last name"
              value={form.lastName}
              onChange={handleChange}
              className="auth-input"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="auth-form-label">Email Address</label>
          <div className="auth-input-wrapper">
            <Icon icon="mdi:email-outline" className="auth-input-icon" />
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className="auth-input"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="auth-form-label">Phone Number</label>
          <div className="auth-input-wrapper">
            <Icon icon="mdi:phone-outline" className="auth-input-icon" />
            <input
              type="text"
              name="phone"
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={handleChange}
              className="auth-input"
            />
          </div>
        </div>

        {/* Sponsor-only fields */}
        {role === "sponsor" && (
          <>
            <div>
              <label className="auth-form-label">Company Name</label>
              <div className="auth-input-wrapper">
                <Icon icon="mdi:domain" className="auth-input-icon" />
                <input
                  type="text"
                  name="companyName"
                  placeholder="ACME Corp"
                  value={form.companyName}
                  onChange={handleChange}
                  className="auth-input"
                />
              </div>
            </div>

            <div>
              <label className="auth-form-label">Industry</label>
              <div className="auth-input-wrapper">
                <Icon icon="mdi:briefcase-outline" className="auth-input-icon" />
                <input
                  type="text"
                  name="industry"
                  placeholder="Technology"
                  value={form.industry}
                  onChange={handleChange}
                  className="auth-input"
                />
              </div>
            </div>
          </>
        )}

        {/* Password */}
        <div>
          <label className="auth-form-label">Password</label>
          <div className="auth-input-wrapper">
            <Icon icon="mdi:lock-outline" className="auth-input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Create a Strong Password"
              value={form.password}
              onChange={handleChange}
              className="auth-input"
            />
            <button type="button" className="auth-input-icon-right" onClick={() => setShowPassword(!showPassword)}>
              <Icon icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} />
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="auth-form-label">Confirm Password</label>
          <div className="auth-input-wrapper">
            <Icon icon="mdi:lock-outline" className="auth-input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="auth-input"
            />
            <button type="button" className="auth-input-icon-right" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Icon icon={showConfirmPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} />
            </button>
          </div>
        </div>

        {/* Terms */}
        <p style={{ fontSize: "12px", color: "#ccc" }}>
          By creating an account, you agree to our <a href="#" style={{ color: "#f00" }}>Terms of Service</a> and <a href="#" style={{ color: "#f00" }}>Privacy Policy</a>.
        </p>

        {/* Submit */}
        <button type="submit" disabled={isLoading} className={`auth-submit-btn btn-${roleData.id}`}>
          {isLoading ? "Signing up..." : <>Sign Up <Icon icon="mdi:open-in-new" /></>}
        </button>

        {error && <p className="auth-error-msg">{error}</p>}
      </form>
    </div>
  );
};

export default Signup;