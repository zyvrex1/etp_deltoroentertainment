import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../admincomponents/sidebar.jsx";
import Header from "../admincomponents/header.jsx";

export default function AdminLayout() {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  return (
    <div className="app-container">
      <Sidebar 
        mobileExpanded={mobileExpanded} 
        setMobileExpanded={setMobileExpanded} 
      />

      <main className="main-content">
        <Header 
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