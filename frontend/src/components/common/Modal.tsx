import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  wide?: boolean;
  busy?: boolean;
};

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  wide = false,
  busy = false,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, busy]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
      bg-slate-950/60 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white
          p-6 shadow-2xl ${wide ? "max-w-3xl" : "max-w-lg"}`}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100
              disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {children}

        {footer && (
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            {footer}
          </div>
        )}
      </section>
    </div>
  );
}
