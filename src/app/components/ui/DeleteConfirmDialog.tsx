"use client";

import ConfirmDialog from "@/app/components/ui/ConfirmDialog";

type DeleteConfirmDialogProps = {
  countdownSeconds?: number;
  description: string;
  loading?: boolean;
  open: boolean;
  title?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const DeleteConfirmDialog = ({
  confirmLabel = "Xóa",
  countdownSeconds = 5,
  description,
  loading = false,
  onCancel,
  onConfirm,
  open,
  title = "Xác nhận xóa",
}: DeleteConfirmDialogProps) => (
  <ConfirmDialog
    confirmLabel={confirmLabel}
    confirmVariant="delete"
    countdownSeconds={countdownSeconds}
    description={description}
    iconClassName="fa-solid fa-trash"
    iconContainerClassName="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
    loading={loading}
    open={open}
    title={title}
    onCancel={onCancel}
    onConfirm={onConfirm}
  />
);

export default DeleteConfirmDialog;
