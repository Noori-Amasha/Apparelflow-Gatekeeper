import { useState, type ReactNode } from "react";
import { Loader2, Search } from "lucide-react";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";

export type Column<T> = {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  searchValue: (row: T) => string;
  filters?: ReactNode;
  loading?: boolean;
  emptyTitle?: string;
  pageSize?: number;
};

export default function DataTable<T>({
  rows,
  columns,
  rowKey,
  searchValue,
  filters,
  loading = false,
  emptyTitle = "No records found",
  pageSize = 8,
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = rows.filter((row) =>
    searchValue(row).toLowerCase().includes(search.trim().toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice(
    (current - 1) * pageSize,
    current * pageSize
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search orders..."
            aria-label="Search orders"
            className="w-full rounded-xl border border-slate-300 bg-white
              py-2.5 pl-10 pr-4 text-sm text-slate-900
              placeholder:text-slate-400 focus:border-primary-500
              focus:outline-none focus:ring-4 focus:ring-primary-100"
          />
        </div>
        {filters}
      </div>

      {loading ? (
        <div className="flex justify-center gap-2 py-14 text-slate-500">
          <Loader2 className="animate-spin" /> Loading records...
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description="No records match the current selection."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="whitespace-nowrap px-4 py-4 font-bold"
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-blue-50/40">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4 text-slate-700">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={current}
        pageSize={pageSize}
        total={filtered.length}
        onChange={setPage}
      />
    </div>
  );
}
