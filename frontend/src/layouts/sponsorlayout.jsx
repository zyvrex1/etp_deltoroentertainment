import { Outlet } from "react-router-dom";
import SponsorHeader from "../sponsorcomponents/SponsorHeader.jsx";
import SponsorFooter from "../sponsorcomponents/SponsorFooter.jsx";
import { SponsorCartProvider } from "../context/SponsorCartContext.jsx";

export default function SponsorLayout() {
  const currentUser = {
    name: "Maria Santos",
    email: "maria@sponsorpro.com",
    role: "Sponsor",
  };

  return (
    <SponsorCartProvider>
      <div className="sponsor-app-container">
        {/* Global Header */}
      <SponsorHeader user={currentUser} />

      {/* Page Content */}
      <main className="sponsor-main-content">
        <div className="sponsor-content-wrapper">
          <Outlet />
        </div>
      </main>

      {/* Global Footer */}
      <SponsorFooter />
      </div>
    </SponsorCartProvider>
  );
}