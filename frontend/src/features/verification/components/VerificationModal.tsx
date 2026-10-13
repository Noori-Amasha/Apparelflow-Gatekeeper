import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Save,
} from "lucide-react";

import { verificationApi } from "../api/verification.api";
import { useToast } from "../../../app/providers/ToastProvider";
import { apiError } from "../../../lib/api";

import type {
  CuttingOrder,
  VerificationItem,
} from "../../../types/production";

import Button from "../../../components/ui/Button";
import StatusBadge from "../../../components/ui/StatusBadge";
import Modal from "../../../components/common/Modal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

function CountRow({
  item,
  onSave,
  onDirtyChange,
  saving,
}: {
  item: VerificationItem;
  onSave: (id: string, qty: number) => void;
  onDirtyChange: (id: string, dirty: boolean) => void;
  saving: boolean;
}) {

  const [value, setValue] = useState(
    String(item.actual_qty ?? "")
  );

  const expected = Number(item.expected_qty);

  const actual =
    value.trim() === ""
      ? null
      : Number(value);

  const valid =
    actual !== null &&
    Number.isSafeInteger(actual) &&
    actual >= 0;

  const changed =
    valid &&
    actual !== Number(item.actual_qty);

  const status =
    valid
      ? actual < expected
        ? "RED"
        : actual > expected
          ? "YELLOW"
          : "GREEN"
      : null;

  useEffect(() => {

    setValue(
      String(item.actual_qty ?? "")
    );

  }, [
    item.actual_qty,
    item.id
  ]);

  return (
    <div className="
      rounded-2xl
      border border-slate-200
      p-4
    ">
      <div className="
        flex flex-wrap
        items-center
        justify-between
        gap-2
      ">
        <div>
          <h4 className="
            font-bold
            text-slate-900
          ">
            {item.component_name ?? "Component"}
          </h4>
          <p className="
            text-sm
            text-slate-500
          ">
            Expected:
            <strong>
              {" "}
              {expected} pieces
            </strong>
          </p>
        </div>
        {
          status
          ?
          <StatusBadge status={status}/>
          :
          <span className="
            text-xs
            font-semibold
            text-slate-500
          ">
            Uncounted
          </span>
        }
      </div>
      <div className="
        mt-4
        flex
        items-end
        gap-3
      ">
        <div className="
          flex-1
        ">
          <label
            htmlFor={`count-${item.id}`}
            className="
              mb-2
              block
              text-sm
              font-semibold
              text-slate-700
            "
          >
            Actual Pieces Counted
          </label>
          <input
            id={`count-${item.id}`}
            type="number"
            min="0"
            step="1"
            value={value}
            onChange={(event)=>{
              const newValue =
                event.target.value;


              setValue(newValue);
              onDirtyChange(
                item.id,
                newValue !==
                String(item.actual_qty ?? "")
              );

            }}
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              text-slate-900

              focus:border-primary-500
              focus:outline-none
              focus:ring-4
              focus:ring-primary-100
            "
          />
        </div>
        <Button

          icon={<Save size={17}/>}
          loading={saving}
          disabled={
            !valid ||
            !changed
          }
          onClick={()=>{

            onDirtyChange(
              item.id,
              false
            );
            onSave(
              item.id,
              actual!
            );

          }}
        >
          Save Count
        </Button>
      </div>
      {
        value !== "" &&
        !valid &&
        <p className="
          mt-2
          text-xs
          text-red-600
        ">
          Enter a valid whole number.
        </p>
      }
      {
        valid &&
        actual! < expected &&
        <div className="
          mt-3
          flex
          items-center
          gap-2
          rounded-xl
          bg-red-50
          p-3
          text-sm
          font-semibold
          text-red-700
        ">
          <AlertTriangle size={17}/>
          Shortage of {expected - actual!} pieces.
          Approval blocked.
        </div>
      }
      {
        valid &&
        actual! > expected &&
        <p className="
          mt-3
          text-sm
          text-amber-700
        ">
          Excess:
          {" "}
          {actual! - expected}
          {" "}
          pieces
        </p>

      }

      {
        changed &&
        <p className="
          mt-2
          text-xs
          text-amber-700
        ">
          Unsaved count. Save before approval.
        </p>
      }
    </div>
  );

}

