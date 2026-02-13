import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./routes/AdminRoute.jsx"; // Add this import

// Pages
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import TransactionsPage from "./pages/Transactions.jsx";
import CreateLinkPage from "./pages/CreatePaymentLink.jsx";
import PaymentLinksPage from "./pages/PaymentLinks.jsx";
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

// Admin Pages - Add these imports
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminMerchants from "./pages/admin/AdminMerchants.jsx";

// CONTEXTS
import { GatewayProvider } from "./context/GatewayContext.jsx";
import { UserProvider } from "./context/userContext.jsx";

export default function App() {
  return (
    <Routes>
      {/* ===== PUBLIC ROUTES ===== */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pay/:linkId" element={<PayPage />} />

      <Route path="/public-success" element={<PublicSuccess />} />
      <Route path="/public-failed" element={<PublicFailed />} />
      <Route path="/public-cancel" element={<PublicCancel />} />

      <Route path="/success" element={<Success />} />
      <Route path="/failed" element={<Failed />} />
      <Route path="/cancel" element={<Cancel />} />

      {/* ===== PROTECTED DASHBOARD ===== */}
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
        <Route index element={<DashboardHome />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="create-link" element={<CreateLinkPage />} />
        <Route path="payment-links" element={<PaymentLinksPage />} />{" "}
        <Route path="settings/payments" element={<PaymentGatewaysPage />} />
        <Route path="connect-chapa" element={<ConnectChapaPage />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* ===== ADMIN ROUTES ===== */}
      {/* ===== ADMIN ROUTES ===== */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/merchants" element={<AdminMerchants />} />
      </Route>
    </Routes>
  );
}
