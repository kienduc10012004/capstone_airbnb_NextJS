export type SearchSection = "location" | "dates" | "guests" | null;

export type DateRange = {
  checkIn: string;
  checkOut: string;
};

export type GuestSelection = {
  adults: number;
  children: number;
  infants: number;
  pets: number;
};

export const MAX_STAY_GUESTS = 16;
export const MAX_INFANTS = 3;
export const MAX_PETS = 3;

type GuestSelectionInput = Partial<Record<keyof GuestSelection, unknown>>;

const normalizeCount = (value: unknown, maximum: number) => {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) return 0;

  return Math.min(Math.max(Math.trunc(parsedValue), 0), maximum);
};

export const normalizeGuestSelection = (
  value: GuestSelectionInput,
): GuestSelection => {
  let adults = normalizeCount(value.adults, MAX_STAY_GUESTS);
  let children = normalizeCount(value.children, MAX_STAY_GUESTS);
  const infants = normalizeCount(value.infants, MAX_INFANTS);
  const pets = normalizeCount(value.pets, MAX_PETS);

  const hasDependentGuests = children > 0 || infants > 0 || pets > 0;
  if (hasDependentGuests && adults === 0) {
    adults = 1;
  }

  children = Math.min(children, MAX_STAY_GUESTS - adults);

  return { adults, children, infants, pets };
};

export const getStayGuestCount = (value: GuestSelection) =>
  value.adults + value.children;

export type SearchSelectorVariant = "desktop" | "mobile";
