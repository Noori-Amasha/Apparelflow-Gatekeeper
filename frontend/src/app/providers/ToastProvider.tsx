import {
  createContext, useCallback, useContext, useEffect,
  useState, type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type Kind = "success" | "error" | "info";
type Toast = { id: number; kind: Kind; message: string };
type Context = { notify: (message: string, kind?: Kind) => void };

const ToastContext = createContext<Context | null>(null);
let nextId = 0;

function ToastEntry({
  toast, dismiss,
}: {
  toast: Toast;
  dismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), 4500);
    return () => window.clearTimeout(timer);
  }, [toast.id, dismiss]);

  const Icon = toast.kind === "success"
    ? CheckCircle2
    : toast.kind === "error" ? AlertCircle : Info;

  const tone = {
    success: "border-emerald-500 text-emerald-600",
    error: "border-red-500 text-red-600",
    info: "border-blue-500 text-blue-600",
  }[toast.kind];

  return (
    <div className={`flex gap-3 rounded-2xl border-l-4 bg-white p-4
      shadow-xl ${tone}`}>
      <Icon size={20} className="shrink-0" />
      <p className="flex-1 text-sm text-slate-700">{toast.message}</p>
      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        className="self-start text-slate-400 hover:text-slate-700"
      >
        <X size={17} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((message: string, kind: Kind = "info") => {
    setToasts((items) => [...items, { id: ++nextId, kind, message }]);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed right-4 top-4 z-100 grid w-[min(380px,calc(100vw-32px))] gap-3"
        aria-live="polite">
        {toasts.map((toast) => (
          <ToastEntry key={toast.id} toast={toast} dismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("ToastProvider is missing");
  return context;
}
