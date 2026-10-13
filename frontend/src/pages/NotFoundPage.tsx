import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { useAuth } from "../app/providers/AuthProvider";
import { roleHome } from "../app/config/navigation";

export default function NotFoundPage() {
  const { user } = useAuth();

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-5">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 grid h-18 w-18 place-items-center
          rounded-2xl bg-blue-100 text-primary-600">
          <FileQuestion size={34} />
        </div>
        <h1 className="text-3xl font-extrabold">Page not found</h1>
        <p className="mt-3 text-sm text-slate-500">
          This page doesn't exist or is unavailable.
        </p>
        <Link
          to={user ? roleHome[user.role] : "/login"}
          className="mt-6 inline-flex rounded-xl bg-primary-600
            px-5 py-3 text-sm font-bold text-white hover:bg-primary-700"
        >
          Return to workspace
        </Link>
      </div>
    </div>
  );
}
