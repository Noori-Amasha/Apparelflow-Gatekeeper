const colors: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  PENDING_VERIFICATION: "bg-amber-100 text-amber-800",
  VERIFIED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
  SEWING_STARTED: "bg-violet-100 text-violet-700",
  GREEN: "bg-emerald-100 text-emerald-800",
  YELLOW: "bg-amber-100 text-amber-800",
  RED: "bg-red-100 text-red-700",
};

const labels: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  PENDING_VERIFICATION: "Pending Verification",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  SEWING_STARTED: "Sewing Started",
  GREEN: "Match",
  YELLOW: "Excess",
  RED: "Shortage",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1
      text-xs font-bold ${colors[status] ?? "bg-slate-100 text-slate-700"}`}>
      {labels[status] ?? status.replaceAll("_", " ")}
    </span>
  );
}
