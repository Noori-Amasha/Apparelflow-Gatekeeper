import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { roleHome } from "../config/navigation";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AppLayout from "../../layouts/AppLayout";

import LoginPage from "../../features/auth/pages/LoginPage";
import CuttingOrdersPage from "../../features/cutting/pages/CuttingOrdersPage";
import VerificationPage from "../../features/verification/pages/VerificationPage";
import SewingPage from "../../features/sewing/pages/SewingPage";
import NotFoundPage from "../../pages/NotFoundPage";

function HomeRedirect() {
  const { user } = useAuth();
  return (
    <Navigate to={user ? roleHome[user.role] : "/login"} replace />
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <HomeRedirect /> },
          { path: "/dashboard", element: <HomeRedirect /> },
          {
            element: <RoleRoute allowed={["cutting_supervisor"]} />,
            children: [
              {
                path: "/cutting/orders",
                element: <CuttingOrdersPage />,
              },
            ],
          },
          {
            element: <RoleRoute allowed={["cutting_verifier"]} />,
            children: [
              {
                path: "/verification",
                element: <VerificationPage />,
              },
            ],
          },
          {
            element: <RoleRoute allowed={["sewing_supervisor"]} />,
            children: [
              {
                path: "/sewing",
                element: <SewingPage />,
              },
              {
                path: "/sewing/pending",
                element: <Navigate to="/sewing" replace />,
              },
              {
                path: "/sewing/started",
                element: <Navigate to="/sewing" replace />,
              },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
