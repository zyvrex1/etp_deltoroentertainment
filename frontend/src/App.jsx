import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";



import Sidebar from "./admincomponents/sidebar.jsx";
import Header from "./admincomponents/header.jsx";
import Dashboard from "./admincomponents/dashboard.jsx";
import UserManagement from "./admincomponents/usermanagement.jsx";
import EventManagement from "./admincomponents/eventmanagement.jsx";
import Transaction from "./admincomponents/transaction.jsx";
import Payments from "./admincomponents/payments.jsx";
import BoothandTicket from "./admincomponents/boothandticket.jsx";
import ReportsandAnalytics from "./admincomponents/reportsandanalytics.jsx";

function App() {
  // User data - replace with actual login data when authentication is implemented
  const currentUser = {
    name: "Alex Thompson",
    email: "alex@ticketspro.com",
    role: "Super Admin",
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar />

        <main className="main-content">
          <Header user={currentUser} />
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/events" element={<EventManagement />} />
              <Route path="/transactions" element={<Transaction />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/booths-tickets" element={<BoothandTicket />} />
              <Route path="/analytics" element={<ReportsandAnalytics />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
