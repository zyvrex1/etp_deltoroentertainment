

import { useState } from "react";
import { Outlet } from "react-router-dom";
import PromoterSidebar from "../promotercomponents/promotersidebar.jsx";
import PromoterHeader from "../promotercomponents/promoterheader.jsx";

export default function AdminLayout() {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  return (
    <div className="app-container">
      <PromoterSidebar 
        mobileExpanded={mobileExpanded} 
        setMobileExpanded={setMobileExpanded} 
      />

      <main className="main-content">
        <PromoterHeader 
          mobileExpanded={mobileExpanded} 
          setMobileExpanded={setMobileExpanded} 
        />
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}