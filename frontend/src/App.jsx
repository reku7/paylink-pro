// App.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";
import "./responsive.css";

// Pages
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import TransactionsPage from "./pages/Transactions.jsx";
import CreateLinkPage from "./pages/CreatePaymentLink.jsx";
import PaymentLinksPage from "./pages/PaymentLinks.jsx"; // ✅ Add this
import PayPage from "./pages/PayPage.jsx";
import Success from "./pages/success.jsx";
import Failed from "./pages/failed.jsx";
import Cancel from "./pages/cancel.jsx";
import PublicSuccess from "./pages/PublicSuccess.jsx";
import PublicFailed from "./pages/PublicFailed.jsx";
import PublicCancel from "./pages/PublicCancel.jsx";
import ConnectChapaPage from "./pages/ConnectChapaPage.jsx";
import PaymentGatewaysPage from "./pages/PaymentGatewaysPage.jsx";
import Profile from "./pages/profile/Profile.jsx";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminMerchants from "./pages/admin/AdminMerchants.jsx";

// Contexts
import { GatewayProvider } from "./context/GatewayContext.jsx";
import { UserProvider } from "./context/userContext.jsx";

export default function App() {
  return (
    <Routes>
      {/* ===== PUBLIC ROUTES ===== */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public payment pages for customers */}
      <Route path="/pay/:linkId" element={<PayPage />} />
      <Route path="/public-success" element={<PublicSuccess />} />
      <Route path="/public-failed" element={<PublicFailed />} />
      <Route path="/public-cancel" element={<PublicCancel />} />

      {/* ===== DASHBOARD / PROTECTED ROUTES ===== */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserProvider>
              <GatewayProvider>
                <Dashboard />
              </GatewayProvider>
            </UserProvider>
          </ProtectedRoute>
        }
      >
        {/* Default dashboard home */}
        <Route index element={<DashboardHome />} />
        {/* Merchant dashboard pages */}
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="create-link" element={<CreateLinkPage />} />
        <Route path="payment-links" element={<PaymentLinksPage />} />{" "}
        {/* ✅ Add this */}
        <Route path="settings/payments" element={<PaymentGatewaysPage />} />
        <Route path="connect-chapa" element={<ConnectChapaPage />} />
        <Route path="profile" element={<Profile />} />
        {/* Dashboard-specific payment result pages */}
        <Route path="success" element={<Success isPublic={false} />} />
        <Route path="failed" element={<Failed isPublic={false} />} />
        <Route path="cancel" element={<Cancel isPublic={false} />} />
      </Route>

      {/* ===== ADMIN ROUTES ===== */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/merchants" element={<AdminMerchants />} />
      </Route>
    </Routes>
  );
}
