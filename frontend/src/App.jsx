import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./landingpage/Home.jsx";
import Login from "./landingpage/Login.jsx";

import SignupModal from "./admincomponents/modal/SignupModal.jsx";
import LoginModal from "./admincomponents/modal/LoginModal.jsx";

// Layouts
import LandingLayout from "./layouts/landinglayout.jsx";
import AdminLayout from "./layouts/adminlayout.jsx";
import PromoterLayout from "./layouts/promoterlayout.jsx";

// Admin Pages
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
import PromoterDashboard from "./promotercomponents/promoterdashboard.jsx";
import PromoterSettings from "./promotercomponents/promotersettings.jsx";

function App() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <BrowserRouter>

      {/* GLOBAL MODALS */}
      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <Routes>

        {/* LANDING ROUTES */}
        <Route
          element={
            <LandingLayout
              openSignup={() => setIsSignupOpen(true)}
              openLogin={() => setIsLoginOpen(true)}
            />
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* ADMIN ROUTES (PROTECTED) */}
        <Route
          path="/admin"
          element={
          //   <ProtectedRoute allowedRole="admin">
              <AdminLayout />
          //   </ProtectedRoute>
          }
        >
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

        {/* PROMOTER ROUTES (PROTECTED) */}
        <Route
          path="/promoter"
          element={
          //   <ProtectedRoute allowedRole="promoter">
              <PromoterLayout />
          //   </ProtectedRoute>
          }
        >
          <Route index element={<PromoterDashboard />} />
          <Route path="settings" element={<PromoterSettings />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;