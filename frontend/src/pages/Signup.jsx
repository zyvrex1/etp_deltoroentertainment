import { useState } from "react";
import { useSignup } from "../admincomponents/hooks/useSignup";

function Signup({ role, closeModal }) {
  const { signup, isLoading, error } = useSignup();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    bankAcc: "",
    companyName: "",
    industry: "",
    profilePicture: ""
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

  if (role === "promoter" && (!form.fullName || !form.phone || !form.bankAcc)) {
    alert("Please fill all promoter fields");
    return;
  }

  if (role === "sponsor" && (!form.fullName || !form.phone || !form.companyName || !form.industry)) {
    alert("Please fill all sponsor fields");
    return;
  }

  if (role === "customer" && (!form.fullName || !form.phone)) {
    alert("Please fill all customer fields");
    return;
  }

  await signup(form, role);
  closeModal();
};

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" placeholder="Email" onChange={handleChange} required/>
      <input type="password" name="password" placeholder="Password" onChange={handleChange} required/>
      <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required/>

      {role === "promoter" && (
        <>
          <input name="fullName" placeholder="Full Name" onChange={handleChange} />
          <input name="phone" placeholder="Phone" onChange={handleChange} />
          <input name="bankAcc" placeholder="Bank Account" onChange={handleChange} />
        </>
      )}

      {role === "sponsor" && (
        <>
          <input name="fullName" placeholder="Full Name" onChange={handleChange} />
          <input name="phone" placeholder="Phone" onChange={handleChange} />
          <input name="companyName" placeholder="Company Name" onChange={handleChange} />
          <input name="industry" placeholder="Industry" onChange={handleChange} />
        </>
      )}

      {role === "customer" && (
        <>
          <input name="fullName" placeholder="Full Name" onChange={handleChange} />
          <input name="phone" placeholder="Phone" onChange={handleChange} />
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