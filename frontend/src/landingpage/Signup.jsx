import { useState } from "react";
import { Icon } from "@iconify/react";
import { useSignup } from "../hooks/useSignup";
import policyService from "../services/policyService";
import AuthPolicyModal from "./AuthPolicyModal";

import { showSuccessAlert, showErrorAlert } from "../utils/sweetAlert";

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

const Signup = ({ role, onBack, onClose }) => {
  const { signup, isLoading, error: signupError } = useSignup();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [policyModal, setPolicyModal] = useState({ isOpen: false, item: null, type: "tos" });

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

  const openPolicy = async (policyKey) => {
    try {
      const data = await policyService.getPolicy(policyKey);
      if (data) {
        setPolicyModal({
          isOpen: true,
          item: {
            title: data.title,
            content: data.content,
            date: new Date(data.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          },
          type: policyKey,
        });
      }
    } catch (error) {
      console.error("Failed to fetch policy:", error);
      showErrorAlert("Error", "Failed to load policy. Please try again later.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptedTerms) {
      showErrorAlert("Error", "You must accept the Terms of Service and Privacy Policy to create an account.");
      return;
    }

    // Basic required validation
    const requiredFields =
      role === "sponsor"
        ? ["firstName", "lastName", "email", "phone", "companyName", "industry", "password", "confirmPassword"]
        : ["firstName", "lastName", "email", "phone", "password", "confirmPassword"];

    for (let field of requiredFields) {
      if (!form[field]) {
        showErrorAlert("Required Field", `Please fill in the ${field} field.`);
        return;
      }
    }

    if (form.password !== form.confirmPassword) {
      showErrorAlert("Error", "Passwords do not match");
      return;
    }

    const dataToSend = { ...form, role };

    // Call signup hook
    const result = await signup(dataToSend, role);

    if (result.success) {
      // Close the modal first
      if (onClose) onClose();

      // Show success alert
      await showSuccessAlert(
        "Account Created",
        `Welcome to eTicketsPro, ${form.firstName}! Your ${role} account has been created successfully.`
      );
    } else {
      showErrorAlert("Signup Failed", result.error || "An error occurred while creating your account.");
    }
  };

  const getPasswordCriteria = (password) => {
    return [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "One uppercase letter", met: /[A-Z]/.test(password) },
      { label: "One lowercase letter", met: /[a-z]/.test(password) },
      { label: "One number", met: /[0-9]/.test(password) },
      { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
    ];
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

          {/* Password Strength Indicators */}
          <div className="auth-password-criteria">
            {getPasswordCriteria(form.password).map((crit, idx) => (
              <div key={idx} className={`auth-criteria-item ${crit.met ? "met" : ""}`}>
                <Icon
                  icon={crit.met ? "mdi:check-circle" : "mdi:circle-outline"}
                  width="14"
                />
                <span>{crit.label}</span>
              </div>
            ))}
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

        {/* Terms Acceptance */}
        <div className="auth-terms-acceptance">
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="auth-checkbox"
            />
            <span className="smaller-body-text">
              I agree to the{" "}
              <button type="button" className="auth-link-btn" onClick={() => openPolicy("tos")}>
                Terms of Service
              </button>{" "}
              and{" "}
              <button type="button" className="auth-link-btn" onClick={() => openPolicy("privacy")}>
                Privacy Policy
              </button>
            </span>
          </label>
        </div>

        {/* Submit */}
        <button type="submit" disabled={isLoading} className={`auth-submit-btn btn-${roleData.id}`}>
          {isLoading ? "Signing up..." : <>Sign Up <Icon icon="mdi:open-in-new" /></>}
        </button>

        {signupError && <p className="auth-error-msg">{signupError}</p>}
      </form>

      {/* Policy Modal */}
      <AuthPolicyModal
        isOpen={policyModal.isOpen}
        onClose={() => setPolicyModal({ ...policyModal, isOpen: false })}
        item={policyModal.item}
        type={policyModal.type}
      />
    </div>
  );
};

export default Signup;