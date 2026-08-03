import type { ApiBooking } from "@/app/lib/api/bookings";

export type StayDateRange = {
  checkIn: string;
  checkOut: string;
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDateKey = (value: string) => value.slice(0, 10);

const isValidDateKey = (value: string) => {
  const dateKey = normalizeDateKey(value);
  if (!DATE_KEY_PATTERN.test(dateKey)) return false;

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const getStayDateRange = (
  checkIn: string,
  checkOut: string,
): StayDateRange | null => {
  if (!isValidDateKey(checkIn) || !isValidDateKey(checkOut)) return null;

  const range = {
    checkIn: normalizeDateKey(checkIn),
    checkOut: normalizeDateKey(checkOut),
  };

  return range.checkIn < range.checkOut ? range : null;
};

export const hasBookingConflict = (
  bookings: ApiBooking[],
  roomId: number,
  requestedRange: StayDateRange,
) =>
  bookings.some((booking) => {
    if (booking.maPhong !== roomId) return false;

    const bookedRange = getStayDateRange(booking.ngayDen, booking.ngayDi);
    if (!bookedRange) return false;

    return (
      requestedRange.checkIn < bookedRange.checkOut &&
      requestedRange.checkOut > bookedRange.checkIn
    );
  });

export const filterAvailableRooms = <Room extends { id: number }>(
  rooms: Room[],
  bookings: ApiBooking[],
  requestedRange: StayDateRange,
) =>
  rooms.filter(
    (room) => !hasBookingConflict(bookings, room.id, requestedRange),
  );
