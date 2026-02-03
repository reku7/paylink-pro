import { Navigate, Outlet } from "react-router-dom";
import { getUserRole, getAuthToken } from "../utils/auth";

export default function AdminRoute() {
  const token = getAuthToken();
  const role = getUserRole();

  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin
  if (role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  // Authorized
  return <Outlet />;
}
