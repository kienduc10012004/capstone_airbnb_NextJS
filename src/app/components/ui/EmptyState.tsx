import type { ReactNode } from "react";

import { uiClassNames } from "@/app/lib/styles";

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: string;
  title: string;
};

const EmptyState = ({
  action,
  description,
  icon = "⌂",
  title,
}: EmptyStateProps) => (
  <div
    className={`${uiClassNames.surface} flex flex-col items-center px-6 py-14 text-center`}
  >
    <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-2xl text-rose-500">
      {icon}
    </div>
    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
    <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-slate-400">
      {description}
    </p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
