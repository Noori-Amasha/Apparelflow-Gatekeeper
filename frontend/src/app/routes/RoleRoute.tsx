import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { roleHome } from "../config/navigation";
import type { Role } from "../../types/auth";

export default function RoleRoute({ allowed }: { allowed: Role[] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return allowed.includes(user.role)
    ? <Outlet />
    : <Navigate to={roleHome[user.role]} replace />;
}
