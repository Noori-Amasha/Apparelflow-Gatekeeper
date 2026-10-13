import { NavLink } from "react-router-dom";
import { LogOut, Shirt, X } from "lucide-react";
import { navigation } from "../../app/config/navigation";
import { useAuth } from "../../app/providers/AuthProvider";
import { roleLabel } from "../../types/auth";

type Props = {
  open: boolean;
  close: () => void;
  requestLogout: () => void;
};

export default function Sidebar({ open, close, requestLogout }: Props) {
  const { user } = useAuth();
  if (!user) return null;

  const visible = navigation.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          onClick={close}
          className="fixed inset-0 z-40 bg-slate-950/55 lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-65
        flex-col bg-linear-to-b from-primary-800 to-primary-950
        text-white transition-transform lg:sticky lg:top-0 lg:h-screen
        lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-23 items-center gap-3 border-b
          border-white/15 px-5">
          <div className="rounded-2xl border border-white/20
            bg-white/15 p-3">
            <Shirt size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Apparel<span className="text-blue-200">Flow</span>
            </h1>
            <p className="text-[11px] tracking-wider text-blue-200">
              PRODUCTION ERP
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close menu"
            className="ml-auto lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <p className="px-6 pb-4 pt-8 text-[10px] font-extrabold
          tracking-[.2em] text-blue-200">
          WORKSPACE
        </p>

        <nav className="flex flex-col gap-2 px-3" aria-label="Main navigation">
          {visible.map((item) => {
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  aria-disabled="true"
                  className="flex items-center gap-3 rounded-xl px-4
                    py-3 text-sm text-blue-200/55"
                >
                  <Icon size={19} />
                  <span className="flex-1">{item.label}</span>
                  <small>Soon</small>
                </div>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.path!}
                onClick={close}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3
                   text-sm font-medium transition ${
                    isActive
                      ? "bg-white font-bold text-primary-700 shadow-lg"
                      : "text-blue-100 hover:bg-white/15 hover:text-white"
                  }`
                }
              >
                <Icon size={19} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/15 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center
              rounded-xl bg-white/20 font-bold">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.full_name}</p>
              <p className="text-xs text-blue-200">{roleLabel[user.role]}</p>
            </div>
          </div>

          <button
            onClick={requestLogout}
            className="flex w-full items-center justify-center gap-2
              rounded-xl border border-white/25 bg-white/10 px-4
              py-3 text-sm font-semibold hover:bg-white/20"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
