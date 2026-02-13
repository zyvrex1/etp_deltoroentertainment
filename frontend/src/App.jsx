import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import Sidebar from "./components/sidebar.jsx";
import Header from "./components/header.jsx";
import Dashboard from "./components/dashboard.jsx";
import UserManagement from "./components/usermanagement.jsx";
import EventManagement from "./components/eventmanagement.jsx";
import Transaction from "./components/transaction.jsx";
import Payments from "./components/payments.jsx";
import BoothandTicket from "./components/boothandticket.jsx";


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
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
