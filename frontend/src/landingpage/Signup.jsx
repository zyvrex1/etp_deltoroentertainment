import { useState } from "react";
import { useSignup } from "../admincomponents/hooks/useSignup";

function Signup({ role, closeModal }) {
  const { signup, isLoading, error } = useSignup();

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

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Basic validation
  if (!form.email || !form.password || !form.confirmPassword) {
    alert("Email and passwords are required");
    return;
  }

  if (role === "sponsor" && (!form.firstName || !form.lastName || !form.phone || !form.companyName || !form.industry)) {
    alert("Please fill all sponsor fields");
    return;
  }

  if (role === "customer" && (!form.firstName || !form.lastName || !form.phone)) {
    alert("Please fill all customer fields");
    return;
  }

  await signup(form, role);
  closeModal();
};

  return (
    <form onSubmit={handleSubmit}>
      <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

      {role === "sponsor" && (
        <>
          <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} />
          <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
          <input name="companyName" placeholder="Company Name" value={form.companyName} onChange={handleChange} />
          <input name="industry" placeholder="Industry" value={form.industry} onChange={handleChange} />
        </>
      )}

      {role === "customer" && (
        <>
          <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} />
          <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
        </>
      )}

      <button disabled={isLoading}>
        {isLoading ? "Signing up..." : "Signup"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

export default Signup;