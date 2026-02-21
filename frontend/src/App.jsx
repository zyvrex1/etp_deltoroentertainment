import { useState } from "react";
import { BrowserRouter , Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home.jsx";
import Navbar from "./pages/Navbar.jsx"
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import SignupModal from "./admincomponents/modal/SignupModal.jsx";
import LoginModal from "./admincomponents/modal/LoginModal.jsx";

// Layouts
import AdminLayout from "./layouts/adminlayout.jsx";
import PromoterLayout from "./layouts/promoterlayout.jsx";

// Admin Pages
import AdminSidebar from "./admincomponents/sidebar.jsx";
import AdminHeader from "./admincomponents/header.jsx";
import AdminDashboard from "./admincomponents/dashboard.jsx";
import AdminUserManagement from "./admincomponents/usermanagement.jsx";
import AdminEventManagement from "./admincomponents/eventmanagement.jsx";
import AdminTransaction from "./admincomponents/transaction.jsx";
import AdminPayments from "./admincomponents/payments.jsx";
import AdminBoothandTicket from "./admincomponents/boothandticket.jsx";
import AdminReportsandAnalytics from "./admincomponents/reportsandanalytics.jsx";
import AdminContent from "./admincomponents/content.jsx";
import AdminSettings from "./admincomponents/settings.jsx";
import AdminSupport from "./admincomponents/support.jsx";
import AdminAuditLogs from "./admincomponents/audit.jsx";
import AdminEventApproval from "./admincomponents/eventapproval.jsx";

// Promoter Pages
import PromoterDashboard from "./promotercomponents/dashboard.jsx";


function App() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <BrowserRouter>

      {/* Pass function to Navbar */}
      <Navbar 
        openSignup={() => setIsSignupOpen(true)}
        openLogin={() => setIsLoginOpen(true)}
      />

      {/* Modal OUTSIDE Routes */}
      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <div className="pages">
        <Routes>

          {/* HOME ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* ADMIN ROUTES */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="event-approval" element={<AdminEventApproval />} />
            <Route path="users" element={<AdminUserManagement />} />
            <Route path="events" element={<AdminEventManagement />} />
            <Route path="transactions" element={<AdminTransaction />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="booths-tickets" element={<AdminBoothandTicket />} />
            <Route path="analytics" element={<AdminReportsandAnalytics />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
          </Route>

          {/* PROMOTER ROUTES */}
          <Route path="/promoter" element={<PromoterLayout />}>
            <Route index element={<PromoterDashboard />} />
          </Route>

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
