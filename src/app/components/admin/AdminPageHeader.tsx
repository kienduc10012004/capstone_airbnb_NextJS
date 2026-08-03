import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  action?: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
};

const AdminPageHeader = ({
  action,
  description,
  eyebrow = "Quản trị hệ thống",
  title,
}: AdminPageHeaderProps) => (
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      <p className="text-sm font-semibold text-rose-500">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-500">{description}</p>
    </div>
    {action}
  </div>
);

export default AdminPageHeader;
