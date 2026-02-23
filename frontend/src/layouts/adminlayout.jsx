import { Outlet } from "react-router-dom";
import Sidebar from "../admincomponents/sidebar.jsx";
import Header from "../admincomponents/header.jsx";

export default function AdminLayout() {
  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <Header />
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}