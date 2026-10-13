import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes, Clock3, BadgeCheck, Plus, RefreshCw,
  Eye, Send, RotateCcw,
} from "lucide-react";
import { cuttingApi } from "../api/cutting.api";
import { useToast } from "../../../app/providers/ToastProvider";
import { apiError } from "../../../lib/api";
import type { CuttingOrder, OrderStatus } from "../../../types/production";
import { formatDate, numberValue } from "../../../types/production";
import { Card, StatCard } from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/common/DataTable";
import Modal from "../../../components/common/Modal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import CreateOrderModal from "../components/CreateOrderModal";

const statuses: ("ALL" | OrderStatus)[] = [
  "ALL", "IN_PROGRESS", "PENDING_VERIFICATION",
  "VERIFIED", "REJECTED", "SEWING_STARTED",
];

const validFabric = (value: string) => {
  if (!value.trim()) return false;
  const number = Number(value);
  return Number.isFinite(number) &&
    number >= 0 &&
    number <= 999999999.999 &&
    Math.abs(number * 1000 - Math.round(number * 1000)) < 0.00001;
};

export default function CuttingOrdersPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<CuttingOrder | null>(null);
  const [action, setAction] = useState<"submit" | "rework" | null>(null);
  const [fabric, setFabric] = useState("");

  const queryClient = useQueryClient();
  const { notify } = useToast();

  const orders = useQuery({
    queryKey: ["cutting-orders"],
    queryFn: cuttingApi.orders,
  });

  const recipes = useQuery({
    queryKey: ["recipes"],
    queryFn: cuttingApi.recipes,
  });

  const detail = useQuery({
    queryKey: ["cutting-detail", selected?.id],
    queryFn: () => cuttingApi.detail(selected!.id),
    enabled: Boolean(selected),
  });

  // Fetch the selected recipe with its component names.
  const selectedRecipe = useQuery({
    queryKey: ["recipe", selected?.recipe_id],
    queryFn: () => cuttingApi.recipe(selected!.recipe_id),
    enabled: Boolean(selected?.recipe_id),
  });

  const all = orders.data ?? [];
  const filtered = all.filter(
    (order) => status === "ALL" || order.status === status
  );

  // Prefer refreshed server data over the originally selected table row.
  const currentOrder = selected
    ? all.find((order) => order.id === selected.id) ?? selected
    : null;

  const recipeName = (id: string) =>
    recipes.data?.find((recipe) => recipe.id === id)?.name ?? "—";

  const componentName = (id: string) =>
    selectedRecipe.data?.components?.find(
      (component) => component.id === id
    )?.component_name ?? "Component name unavailable";

  const expectedFabric = currentOrder && selectedRecipe.data
    ? numberValue(selectedRecipe.data.std_fabric_yards) *
      numberValue(currentOrder.target_qty)
    : null;

  const actualFabric = currentOrder?.actual_fabric_yds == null
    ? null
    : numberValue(currentOrder.actual_fabric_yds);

  const variance = expectedFabric !== null &&
    expectedFabric > 0 &&
    actualFabric !== null
      ? ((actualFabric - expectedFabric) / expectedFabric) * 100
      : null;

  const pendingFabricChanges = currentOrder &&
    validFabric(fabric) &&
    Number(fabric) !== numberValue(currentOrder.actual_fabric_yds);

  const canSubmit = currentOrder?.status === "IN_PROGRESS" &&
    actualFabric !== null &&
    actualFabric > 0 &&
    !pendingFabricChanges;

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["cutting-orders"] }),
      queryClient.invalidateQueries({ queryKey: ["cutting-detail"] }),
    ]);
  };

  const closeDetails = () => {
    if (mutation.isPending || fabricMutation.isPending) return;
    setSelected(null);
    setAction(null);
  };

  const openDetails = (order: CuttingOrder) => {
    setSelected(order);
    setFabric(String(order.actual_fabric_yds ?? ""));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!currentOrder || !action) {
        throw new Error("No order action selected");
      }
      if (action === "submit") return cuttingApi.submit(currentOrder.id);
      return cuttingApi.rework(currentOrder.id);
    },
    onSuccess: async () => {
      const completedAction = action;
      await refresh();
      notify(
        completedAction === "submit"
          ? "Order submitted for verification"
          : "Order reopened for rework",
        "success"
      );
      setAction(null);
      setSelected(null);
    },
    onError: (error) => notify(apiError(error), "error"),
  });

  const fabricMutation = useMutation({
    mutationFn: (yards: number) =>
      cuttingApi.updateFabric(currentOrder!.id, yards),
    onSuccess: async (_response, yards) => {
      setSelected((previous) => previous
        ? { ...previous, actual_fabric_yds: yards }
        : null
      );
      await refresh();
      notify("Actual fabric usage updated", "success");
    },
    onError: (error) => notify(apiError(error), "error"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold tracking-widest text-primary-600">
            CUTTING OPERATIONS
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Cutting Orders
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Create and manage your production batches.
          </p>
        </div>
        <Button
          icon={<Plus size={18} />}
          onClick={() => setCreateOpen(true)}
        >
          Create Order
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Orders"
          value={all.length}
          icon={Boxes}
        />
        <StatCard
          label="Pending Verification"
          value={all.filter(
            (order) => order.status === "PENDING_VERIFICATION"
          ).length}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Verified Batches"
          value={all.filter(
            (order) => ["VERIFIED", "SEWING_STARTED"].includes(order.status)
          ).length}
          icon={BadgeCheck}
          tone="green"
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Production Orders
            </h2>
            <p className="text-sm text-slate-500">
              Track status and manage your existing orders.
            </p>
          </div>
          <Button
            variant="outline"
            icon={<RefreshCw size={16} />}
            disabled={orders.isFetching}
            onClick={() => orders.refetch()}
          >
            Refresh
          </Button>
        </div>

        {orders.isError && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {apiError(orders.error)}
          </p>
        )}

        <DataTable
          rows={filtered}
          loading={orders.isLoading}
          rowKey={(row) => row.id}
          searchValue={(row) =>
            `${row.order_no} ${row.fabric_roll_id} ${recipeName(row.recipe_id)}`
          }
          filters={
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white
                px-4 py-2.5 text-sm text-slate-900"
            >
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {value === "ALL"
                    ? "All Statuses"
                    : value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          }
          columns={[
            {
              key: "order",
              title: "Order Number",
              render: (row) => <strong>{row.order_no}</strong>,
            },
            {
              key: "recipe",
              title: "Recipe",
              render: (row) => recipeName(row.recipe_id),
            },
            {
              key: "quantity",
              title: "Quantity",
              render: (row) => row.target_qty,
            },
            {
              key: "fabric",
              title: "Actual Fabric",
              render: (row) => row.actual_fabric_yds == null
                ? "—"
                : `${numberValue(row.actual_fabric_yds).toFixed(3)} yds`,
            },
            {
              key: "date",
              title: "Created",
              render: (row) => formatDate(row.created_at),
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
                  icon={<Eye size={16} />}
                  onClick={() => openDetails(row)}
                >
                  View
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <CreateOrderModal
        open={createOpen}
        close={() => setCreateOpen(false)}
      />

      <Modal
        open={Boolean(selected)}
        title={currentOrder
          ? `Order ${currentOrder.order_no}`
          : "Order Details"}
        onClose={closeDetails}
        wide
        busy={mutation.isPending || fabricMutation.isPending}
      >
        {currentOrder && (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <p>
                Recipe:{" "}
                <strong>{recipeName(currentOrder.recipe_id)}</strong>
              </p>
              <p>
                Quantity: <strong>{currentOrder.target_qty}</strong>
              </p>
              <p>
                Fabric Roll:{" "}
                <strong>{currentOrder.fabric_roll_id}</strong>
              </p>
              <p>
                Status: <StatusBadge status={currentOrder.status} />
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-bold text-slate-900">
                Fabric Usage
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
                    Recipe standard × quantity
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
                    Recorded by supervisor
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
                    Estimated Fabric Variance
                  </p>
                  <strong className="mt-2 block text-lg text-slate-900">
                    {variance === null
                      ? "—"
                      : `${variance > 0 ? "+" : ""}${variance.toFixed(2)}%`}
                  </strong>
                  <p className="mt-1 text-xs text-slate-600">
                    {variance === null
                      ? "Awaiting recipe data"
                      : variance > 0
                        ? "Above standard usage"
                        : variance < 0
                          ? "Below standard usage"
                          : "Matches standard usage"}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Variance compares the supervisor-recorded actual fabric
                against the recipe standard. 
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-bold text-slate-900">
                Expected Components
              </h3>

              {detail.isLoading || selectedRecipe.isLoading ? (
                <p className="text-sm text-slate-500">
                  Loading components...
                </p>
              ) : detail.isError ? (
                <p role="alert" className="text-sm text-red-600">
                  {apiError(detail.error)}
                </p>
              ) : selectedRecipe.isError ? (
                <p role="alert" className="text-sm text-red-600">
                  Unable to load recipe component names.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {detail.data?.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <p className="text-sm font-medium text-slate-700">
                        {componentName(item.component_id)}
                      </p>
                      <strong className="mt-1 block text-lg text-slate-900">
                        {item.expected_qty} pieces
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {currentOrder.status === "IN_PROGRESS" && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <label
                  htmlFor="fabric-edit"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Update Actual Fabric Used (yards)
                </label>
                <p className="mb-3 text-xs text-slate-600">
                  Enter the measured amount, not the automatic estimate.
                </p>
                <div className="flex flex-wrap gap-3">
                  <input
                    id="fabric-edit"
                    type="number"
                    min="0"
                    step="0.001"
                    value={fabric}
                    onChange={(event) => setFabric(event.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-slate-300
                      bg-white p-3 text-slate-900 outline-none
                      focus:border-primary-500 focus:ring-4 focus:ring-blue-100"
                  />
                  <Button
                    variant="outline"
                    loading={fabricMutation.isPending}
                    disabled={!validFabric(fabric) ||
                      !pendingFabricChanges}
                    onClick={() => fabricMutation.mutate(Number(fabric))}
                  >
                    Save Fabric
                  </Button>
                </div>
                {!validFabric(fabric) && (
                  <p className="mt-2 text-xs text-red-600">
                    Enter a non-negative number with up to 3 decimal places.
                  </p>
                )}
                {pendingFabricChanges && (
                  <p className="mt-2 text-xs text-amber-800">
                    Unsaved fabric change. Save before submitting.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeDetails}
              >
                Close
              </Button>

              {currentOrder.status === "REJECTED" && (
                <Button
                  icon={<RotateCcw size={17} />}
                  onClick={() => setAction("rework")}
                >
                  Reopen for Rework
                </Button>
              )}

              {currentOrder.status === "IN_PROGRESS" && (
                <Button
                  icon={<Send size={17} />}
                  disabled={!canSubmit || fabricMutation.isPending}
                  onClick={() => setAction("submit")}
                >
                  Submit for Verification
                </Button>
              )}
            </div>

            {currentOrder.status === "IN_PROGRESS" &&
              actualFabric === 0 && (
                <p className="text-xs text-red-600">
                  Actual fabric must be greater than zero before submission.
                </p>
              )}
          </div>
        )}
      </Modal>

      {currentOrder && action && (
        <ConfirmDialog
          title={action === "submit"
            ? "Submit cutting order?"
            : "Reopen rejected order?"}
          description={action === "submit"
            ? "This order will be sent to the Cutting Verifier."
            : "This order will reopen for corrective cutting work."}
          confirmLabel={action === "submit"
            ? "Submit Order"
            : "Reopen Order"}
          loading={mutation.isPending}
          onCancel={() => setAction(null)}
          onConfirm={() => mutation.mutate()}
        />
      )}
    </div>
  );
}
