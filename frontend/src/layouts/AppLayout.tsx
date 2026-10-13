import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import TopBar from "../components/common/TopBar";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useAuth } from "../app/providers/AuthProvider";
import { useToast } from "../app/providers/ToastProvider";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    setConfirmLogout(false);
    notify("Signed out successfully", "success");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        open={menuOpen}
        close={() => setMenuOpen(false)}
        requestLogout={() => setConfirmLogout(true)}
      />

      <div className="min-w-0 flex-1">
        <TopBar openMenu={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-360 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {confirmLogout && (
        <ConfirmDialog
          title="Sign out?"
          description="Are you sure you want to end your session?"
          confirmLabel="Sign out"
          onCancel={() => setConfirmLogout(false)}
          onConfirm={signOut}
        />
      )}
    </div>
  );
}
