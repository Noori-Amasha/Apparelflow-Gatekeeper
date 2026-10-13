import { Navigate, useNavigate } from "react-router-dom";
import {
  Shirt,
  Scissors,
  ClipboardCheck,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../../app/providers/AuthProvider";
import { roleHome } from "../../../app/config/navigation";
import LoginForm from "../components/LoginForm";
import DemoCredentialsPanel from "../components/DemoCredentialsPanel";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return (
    <div className="grid min-h-screen bg-white md:grid-cols-2">
      <section
        className="relative hidden min-h-screen overflow-hidden
          bg-linear-to-br from-blue-600 via-primary-700 to-indigo-900
          text-white md:flex"
      >
        <div
          className="pointer-events-none absolute -left-24 -top-24
            h-96 w-96 rounded-full bg-sky-300/20 blur-3xl"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-20
            h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl"
        />

        <div
          className="relative mx-auto flex w-full max-w-145 flex-col
            justify-between px-9 py-10 lg:px-14"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/20 p-3">
              <Shirt size={27} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">
                ApparelFlow
              </h1>
              <p className="text-xs tracking-wider text-blue-100">
                PRODUCTION ERP
              </p>
            </div>
          </div>

          <div className="my-12">
            <div
              className="inline-flex rounded-full border border-white/20
                bg-white/10 px-4 py-2 text-xs font-semibold tracking-wider"
            >
              SMART PRODUCTION MANAGEMENT
            </div>

            <h2
              className="mt-7 text-5xl font-extrabold leading-tight
                tracking-tight lg:text-6xl"
            >
              From cutting
              <br />
              to{" "}
              <span className="text-emerald-200">
                confidence.
              </span>
            </h2>

            <p className="mt-5 max-w-lg text-base leading-8 text-blue-100">
              Manage production batches, verify every garment component,
              and release quality-approved work to the sewing floor.
            </p>

            <div
              className="mt-9 rounded-3xl border border-white/25
                bg-white/15 p-6 shadow-2xl backdrop-blur-lg"
            >
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="rounded-2xl bg-emerald-300/20 p-3
                    text-emerald-200"
                >
                  <ShieldCheck size={27} />
                </div>
                <div>
                  <h3 className="font-bold">
                    Quality at every step
                  </h3>
                  <p className="text-sm text-blue-100">
                    A controlled production workflow
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Scissors, label: "Cutting" },
                  { icon: ClipboardCheck, label: "Verification" },
                  { icon: Shirt, label: "Sewing" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-2
                      rounded-2xl bg-white/10 p-3 text-center"
                  >
                    <Icon size={23} />
                    <span className="text-xs font-semibold">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-blue-100">
            <CheckCircle2
              size={19}
              className="text-emerald-200"
            />
            Secure role-based production access
          </div>
        </div>
      </section>

      <section
        className="flex min-h-screen items-center justify-center
          px-5 py-12 sm:px-10"
      >
        <div className="w-full max-w-md">
          <div
            className="mb-9 flex items-center gap-3 text-xl
              font-extrabold text-primary-700 md:hidden"
          >
            <Shirt size={27} />
            ApparelFlow
          </div>

          <div
            className="inline-flex items-center gap-2 rounded-full
              bg-blue-50 px-4 py-2 text-xs font-bold text-primary-700"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            SECURE EMPLOYEE ACCESS
          </div>

          <h2
            className="mt-6 text-4xl font-extrabold
              tracking-tight text-slate-950"
          >
            Welcome back
          </h2>

          <p className="mb-9 mt-3 text-sm text-slate-500">
            Sign in to manage your manufacturing workflow.
          </p>

          <LoginForm
            onSuccess={(role) =>
              navigate(roleHome[role], { replace: true })
            }
          />

          <DemoCredentialsPanel />

          <p className="mt-9 text-center text-xs text-slate-400">
            ApparelFlow ERP · Production Gatekeeper
          </p>
        </div>
      </section>
    </div>
  );
}
