import { Outlet } from "react-router-dom";
import { useState } from "react";
import Navbar from "../landingpage/Navbar.jsx";
import AuthModal from "../landingpage/AuthModal.jsx";

export default function LandingLayout() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");

  const openAuthModal = (tab) => {
    setAuthTab(tab);
    setIsAuthOpen(true);
  };

  return (
    <>
      <Navbar
        openSignup={() => openAuthModal("signup")}
        openLogin={() => openAuthModal("login")}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab={authTab}
      />

      <Outlet />
    </>
  );
}