import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Clock3,
  PackageCheck,
  RefreshCw,
  Eye,
} from "lucide-react";

import { verificationApi } from "../api/verification.api";
import { Card, StatCard } from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/common/DataTable";
import VerificationModal from "../components/VerificationModal";
import type { CuttingOrder } from "../../../types/production";
import { formatDate } from "../../../types/production";
import { apiError } from "../../../lib/api";

export default function VerificationPage() {
  const [selected, setSelected] = useState<CuttingOrder | null>(null);

  const orders = useQuery({
    queryKey: ["verification-queue"],
    queryFn: verificationApi.queue,
  });

  const pendingOrders = orders.data ?? [];

  const totalGarments = pendingOrders.reduce(
    (total, order) => total + Number(order.target_qty),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-extrabold tracking-widest text-primary-600">
          QUALITY CONTROL
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
          Verification Workspace
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Inspect garment components and verify production batches before sewing.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending Batches"
          value={pendingOrders.length}
          icon={ClipboardCheck}
          tone="blue"
        />
        <StatCard
          label="Awaiting Verification"
          value={pendingOrders.length}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Garments Awaiting QC"
          value={totalGarments}
          icon={PackageCheck}
          tone="green"
        />
      </div>

      <Card>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Pending Verification
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review component counts and approve or reject cutting batches.
            </p>
          </div>

          <Button
            variant="outline"
            icon={<RefreshCw size={17} />}
            onClick={() => orders.refetch()}
            disabled={orders.isFetching}
          >
            Refresh
          </Button>
        </div>

        {orders.isError && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {apiError(orders.error)}
          </div>
        )}

        <DataTable
          rows={pendingOrders}
          loading={orders.isLoading}
          rowKey={(row) => row.id}
          searchValue={(row) =>
            `${row.order_no} ${row.fabric_roll_id} ${row.status}`
          }
          emptyTitle="No batches awaiting verification"
          columns={[
            {
              key: "order",
              title: "Order Number",
              render: (row) => (
                <strong className="font-semibold text-slate-900">
                  {row.order_no}
                </strong>
              ),
            },
            {
              key: "quantity",
              title: "Quantity",
              render: (row) => row.target_qty,
            },
            {
              key: "fabric",
              title: "Fabric Roll",
              render: (row) => row.fabric_roll_id,
            },
            {
              key: "created",
              title: "Created Date",
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
                  icon={<Eye size={17} />}
                  onClick={() => setSelected(row)}
                >
                  Verify Batch
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <VerificationModal
        order={selected}
        close={() => setSelected(null)}
      />
    </div>
  );
}