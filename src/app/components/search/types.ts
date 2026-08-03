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

export type SearchSelectorVariant = "desktop" | "mobile";
