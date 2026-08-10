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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300">
        <i aria-hidden="true" className="fa-solid fa-shield-halved text-[10px]" />
        {eyebrow}
      </span>
      <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl tracking-tight">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
    {action}
  </div>
);

export default AdminPageHeader;
