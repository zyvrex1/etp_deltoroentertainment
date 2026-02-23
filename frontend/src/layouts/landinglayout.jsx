import { Outlet } from "react-router-dom";
import Navbar from "../landingpage/Navbar.jsx";

export default function LandingLayout({ openSignup, openLogin }) {
  return (
    <>
      <Navbar 
        openSignup={openSignup}
        openLogin={openLogin}
      />
      <Outlet />
    </>
  );
}