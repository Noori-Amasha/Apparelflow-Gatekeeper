import { useState } from "react";
import {
  ShieldCheck,
  Scissors,
  ClipboardCheck,
  Shirt,
  ChevronDown,
  Copy,
  Check,
  Eye,
  EyeOff,
  type LucideIcon,
} from "lucide-react";

type DemoAccount = {
  role: string;
  email: string;
  password: string;
  icon: LucideIcon;
  color: string;
};

const demoAccounts: DemoAccount[] = [
  {
    role: "Cutting Supervisor",
    email: "supervisor@demo.com",
    password: "Super@123",
    icon: Scissors,
    color: "bg-blue-100 text-blue-700",
  },
  {
    role: "Cutting Verifier",
    email: "verifier@demo.com",
    password: "Cutting@123",
    icon: ClipboardCheck,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    role: "Sewing Supervisor",
    email: "sewing@demo.com",
    password: "Sewing@123",
    icon: Shirt,
    color: "bg-violet-100 text-violet-700",
  },
];

export default function DemoCredentialsPanel() {
  const [open, setOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [copied, setCopied] = useState("");

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
    } catch {
      setCopied("");
    }
  };

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-controls="demo-credentials"
        className="flex w-full items-center justify-between gap-3 p-5 text-left
          transition-colors hover:bg-blue-100/60"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-2.5 text-primary-700">
            <ShieldCheck size={21} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary-800">
              Demo Credentials
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Explore all three production roles
            </p>
          </div>
        </div>

        <ChevronDown
          size={19}
          className={`shrink-0 text-primary-700 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          id="demo-credentials"
          className="space-y-3 border-t border-blue-100 bg-white/70 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Select an account to test its permissions.
            </p>

            <button
              type="button"
              onClick={() => setShowPasswords((value) => !value)}
              className="flex shrink-0 items-center gap-1.5 text-xs
                font-semibold text-primary-700 hover:text-primary-800"
            >
              {showPasswords ? <EyeOff size={15} /> : <Eye size={15} />}
              {showPasswords ? "Hide" : "Show"}
            </button>
          </div>

          {demoAccounts.map((account) => {
            const Icon = account.icon;

            return (
              <div
                key={account.email}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${account.color}`}>
                    <Icon size={18} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {account.role}
                  </h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-500">
                      Email
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 break-all text-sm text-slate-800">
                        {account.email}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          copy(account.email, `${account.email}-email`)
                        }
                        aria-label={`Copy ${account.role} email`}
                        className="shrink-0 rounded-lg p-2 text-primary-600
                          hover:bg-blue-50"
                      >
                        {copied === `${account.email}-email`
                          ? <Check size={16} />
                          : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-500">
                      Password
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-800">
                        {showPasswords ? account.password : "••••••••"}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          copy(account.password, `${account.email}-password`)
                        }
                        aria-label={`Copy ${account.role} password`}
                        className="shrink-0 rounded-lg p-2 text-primary-600
                          hover:bg-blue-50"
                      >
                        {copied === `${account.email}-password`
                          ? <Check size={16} />
                          : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <p className="pt-1 text-center text-xs text-slate-500">
            Demo accounts are provided for evaluation purposes.
          </p>
          <span className="sr-only" role="status">
            {copied ? "Copied to clipboard" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
