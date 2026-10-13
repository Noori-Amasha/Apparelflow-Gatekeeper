import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../ui/Button";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
};

export default function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: Props) {
  if (!total) return null;

  const pages = Math.ceil(total / pageSize);
  const current = Math.min(Math.max(page, 1), pages);
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-5
      text-sm text-slate-500">
      <span>Showing {start}–{end} of {total}</span>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="p-2!"
          disabled={current === 1}
          onClick={() => onChange(current - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </Button>
        <span className="font-semibold text-slate-700">{current} / {pages}</span>
        <Button
          variant="outline"
          className="p-2!"
          disabled={current === pages}
          onClick={() => onChange(current + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
}
