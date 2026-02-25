import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthContext } from "./admincomponents/hooks/useAuthContext.jsx";
import { useState } from "react";
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
import PromoterEvents from "./promotercomponents/promoterevents.jsx";
import PromoterTicketSetup from "./promotercomponents/promoterticketsetup.jsx";
import PromoterBoothLayout from "./promotercomponents/promoterboothlayout.jsx";
import PromoterScan from "./promotercomponents/promoterscan.jsx";
import PromoterSales from "./promotercomponents/promotersales.jsx";
import PromoterAttendees from "./promotercomponents/promoterattendees.jsx";
import PromoterSponsors from "./promotercomponents/promotersponsors.jsx";
import PromoterRevenue from "./promotercomponents/promoterrevenuereports.jsx";
import PromoterPayouts from "./promotercomponents/promoterpayouts.jsx";


function App() {
  return (
    <BrowserRouter>
      <Routes>
       <Route element={<LandingLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Route>

        
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
          <Route path="promoter-events" element={<PromoterEvents />} />
          <Route path="promoter-ticketsetup" element={<PromoterTicketSetup />} />
          <Route path="promoter-boothlayout" element={<PromoterBoothLayout />} />
          <Route path="promoter-scan" element={<PromoterScan />} />
          <Route path="promoter-sales" element={<PromoterSales />} />
          <Route path="promoter-attendees" element={<PromoterAttendees />} />
          <Route path="promoter-sponsors" element={<PromoterSponsors />} />
          <Route path="promoter-revenue" element={<PromoterRevenue />} />
          <Route path="promoter-payouts" element={<PromoterPayouts />} />



        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;