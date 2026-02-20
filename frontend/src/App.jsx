import { BrowserRouter , Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home.jsx";
import Navbar from "./pages/Navbar.jsx"
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

import Sidebar from "./admincomponents/sidebar.jsx";
import Header from "./admincomponents/header.jsx";
import Dashboard from "./admincomponents/dashboard.jsx";
import UserManagement from "./admincomponents/usermanagement.jsx";
import EventManagement from "./admincomponents/eventmanagement.jsx";
import Transaction from "./admincomponents/transaction.jsx";
import Payments from "./admincomponents/payments.jsx";
import BoothandTicket from "./admincomponents/boothandticket.jsx";
import ReportsandAnalytics from "./admincomponents/reportsandanalytics.jsx";
import Content from "./admincomponents/content.jsx";
import Settings from "./admincomponents/settings.jsx";
import Support from "./admincomponents/support.jsx";
import AuditLogs from "./admincomponents/audit.jsx";
import EventApproval from "./admincomponents/eventapproval.jsx";




function App() {
  // User data - replace with actual login data when authentication is implemented
  const currentUser = {
    name: "Alex Thompson",
    email: "alex@ticketspro.com",
    role: "Super Admin",
  };

  return (
      <div>
        <BrowserRouter>
          <Navbar/>
          <div className="pages">
            <Routes>
              <Route path="/" element={<Home />}/>
              <Route path="/login" element={<Login />}/>
              <Route path="/signup" element={<Signup />}/>
              <Route path="/admindashboard" element={<Dashboard />} />
              <Route path="/event-approval" element={<EventApproval />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/events" element={<EventManagement />} />
              <Route path="/transactions" element={<Transaction />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/booths-tickets" element={<BoothandTicket />} />
              <Route path="/analytics" element={<ReportsandAnalytics />} />
              <Route path="/content" element={<Content />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/support" element={<Support />} />
              <Route path="/audit-logs" element={<AuditLogs />} />

            </Routes>
          </div>
        </BrowserRouter>
      </div>
    
  );
}

export default App;
