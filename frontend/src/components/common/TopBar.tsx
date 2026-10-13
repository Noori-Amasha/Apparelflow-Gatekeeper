import { Menu, ShieldCheck } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { roleLabel } from "../../types/auth";

export default function TopBar({ openMenu }: { openMenu: () => void }) {
  const { user } = useAuth();

  return (
    <header className="flex h-20 items-center justify-between gap-4
      border-b border-slate-200 bg-white px-5 md:px-8">
      <div className="flex items-center gap-4">
        <button
          className="rounded-xl bg-blue-50 p-2.5 text-primary-700 lg:hidden"
          onClick={openMenu}
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>
        <div>
          <p className="text-[10px] font-extrabold tracking-widest text-primary-500">
            MANUFACTURING OPERATIONS
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900 md:text-base">
            Production Management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full
          bg-blue-50 px-4 py-2 text-xs font-bold text-primary-700 md:flex">
          <ShieldCheck size={16} />
          Secure workspace
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl
          bg-primary-100 font-bold text-primary-700">
          {user?.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold text-slate-900">{user?.full_name}</p>
          <p className="text-xs text-slate-500">
            {user ? roleLabel[user.role] : ""}
          </p>
        </div>
      </div>
    </header>
  );
}
