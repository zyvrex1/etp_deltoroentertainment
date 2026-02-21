import { useState } from "react";
import { useSignup } from "../admincomponents/hooks/useSignup";

const Signup = ({ role, closeModal }) => {
  const { signup, error, isLoading } = useSignup();

  // Dynamic form state for all possible fields
  const [formData, setFormData] = useState({
    profilePicture: null,
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    industry: "",
    phone: "",
    bankAccount: "",
    temporaryPassword: "",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signup(formData, role);
    if (closeModal) closeModal();
  };

  // Define which fields each role needs
  const roleFields = {
    admin: ["profilePicture", "email"],
    sponsor: [
      "profilePicture",
      "fullName",
      "email",
      "companyName",
      "industry",
      "phone",
    ],
    customer: ["profilePicture", "fullName", "email", "phone"],
    promoter: ["profilePicture", "fullName", "email", "bankAccount", "phone"],
  };

  return (
    <form className="signup" onSubmit={handleSubmit}>
      <h3>{role ? role.toUpperCase() : "Signup"}</h3>

      {roleFields[role]?.map((field) => {
        if (field === "profilePicture") {
          return (
            <div key={field}>
              <label>Profile Picture:</label>
              <input type="file" name={field} onChange={handleChange} />
            </div>
          );
        }

        const labels = {
          fullName: "Full Name",
          email: "Email",
          password: "Password",
          companyName: "Company Name",
          industry: "Industry",
          phone: "Phone",
          bankAccount: "Bank Account",
        };

        return (
          <div key={field}>
            <label>{labels[field]}:</label>
            <input
              type={
                field.toLowerCase().includes("password") ? "password" : "text"
              }
              name={field}
              value={formData[field]}
              onChange={handleChange}
            />
          </div>
        );
      })}

      <p className="info">
        A temporary password will be sent to the email you provide.
      </p>

      <button disabled={isLoading}>
        {isLoading ? "Signing up..." : "Sign Up"}
      </button>

      {error && <div className="error">{error}</div>}
    </form>
  );
};

export default Signup;
