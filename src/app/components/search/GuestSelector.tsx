"use client";

import {
  getStayGuestCount,
  MAX_INFANTS,
  MAX_PETS,
  MAX_STAY_GUESTS,
  normalizeGuestSelection,
  type GuestSelection,
  type SearchSelectorVariant,
} from "@/app/components/search/types";
import { uiClassNames } from "@/app/lib/styles";

type GuestSelectorProps = {
  active: boolean;
  value: GuestSelection;
  variant: SearchSelectorVariant;
  onActivate: () => void;
  onChange: (value: GuestSelection) => void;
};

type GuestRowProps = {
  decreaseDisabled?: boolean;
  description: string;
  increaseDisabled?: boolean;
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
};

const GuestRow = ({
  decreaseDisabled = false,
  description,
  increaseDisabled = false,
  label,
  onDecrease,
  onIncrease,
  value,
}: GuestRowProps) => (
  <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-4 last:border-0">
    <div>
      <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
    <div className="flex items-center gap-3">
      <button
        aria-label={`Giảm ${label}`}
        className="grid h-8 w-8 place-items-center rounded-full border border-gray-300 text-lg text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
        disabled={value === 0 || decreaseDisabled}
        type="button"
        onClick={onDecrease}
      >
        −
      </button>
      <span className="w-5 text-center text-sm">{value}</span>
      <button
        aria-label={`Tăng ${label}`}
        className="grid h-8 w-8 place-items-center rounded-full border border-gray-300 text-lg text-gray-600 hover:border-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
        disabled={increaseDisabled}
        type="button"
        onClick={onIncrease}
      >
        +
      </button>
    </div>
  </div>
);

const GuestSelector = ({
  active,
  onActivate,
  onChange,
  value,
  variant,
}: GuestSelectorProps) => {
  const totalGuests = getStayGuestCount(value);
  const hasDependentGuests =
    value.children > 0 || value.infants > 0 || value.pets > 0;
  const detailParts = [
    totalGuests ? `${totalGuests} khách` : "",
    value.infants ? `${value.infants} em bé` : "",
    value.pets ? `${value.pets} thú cưng` : "",
  ].filter(Boolean);
  const valueLabel = detailParts.join(", ") || "Thêm khách";

  const update = (key: keyof GuestSelection, amount: number) => {
    if (
      key === "adults" &&
      amount < 0 &&
      value.adults === 1 &&
      hasDependentGuests
    ) {
      return;
    }

    const nextValue = { ...value, [key]: value[key] + amount };
    if (amount > 0 && key !== "adults" && nextValue.adults === 0) {
      nextValue.adults = 1;
    }

    onChange(normalizeGuestSelection(nextValue));
  };

  const content = (
    <div className="px-5 py-2 sm:px-6">
      <GuestRow
        decreaseDisabled={value.adults === 1 && hasDependentGuests}
        description="Từ 13 tuổi trở lên"
        increaseDisabled={totalGuests >= MAX_STAY_GUESTS}
        label="Người lớn"
        value={value.adults}
        onDecrease={() => update("adults", -1)}
        onIncrease={() => update("adults", 1)}
      />
      <GuestRow
        description="Độ tuổi 2–12"
        increaseDisabled={totalGuests >= MAX_STAY_GUESTS}
        label="Trẻ em"
        value={value.children}
        onDecrease={() => update("children", -1)}
        onIncrease={() => update("children", 1)}
      />
      <GuestRow
        description="Dưới 2 tuổi"
        increaseDisabled={value.infants >= MAX_INFANTS}
        label="Em bé"
        value={value.infants}
        onDecrease={() => update("infants", -1)}
        onIncrease={() => update("infants", 1)}
      />
      <GuestRow
        description="Bạn sẽ mang theo động vật phục vụ?"
        increaseDisabled={value.pets >= MAX_PETS}
        label="Thú cưng"
        value={value.pets}
        onDecrease={() => update("pets", -1)}
        onIncrease={() => update("pets", 1)}
      />
      <p className="py-3 text-xs leading-5 text-gray-500 dark:text-slate-400">
        Em bé và thú cưng không tính vào tổng số khách. Mỗi phòng được chọn tối
        đa {MAX_INFANTS} em bé và {MAX_PETS} thú cưng.
      </p>
    </div>
  );

  if (variant === "mobile") {
    return (
      <section
        className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
          active ? "border-gray-200 shadow-lg" : "border-gray-200"
        }`}
      >
        <button
          className="flex w-full items-center justify-between px-5 py-5 text-left"
          type="button"
          onClick={onActivate}
        >
          <span className="text-sm font-semibold text-gray-500">Khách</span>
          <span className="max-w-52 truncate text-sm font-semibold text-gray-900">
            {valueLabel}
          </span>
        </button>
        {active && <div className="border-t border-gray-100">{content}</div>}
      </section>
    );
  }

  return (
    <div className="relative min-w-0 flex-1">
      <button
        className={`search-segment relative z-10 w-full rounded-full px-6 py-3.5 pr-20 text-left transition-colors duration-200 ${
          active
            ? "bg-rose-50 dark:bg-white/[0.06]"
            : "hover:bg-gray-100/60 dark:hover:bg-white/[0.04]"
        }`}
        type="button"
        onClick={onActivate}
      >
        <span className="block text-xs font-semibold text-gray-900">Khách</span>
        <span className="mt-0.5 block truncate text-sm text-gray-500">
          {valueLabel}
        </span>
      </button>
      {active && (
        <div
          className={`${uiClassNames.popoverMotion} absolute top-[calc(100%+14px)] right-0 z-30 w-[min(400px,calc(100vw-32px))] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default GuestSelector;
