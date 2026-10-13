import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center
        text-sm text-slate-500">
        Restoring your session...
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
