import { NavLink } from "react-router-dom";

export default function PromoterSidebar() {
  return (
    <div style={{
      width: "220px",
      height: "100vh",
      background: "#1e1e2f",
      color: "white",
      padding: "20px"
    }}>
      <h2>Promoter Panel</h2>

      <nav style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <NavLink to="/promoter" style={{ color: "white", textDecoration: "none" }}>
          Dashboard
        </NavLink>

        <NavLink to="/promoter/events" style={{ color: "white", textDecoration: "none" }}>
          My Events
        </NavLink>

        <NavLink to="/promoter/tickets" style={{ color: "white", textDecoration: "none" }}>
          Tickets
        </NavLink>

        <NavLink to="/promoter/reports" style={{ color: "white", textDecoration: "none" }}>
          Reports
        </NavLink>
      </nav>
    </div>
  );
}