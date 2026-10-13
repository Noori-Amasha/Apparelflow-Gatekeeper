import type { HTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-2xl border border-slate-200 bg-white
        p-5 shadow-sm ${className}`}
    />
  );
}

type StatProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "red" | "violet";
};

const tones = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  red: "bg-red-100 text-red-600",
  violet: "bg-violet-100 text-violet-600",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
}: StatProps) {
  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <strong className="mt-2 block text-3xl font-bold text-slate-900">
          {value}
        </strong>
      </div>

      <div className={`rounded-2xl p-3.5 ${tones[tone]}`}>
        <Icon size={25} />
      </div>
    </Card>
  );
}
