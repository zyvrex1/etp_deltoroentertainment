import { Outlet } from "react-router-dom";
import SponsorHeader from "../sponsorcomponents/SponsorHeader.jsx";

export default function SponsorLayout() {
  const currentUser = {
    name: "Maria Santos",
    email: "maria@sponsorpro.com",
    role: "Sponsor",
  };

  return (
    <div className="sponsor-app-container">
      {/* Top Navigation */}
      <SponsorHeader user={currentUser} />

      {/* Main Page Content */}
      <main className="sponsor-main-content">
        <div className="sponsor-content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}