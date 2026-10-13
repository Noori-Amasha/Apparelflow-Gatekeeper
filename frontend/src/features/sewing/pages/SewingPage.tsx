import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shirt, Clock3, PlayCircle, Eye, RefreshCw, ShieldCheck,
} from "lucide-react";
import { sewingApi } from "../api/sewing.api";
import { apiError } from "../../../lib/api";
import { useToast } from "../../../app/providers/ToastProvider";
import type { SewingOrder } from "../../../types/production";
import { formatDate, numberValue } from "../../../types/production";
import { Card, StatCard } from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/common/DataTable";
import Modal from "../../../components/common/Modal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

export default function SewingPage() {
  const [tab, setTab] = useState<"pending" | "started">("pending");
  const [selected, setSelected] = useState<SewingOrder | null>(null);
  const [confirm, setConfirm] = useState(false);

  const queryClient = useQueryClient();
  const { notify } = useToast();

  const pending = useQuery({
    queryKey: ["sewing-queue"],
    queryFn: sewingApi.queue,
  });

  const started = useQuery({
    queryKey: ["sewing-started"],
    queryFn: sewingApi.started,
  });

  const detail = useQuery({
    queryKey: ["sewing-detail", selected?.id],
    queryFn: () => sewingApi.detail(selected!.id),
    enabled: Boolean(selected),
  });

  const start = useMutation({
    mutationFn: () => sewingApi.start(selected!.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sewing-queue"] }),
        queryClient.invalidateQueries({ queryKey: ["sewing-started"] }),
        queryClient.invalidateQueries({ queryKey: ["sewing-detail"] }),
      ]);
      notify("Sewing assembly started successfully", "success");
      setConfirm(false);
      setSelected(null);
      setTab("started");
    },
    onError: (error) => {
      notify(apiError(error), "error");
      setConfirm(false);
    },
  });

  const rows = tab === "pending"
    ? pending.data ?? []
    : started.data ?? [];

  const activeQuery = tab === "pending" ? pending : started;

  const order = detail.data;

  const actualFabric = order?.actual_fabric_yds == null
    ? null
    : numberValue(order.actual_fabric_yds);

  const expectedFabric = order?.expected_fabric_yds == null
    ? null
    : numberValue(order.expected_fabric_yds);

  const variance = order?.wastage_pct == null
    ? null
    : numberValue(order.wastage_pct);

  const varianceLabel = variance === null
    ? "Unavailable"
    : variance > 0
      ? "Above standard usage"
      : variance < 0
        ? "Below standard usage"
        : "Matches standard usage";

  const refresh = () => {
    pending.refetch();
    started.refetch();
  };

  const closeDetails = () => {
    if (start.isPending) return;
    setSelected(null);
    setConfirm(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-extrabold tracking-widest text-primary-600">
          ASSEMBLY OPERATIONS
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
          Sewing Operations
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage approved cutting batches and sewing assembly.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending Sewing"
          value={pending.data?.length ?? 0}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Sewing Started"
          value={started.data?.length ?? 0}
          icon={PlayCircle}
          tone="violet"
        />
        <StatCard
          label="Approved Garments Waiting"
          value={(pending.data ?? []).reduce(
            (sum, row) => sum + numberValue(row.target_qty),
            0
          )}
          icon={Shirt}
          tone="green"
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Assembly Batches
            </h2>
            <p className="text-sm text-slate-500">
              Review verified batches and their sewing progress.
            </p>
          </div>
          <Button
            variant="outline"
            icon={<RefreshCw size={17} />}
            disabled={pending.isFetching || started.isFetching}
            onClick={refresh}
          >
            Refresh
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setTab("pending")}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold ${
              tab === "pending"
                ? "bg-primary-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Pending Sewing ({pending.data?.length ?? 0})
          </button>

          <button
            type="button"
            onClick={() => setTab("started")}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold ${
              tab === "started"
                ? "bg-primary-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Sewing Started ({started.data?.length ?? 0})
          </button>
        </div>

        {activeQuery.isError && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {apiError(activeQuery.error)}
          </p>
        )}

        <DataTable
          rows={rows}
          loading={activeQuery.isLoading}
          rowKey={(row) => row.id}
          searchValue={(row) =>
            `${row.order_no} ${row.recipe_name} ${row.fabric_roll_id}`
          }
          emptyTitle={tab === "pending"
            ? "No batches pending sewing"
            : "No sewing assemblies started"}
          columns={[
            {
              key: "order",
              title: "Order Number",
              render: (row) => <strong>{row.order_no}</strong>,
            },
            {
              key: "recipe",
              title: "Garment",
              render: (row) => row.recipe_name,
            },
            {
              key: "quantity",
              title: "Quantity",
              render: (row) => row.target_qty,
            },
            {
              key: "actual",
              title: "Actual Fabric",
              render: (row) => row.actual_fabric_yds == null
                ? "—"
                : `${numberValue(row.actual_fabric_yds).toFixed(3)} yds`,
            },
            {
              key: "verified",
              title: "Verified By",
              render: (row) => row.verifier_name,
            },
            {
              key: "status",
              title: "Status",
              render: (row) => <StatusBadge status={row.status} />,
            },
            {
              key: "action",
              title: "Action",
              render: (row) => (
                <Button
                  variant="secondary"
                  icon={<Eye size={17} />}
                  onClick={() => setSelected(row)}
                >
                  Details
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={Boolean(selected)}
        title={selected
          ? `Batch ${selected.order_no}`
          : "Batch Details"}
        onClose={closeDetails}
        wide
        busy={start.isPending}
      >
        {detail.isLoading && (
          <p className="text-sm text-slate-500">
            Loading verification audit...
          </p>
        )}

        {detail.isError && (
          <p role="alert" className="text-sm text-red-600">
            {apiError(detail.error)}
          </p>
        )}

        {order && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-2xl border
              border-emerald-200 bg-emerald-50 p-4">
              <ShieldCheck
                size={25}
                className="shrink-0 text-emerald-600"
              />
              <div>
                <strong className="text-emerald-800">
                  Verified Production Batch
                </strong>
                <p className="text-xs text-emerald-700">
                  Authorized verification completed
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-slate-500">Garment</p>
                <strong>{order.recipe_name}</strong>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-slate-500">Target Quantity</p>
                <strong>{order.target_qty}</strong>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-slate-500">Verified By</p>
                <strong>{order.verifier_name}</strong>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-slate-500">Verified At</p>
                <strong>{formatDate(order.verified_at)}</strong>
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-bold text-slate-900">
                Fabric Usage & Variance
              </h3>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs text-blue-700">
                    Expected Fabric
                  </p>
                  <strong className="mt-2 block text-lg text-blue-900">
                    {expectedFabric === null
                      ? "—"
                      : `${expectedFabric.toFixed(2)} yds`}
                  </strong>
                  <p className="mt-1 text-xs text-blue-600">
                    Recipe standard
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 p-4">
                  <p className="text-xs text-slate-600">
                    Actual Fabric Used
                  </p>
                  <strong className="mt-2 block text-lg text-slate-900">
                    {actualFabric === null
                      ? "—"
                      : `${actualFabric.toFixed(3)} yds`}
                  </strong>
                  <p className="mt-1 text-xs text-slate-500">
                    Supervisor-recorded usage
                  </p>
                </div>

                <div className={`rounded-xl p-4 ${
                  variance === null
                    ? "bg-slate-100"
                    : variance > 0
                      ? "bg-amber-50"
                      : "bg-emerald-50"
                }`}>
                  <p className="text-xs text-slate-600">
                    Verified Fabric Variance
                  </p>
                  <strong className="mt-2 block text-lg text-slate-900">
                    {variance === null
                      ? "—"
                      : `${variance > 0 ? "+" : ""}${variance.toFixed(2)}%`}
                  </strong>
                  <p className="mt-1 text-xs text-slate-600">
                    {varianceLabel}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Verified variance is calculated by the backend using
                supervisor-recorded actual fabric and the standard
                expected amount. Negative variance indicates usage
                below the standard, not negative fabric consumption.
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-bold text-slate-900">
                Verified Component Counts
              </h3>

              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between
                      gap-3 rounded-xl border border-slate-200 p-3 text-sm"
                  >
                    <span className="font-semibold text-slate-900">
                      {item.component_name ?? "Component name unavailable"}
                    </span>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-slate-500">
                        Expected {item.expected_qty} /
                        Actual {item.actual_qty ?? "—"}
                      </span>
                      {item.status ? (
                        <StatusBadge status={item.status} />
                      ) : (
                        <span className="text-xs text-slate-500">
                          Uncounted
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {order.status === "SEWING_STARTED" && (
              <div className="rounded-xl bg-violet-50 p-4 text-sm
                text-violet-800">
                Sewing started by{" "}
                {order.started_by_name ?? "Sewing Supervisor"} on{" "}
                {formatDate(order.started_at)}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeDetails}>
                Close
              </Button>

              {order.status === "VERIFIED" && (
                <Button
                  icon={<PlayCircle size={18} />}
                  onClick={() => setConfirm(true)}
                >
                  Start Sewing Assembly
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {confirm && selected && (
        <ConfirmDialog
          title="Start sewing assembly?"
          description={`Release ${selected.order_no} to the sewing floor? This action will change its status to Sewing Started.`}
          confirmLabel="Start Sewing"
          loading={start.isPending}
          onCancel={() => setConfirm(false)}
          onConfirm={() => start.mutate()}
        />
      )}
    </div>
  );
}
