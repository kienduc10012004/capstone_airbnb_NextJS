"use client";

import ConfirmDialog from "@/app/components/ui/ConfirmDialog";

type DeleteConfirmDialogProps = {
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
    description={description}
    iconClassName="fa-solid fa-trash"
    iconContainerClassName="bg-red-50 text-red-600"
    loading={loading}
    open={open}
    title={title}
    onCancel={onCancel}
    onConfirm={onConfirm}
  />
);

export default DeleteConfirmDialog;
