import { Outlet } from "react-router-dom";
import Sidebar from "../admincomponents/sidebar.jsx";
import Header from "../admincomponents/header.jsx";

export default function AdminLayout() {
  const currentUser = {
    name: "Alex Thompson",
    email: "alex@ticketspro.com",
    role: "Super Admin",
  };

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <Header user={currentUser} />
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}