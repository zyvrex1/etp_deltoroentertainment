import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthContext } from "./hooks/useAuthContext.jsx";
import { useState, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import "./App.css";

// Layouts
const LandingLayout = lazy(() => import("./layouts/landinglayout.jsx"));
const AdminLayout = lazy(() => import("./layouts/adminlayout.jsx"));
const PromoterLayout = lazy(() => import("./layouts/promoterlayout.jsx"));
const SponsorLayout = lazy(() => import("./layouts/sponsorlayout.jsx"));
const CustomerLayout = lazy(() => import("./layouts/customerlayout.jsx"));

// Landing Pages
const Home = lazy(() => import("./landingpage/Home.jsx"));
const Login = lazy(() => import("./landingpage/Login.jsx"));

// Admin Pages
const AdminDashboard = lazy(() => import("./admincomponents/dashboard.jsx"));
const AdminUserManagement = lazy(() => import("./admincomponents/usermanagement.jsx"));
const AdminEventManagement = lazy(() => import("./admincomponents/eventmanagement.jsx"));
const AdminTransaction = lazy(() => import("./admincomponents/transaction.jsx"));
const AdminPayments = lazy(() => import("./admincomponents/payments.jsx"));
const AdminBoothandTicket = lazy(() => import("./admincomponents/boothandticket.jsx"));
const AdminReportsandAnalytics = lazy(() => import("./admincomponents/reportsandanalytics.jsx"));
const AdminContent = lazy(() => import("./admincomponents/content.jsx"));
const AdminSettings = lazy(() => import("./admincomponents/settings.jsx"));
const AdminSupport = lazy(() => import("./admincomponents/support.jsx"));
const AdminAuditLogs = lazy(() => import("./admincomponents/audit.jsx"));
const AdminEventApproval = lazy(() => import("./admincomponents/eventapproval.jsx"));
const AdminDigitalGifts = lazy(() => import("./admincomponents/digitalgifts.jsx"));

// Promoter Pages
const PromoterDashboard = lazy(() => import("./promotercomponents/promoterdashboard.jsx"));
const PromoterSettings = lazy(() => import("./promotercomponents/promotersettings.jsx"));
const PromoterEvents = lazy(() => import("./promotercomponents/promoterevents.jsx"));
const PromoterEventManagement = lazy(() => import("./promotercomponents/promotereventmanagement.jsx"));
const PromoterAnnouncement = lazy(() => import("./promotercomponents/promoterannouncement.jsx"));
const PromoterEventMonitoring = lazy(() => import("./promotercomponents/PromoterEventMonitoring.jsx"));
const PromoterRevenue = lazy(() => import("./promotercomponents/promoterrevenuereports.jsx"));
const PromoterPayouts = lazy(() => import("./promotercomponents/promoterpayouts.jsx"));
const PromoterPayoutBilling = lazy(() => import("./promotercomponents/PromoterPayoutBilling.jsx"));
const PromoterSupport = lazy(() => import("./promotercomponents/PromoterSupport.jsx"));

// Sponsor Pages
const SponsorHome = lazy(() => import("./sponsorcomponents/SponsorHome.jsx"));
const SponsorEvents = lazy(() => import("./sponsorcomponents/SponsorBrowseEvents.jsx"));
const SponsorEventDetails = lazy(() => import("./sponsorcomponents/SponsorEventDetails.jsx"));
const SponsorVenueLayout = lazy(() => import("./sponsorcomponents/SponsorVenueLayout.jsx"));
const SponsorConfirmSelection = lazy(() => import("./sponsorcomponents/SponsorConfirmSelection.jsx"));
const SponsorReservationSummary = lazy(() => import("./sponsorcomponents/SponsorReservationSummary.jsx"));
const SponsorVenueBilling = lazy(() => import("./sponsorcomponents/SponsorVenueBilling.jsx"));
const SponsorMyBooth = lazy(() => import("./sponsorcomponents/SponsorMyBooth.jsx"));
const SponsorBoothFullDetails = lazy(() => import("./sponsorcomponents/SponsorBoothFullDetails.jsx"));
const SponsorEventHistory = lazy(() => import("./sponsorcomponents/SponsorEventHistory.jsx"));
const SponsorInvoice = lazy(() => import("./sponsorcomponents/SponsorInvoice.jsx"));
const SponsorSettings = lazy(() => import("./sponsorcomponents/SponsorSettings.jsx"));
const SponsorSupport = lazy(() => import("./sponsorcomponents/SponsorSupport.jsx"));
const SponsorStore = lazy(() => import("./sponsorcomponents/SponsorStore.jsx"));
const SponsorStoreDashboard = lazy(() => import("./sponsorcomponents/SponsorStoreDashboard.jsx"));
const SponsorCart = lazy(() => import("./sponsorcomponents/SponsorCart.jsx"));
const SponsorGifts = lazy(() => import("./sponsorcomponents/SponsorGifts.jsx"));

// Customer Pages
const CustomerHome = lazy(() => import("./customercomponents/CustomerHome.jsx"));
const CustomerBrowseEvent = lazy(() => import("./customercomponents/CustomerBrowseEvent.jsx"));
const CustomerEventDetails = lazy(() => import("./customercomponents/CustomerEventDetails.jsx"));
const CustomerTicketOrder = lazy(() => import("./customercomponents/CustomerTicketOrder.jsx"));
const CustomerCart = lazy(() => import("./customercomponents/CustomerCart.jsx"));
const CustomerSupport = lazy(() => import("./customercomponents/CustomerSupport.jsx"));
const CustomerSettings = lazy(() => import("./customercomponents/CustomerSettings.jsx"));
const CustomerHistory = lazy(() => import("./customercomponents/CustomerPurchaseHistory.jsx"));
const CustomerSeats = lazy(() => import("./customercomponents/CustomerSeats.jsx"));
const CustomerCheckout = lazy(() => import("./customercomponents/CustomerCheckout.jsx"));
const CustomerPaySuccess = lazy(() => import("./customercomponents/CustomerPaySuccess.jsx"));
const CustomerStore = lazy(() => import("./customercomponents/CustomerStore.jsx"));
const CustomerStoreBooths = lazy(() => import("./customercomponents/CustomerStoreBooths.jsx"));
const CustomerStoreProducts = lazy(() => import("./customercomponents/CustomerStoreProducts.jsx"));
const CustomerStoreCheckout = lazy(() => import("./customercomponents/CustomerStoreCheckout.jsx"));
const CustomerOrders = lazy(() => import("./customercomponents/CustomerOrders.jsx"));
const CustomerGifts = lazy(() => import("./customercomponents/CustomerGifts.jsx"));

// Loading Component
const PageLoader = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(5, 36, 107, 0.11)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: 'white',
    flexDirection: 'column',
    gap: '24px',
    zIndex: 9999
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'pulse 2s infinite ease-in-out'
    }}>
      <img
        src="/logo/Logo1.png"
        alt="Logo"
        className="loader-logo"
        style={{
          height: 'auto',
          marginBottom: '16px'
        }}
      />
      <div className="loader-dots" style={{ display: 'flex', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
        <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both 0.2s' }}></div>
        <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both 0.4s' }}></div>
      </div>
    </div>
    <style>{`
      .loader-logo {
        width: 500px;
      }
      @media (max-width: 1024px) {
        .loader-logo { width: 400px; }
      }
      @media (max-width: 768px) {
        .loader-logo { width: 300px; }
      }
      @media (max-width: 480px) {
        .loader-logo { width: 200px; }
      }
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.05); opacity: 1; }
        100% { transform: scale(1); opacity: 0.8; }
      }
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1.0); }
      }
    `}</style>
  </div>
);

function App() {
  return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<LandingLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
            </Route>

            <Route path="/admin" element={
              <ProtectedRoute allowedRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="event-approval" element={<AdminEventApproval />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route path="events" element={<AdminEventManagement />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="booths-tickets" element={<AdminBoothandTicket />} />
              <Route path="analytics" element={<AdminReportsandAnalytics />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="digital-gifts" element={<AdminDigitalGifts />} />
            </Route>

            <Route path="/promoter" element={
              <ProtectedRoute allowedRole="promoter">
                <PromoterLayout />
              </ProtectedRoute>
            }>
              <Route index element={<PromoterDashboard />} />
              <Route path="settings" element={<PromoterSettings />} />
              <Route path="promoter-events" element={<PromoterEvents />} />
              <Route path="promoter-eventmanagement" element={<PromoterEventManagement />} />
              <Route path="promoter-announcement" element={<PromoterAnnouncement />} />
              <Route path="promoter-eventmonitoring" element={<PromoterEventMonitoring />} />
              <Route path="promoter-revenue" element={<PromoterRevenue />} />
              <Route path="promoter-payouts" element={<PromoterPayouts />} />
              <Route path="promoter-payout-billing" element={<PromoterPayoutBilling />} />
              <Route path="support" element={<PromoterSupport />} />
            </Route>

            <Route path="/sponsor" element={
              <ProtectedRoute allowedRole="sponsor">
                <SponsorLayout />
              </ProtectedRoute>
            }>
              <Route index element={<SponsorHome />} />
              <Route path="sponsor-events" element={<SponsorEvents />} />
              <Route path="sponsor-event/:id" element={<SponsorEventDetails />} />
              <Route path="sponsor-venue-layout/:id?" element={<SponsorVenueLayout />} />
              <Route path="sponsor-confirm-selection" element={<SponsorConfirmSelection />} />
              <Route path="sponsor-reservation" element={<SponsorReservationSummary />} />
              <Route path="sponsor-venue-billing" element={<SponsorVenueBilling />} />
              <Route path="sponsor-my-booths" element={<SponsorMyBooth />} />
              <Route path="sponsor-booth-details/:id" element={<SponsorBoothFullDetails />} />
              <Route path="sponsor-history" element={<SponsorEventHistory />} />
              <Route path="sponsor-invoices" element={<SponsorInvoice />} />
              <Route path="settings" element={<SponsorSettings />} />
              <Route path="support" element={<SponsorSupport />} />
              <Route path="store" element={<SponsorStore />} />
              <Route path="store/dashboard/:reservationId?" element={<SponsorStoreDashboard />} />
              <Route path="cart" element={<SponsorCart />} />
              <Route path="my-gifts" element={<SponsorGifts />} />
            </Route>

            <Route path="/customer" element={
              <ProtectedRoute allowedRole="customer">
                <CustomerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<CustomerHome />} />
              <Route path="browse-events" element={<CustomerBrowseEvent />} />
              <Route path="event-details/:id" element={<CustomerEventDetails />} />
              <Route path="seats/:id" element={<CustomerSeats />} />
              <Route path="cart" element={<CustomerCart />} />
              <Route path="checkout" element={<CustomerCheckout />} />
              <Route path="success" element={<CustomerPaySuccess />} />
              <Route path="my-ticketsorder" element={<CustomerTicketOrder />} />
              <Route path="support" element={<CustomerSupport />} />
              <Route path="settings" element={<CustomerSettings />} />
              <Route path="history" element={<CustomerHistory />} />
              <Route path="store" element={<CustomerStore />} />
              <Route path="store/booths" element={<CustomerStoreBooths />} />
              <Route path="store/products" element={<CustomerStoreProducts />} />
              <Route path="store/checkout" element={<CustomerStoreCheckout />} />
              <Route path="my-orders" element={<CustomerOrders />} />
              <Route path="my-gifts" element={<CustomerGifts />} />  {/* ← add this */}
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
  );
}

export default App;