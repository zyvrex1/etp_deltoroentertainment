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
import SponsorLayout from "./layouts/sponsorlayout.jsx";


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

// Sponsor Pages

import SponsorHome from "./sponsorcomponents/SponsorHome.jsx";
import SponsorEvents from "./sponsorcomponents/SponsorBrowseEvents.jsx";
import SponsorEventDetails from './sponsorcomponents/SponsorEventDetails.jsx';
import SponsorVenueLayout from './sponsorcomponents/SponsorVenueLayout.jsx';
import SponsorConfirmSelection from './sponsorcomponents/SponsorConfirmSelection.jsx';
import SponsorReservationSummary from './sponsorcomponents/SponsorReservationSummary.jsx';
import SponsorVenueBilling from './sponsorcomponents/SponsorVenueBilling.jsx';
import SponsorMyBooth from './sponsorcomponents/SponsorMyBooth.jsx';
import SponsorBoothFullDetails from './sponsorcomponents/SponsorBoothFullDetails.jsx';
import SponsorEventHistory from './sponsorcomponents/SponsorEventHistory.jsx';
import SponsorInvoice from './sponsorcomponents/SponsorInvoice.jsx';
import SponsorSettings from './sponsorcomponents/SponsorSettings.jsx';
import SponsorSupport from './sponsorcomponents/SponsorSupport.jsx';

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

        <Route
          path="/sponsor"
          element={
            // <ProtectedRoute allowedRole="sponsor">
            <SponsorLayout />
            // </ProtectedRoute>
          }
        >
          <Route index element={<SponsorHome />} />
          <Route path="sponsor-events" element={<SponsorEvents />} />
          <Route path="/sponsor/sponsor-event/:id" element={<SponsorEventDetails />} />
          <Route path="/sponsor/sponsor-venue-layout" element={<SponsorVenueLayout />} />
          <Route path="/sponsor/sponsor-confirm-selection" element={<SponsorConfirmSelection />} />
          <Route path="/sponsor/sponsor-reservation" element={<SponsorReservationSummary />} />
          <Route path="/sponsor/sponsor-venue-billing" element={<SponsorVenueBilling />} />
          <Route path="/sponsor/sponsor-my-booths" element={<SponsorMyBooth />} />
          <Route path="/sponsor/sponsor-booth-details" element={<SponsorBoothFullDetails />} />
          <Route path="/sponsor/sponsor-history" element={<SponsorEventHistory />} />
          <Route path="/sponsor/sponsor-invoices" element={<SponsorInvoice />} />
          <Route path="/sponsor/settings" element={<SponsorSettings />} />
          <Route path="/sponsor/support" element={<SponsorSupport />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;