import { AlertTriangle, CircleHelp } from "lucide-react";
import Button from "../ui/Button";
import Modal from "./Modal";

type Props = {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      open
      title={title}
      onClose={onCancel}
      busy={loading}
      footer={
        <>
          <Button variant="outline" disabled={loading} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className={`mb-4 inline-flex rounded-2xl p-3 ${
        danger ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
      }`}>
        {danger ? <AlertTriangle size={25} /> : <CircleHelp size={25} />}
      </div>
      <p className="text-sm leading-6 text-slate-600">{description}</p>
    </Modal>
  );
}
