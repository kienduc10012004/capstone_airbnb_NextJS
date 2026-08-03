import Link from "next/link";

type PaginationItem = number | "end-ellipsis" | "start-ellipsis";

type PaginationBaseProps = {
  ariaLabel?: string;
  currentPage: number;
  totalPages: number;
};

type PaginationProps = PaginationBaseProps &
  (
    | {
        getHref: (page: number) => string;
        onChange?: never;
      }
    | {
        getHref?: never;
        onChange: (page: number) => Promise<void> | void;
      }
  );

const getPaginationItems = (
  currentPage: number,
  totalPages: number,
): PaginationItem[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "end-ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "start-ellipsis",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ];
};

const getMobilePaginationItems = (
  currentPage: number,
  totalPages: number,
): PaginationItem[] => {
  if (totalPages <= 5) {
    return getPaginationItems(currentPage, totalPages);
  }

  if (currentPage <= 2) {
    return [1, 2, "end-ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 1) {
    return [1, "start-ellipsis", totalPages - 1, totalPages];
  }

  return [1, "start-ellipsis", currentPage, "end-ellipsis", totalPages];
};

const pageClassName =
  "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition-colors duration-200 sm:size-10";

const Pagination = ({
  ariaLabel = "Phân trang",
  currentPage,
  getHref,
  onChange,
  totalPages,
}: PaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const desktopItems = getPaginationItems(safeCurrentPage, totalPages);
  const mobileItems = getMobilePaginationItems(safeCurrentPage, totalPages);

  const renderPageItems = (items: PaginationItem[]) =>
    items.map((item) => {
      if (typeof item !== "number") {
        return (
          <span
            aria-hidden="true"
            className="inline-flex size-6 shrink-0 items-center justify-center text-gray-400 sm:size-10"
            key={item}
          >
            …
          </span>
        );
      }

      const isActive = item === safeCurrentPage;
      const className = `${pageClassName} ${
        isActive
          ? "border-rose-500 bg-rose-500 text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
      }`;

      if (getHref) {
        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            aria-label={`Trang ${item}`}
            className={className}
            href={getHref(item)}
            key={item}
          >
            {item}
          </Link>
        );
      }

      return (
        <button
          aria-current={isActive ? "page" : undefined}
          aria-label={`Trang ${item}`}
          className={className}
          disabled={isActive}
          key={item}
          type="button"
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      );
    });

  const previousPage = safeCurrentPage - 1;
  const nextPage = safeCurrentPage + 1;
  const previousDisabled = safeCurrentPage === 1;
  const nextDisabled = safeCurrentPage === totalPages;
  const navigationClassName = `${pageClassName} gap-1 px-3 sm:w-auto sm:px-4`;
  const disabledClassName = `${navigationClassName} cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300`;
  const enabledClassName = `${navigationClassName} border-gray-200 bg-white text-gray-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600`;

  return (
    <nav
      aria-label={ariaLabel}
      className="mt-10 flex items-center justify-center gap-1.5 sm:gap-2"
    >
      {previousDisabled ? (
        <span aria-disabled="true" className={disabledClassName}>
          <i aria-hidden="true" className="fa-solid fa-chevron-left" />
          <span className="hidden sm:inline">Trước</span>
        </span>
      ) : getHref ? (
        <Link
          aria-label="Trang trước"
          className={enabledClassName}
          href={getHref(previousPage)}
        >
          <i aria-hidden="true" className="fa-solid fa-chevron-left" />
          <span className="hidden sm:inline">Trước</span>
        </Link>
      ) : (
        <button
          aria-label="Trang trước"
          className={enabledClassName}
          type="button"
          onClick={() => onChange(previousPage)}
        >
          <i aria-hidden="true" className="fa-solid fa-chevron-left" />
          <span className="hidden sm:inline">Trước</span>
        </button>
      )}

      <div className="flex items-center gap-1 sm:hidden">
        {renderPageItems(mobileItems)}
      </div>
      <div className="hidden items-center gap-1 sm:flex">
        {renderPageItems(desktopItems)}
      </div>

      {nextDisabled ? (
        <span aria-disabled="true" className={disabledClassName}>
          <span className="hidden sm:inline">Sau</span>
          <i aria-hidden="true" className="fa-solid fa-chevron-right" />
        </span>
      ) : getHref ? (
        <Link
          aria-label="Trang sau"
          className={enabledClassName}
          href={getHref(nextPage)}
        >
          <span className="hidden sm:inline">Sau</span>
          <i aria-hidden="true" className="fa-solid fa-chevron-right" />
        </Link>
      ) : (
        <button
          aria-label="Trang sau"
          className={enabledClassName}
          type="button"
          onClick={() => onChange(nextPage)}
        >
          <span className="hidden sm:inline">Sau</span>
          <i aria-hidden="true" className="fa-solid fa-chevron-right" />
        </button>
      )}
    </nav>
  );
};

export default Pagination;
