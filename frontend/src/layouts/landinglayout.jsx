import { Outlet } from "react-router-dom";
import { useState } from "react";
import Navbar from "../landingpage/Navbar.jsx";
import SignupModal from "../admincomponents/modal/SignupModal.jsx";
import LoginModal from "../admincomponents/modal/LoginModal.jsx";

export default function LandingLayout() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <>
      <Navbar 
        openSignup={() => setIsSignupOpen(true)}
        openLogin={() => setIsLoginOpen(true)}
      />

      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <Outlet />
    </>
  );
}