export default function VerificationModal({
  order,
  close,
}:{
  order: CuttingOrder | null;
  close:()=>void;

}) {
  const queryClient =
    useQueryClient();
  const {notify} =
    useToast();
  const [
    confirmApprove,
    setConfirmApprove
  ] =
    useState(false);
  const [
    rejecting,
    setRejecting
  ] =
    useState(false);
  const [
    reason,
    setReason
  ] =
    useState("");
  const [
    savingId,
    setSavingId
  ] =
    useState<string | null>(null);
  const [
    unsaved,
    setUnsaved
  ] =
    useState<Record<string,boolean>>({});
  const details =
    useQuery({
      queryKey:[
        "verification-detail",
        order?.id
      ],
      queryFn:()=> 
        verificationApi.detail(
          order!.id
        ),
      enabled:Boolean(order)
    });
  const refresh = async()=>{
    await queryClient.invalidateQueries({
      queryKey:[
        "verification-detail"
      ]
    });
    await queryClient.invalidateQueries({
      queryKey:[
        "verification-queue"
      ]
    });
  };

  const countMutation =
    useMutation({
      mutationFn:({
        id,
        qty
      }:{
        id:string;
        qty:number;
      })=>
        verificationApi.count(
          order!.id,
          id,
          qty
        ),
      onMutate:({id})=>
        setSavingId(id),
      onSuccess:async()=>{

        await refresh();

        notify(
          "Component count saved",
          "success"
        );
      },

      onError:(error)=>
        notify(
          apiError(error),
          "error"
        ),
      onSettled:()=>
        setSavingId(null)
    });

  const approve =
    useMutation({
      mutationFn:()=> 
        verificationApi.approve(
          order!.id
        ),
      onSuccess:async()=>{
        await refresh();
        notify(
          "Batch verified successfully",
          "success"
        );
        setConfirmApprove(false);
        close();

      },
      onError:(error)=>{
        notify(
          apiError(error),
          "error"
        );
        setConfirmApprove(false);
      }
    });

  const reject =
    useMutation({
      mutationFn:()=> 
        verificationApi.reject(
          order!.id,
          reason.trim()
        ),
      onSuccess:async()=>{
        await refresh();
        notify(
          "Batch rejected",
          "success"
        );
        setRejecting(false);
        setReason("");
        close();

      },
      onError:(error)=>
        notify(
          apiError(error),
          "error"
        )

    });

  const items =
    details.data?.items ?? [];

  const uncounted =
    items.filter(
      item=>item.actual_qty===null
    ).length;

  const shortages =
    items.filter(
      item=>
        item.actual_qty !== null &&
        Number(item.actual_qty)
        <
        Number(item.expected_qty)

    ).length;

  const canApprove =
    items.length > 0 &&
    uncounted === 0 &&
    shortages === 0 &&
    !Object.values(unsaved).some(Boolean) &&
    !countMutation.isPending;
  return (
    <>
      <Modal
        open={Boolean(order)}
        title={
          order
          ?
          `Verify ${order.order_no}`
          :
          "Verify"
        }
        onClose={close}
        wide
      >
        {
          details.isLoading &&

          <p>
            Loading components...
          </p>

        }
        {
          details.data &&
          <div className="
            space-y-5
          ">
            <div className="
              grid
              gap-3
              sm:grid-cols-3
            ">
              <div className="
                rounded-xl
                bg-blue-50
                p-4
              ">
                Components
                <strong className="
                  block
                  text-2xl
                ">
                  {items.length}
                </strong>
              </div>
              <div className="
                rounded-xl
                bg-amber-50
                p-4
              ">
                Uncounted
                <strong className="
                  block
                  text-2xl
                ">
                  {uncounted}
                </strong>
              </div>
              <div className="
                rounded-xl
                bg-red-50
                p-4
              ">
                Shortages
                <strong className="
                  block
                  text-2xl
                ">
                  {shortages}
                </strong>
              </div>
            </div>
            {
              items.map(item=>(
                <CountRow
                  key={item.id}
                  item={item}
                  onDirtyChange={
                    (id,dirty)=>
                    setUnsaved(
                      current=>({

                        ...current,

                        [id]:dirty

                      })
                    )

                  }
                  onSave={
                    (id,qty)=>
                    countMutation.mutate({
                      id,
                      qty
                    })

                  }
                  saving={
                    savingId===item.id
                  }

                />

              ))
            }
            <div className="
              flex
              justify-end
              gap-3
            ">
              <Button
                variant="outline"
                onClick={close}
              >
                Close
              </Button>
              <Button
                variant="danger"
                onClick={()=>
                  setRejecting(true)
                }
              >
                Reject
              </Button>
              <Button
                icon={
                  <ClipboardCheck size={18}/>
                }
                disabled={!canApprove}
                onClick={()=>
                  setConfirmApprove(true)
                }
              >
                Approve
              </Button>
            </div>
          </div>
        }
      </Modal>
      {
        confirmApprove &&
        <ConfirmDialog
          title="Approve batch?"
          description="
          This will release the batch to sewing.
          "
          confirmLabel="Approve"
          loading={
            approve.isPending
          }
          onCancel={()=>
            setConfirmApprove(false)
          }
          onConfirm={()=>
            approve.mutate()
          }
        />
      }
      <Modal
        open={rejecting}
        title="Reject Batch"
        onClose={()=>
          setRejecting(false)
        }
      >
        <textarea
          value={reason}
          onChange={
            e=>setReason(
              e.target.value
            )
          }
          rows={4}
          className="
          w-full
          rounded-xl
          border
          p-3
          "
          placeholder="
          Enter rejection reason
          "
        />
        <div className="
          mt-5
          flex
          justify-end
          gap-3
        ">
          <Button
            variant="outline"
            onClick={()=>
              setRejecting(false)
            }
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={
              !reason.trim()
            }
            loading={
              reject.isPending
            }
            onClick={()=>
              reject.mutate()
            }

          >
            Reject
          </Button>
        </div>
      </Modal>
    </>
  );
}