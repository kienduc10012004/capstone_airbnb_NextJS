import type { ApiBooking } from "@/app/lib/api/bookings";
import type { ApiRoom } from "@/app/lib/api/rooms";
import { formatDateForInput } from "@/app/lib/date";

export type StayDateRange = {
  checkIn: string;
  checkOut: string;
};

export type BookingValidationErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_CAPACITY_EXCEEDED"
  | "INVALID_GUEST_COUNT"
  | "INVALID_CHECK_IN"
  | "INVALID_CHECK_OUT"
  | "BOOKING_DATE_CONFLICT"
  | "INVALID_USER"
  | "INVALID_REQUEST";

export type BookingValidationResult = {
  isValid: boolean;
  code?: BookingValidationErrorCode;
  message?: string;
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const normalizeDateKey = (value: string): string => {
  if (!value) return "";
  return value.slice(0, 10);
};

export const isValidDateKey = (value: string): boolean => {
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

/**
 * Kiểm tra xem 2 khoảng ngày lưu trú có bị trùng lặp (conflict) không
 * Công thức overlap chuẩn xác:
 * existingCheckIn < requestedCheckOut AND existingCheckOut > requestedCheckIn
 */
export const hasBookingConflict = (
  bookings: ApiBooking[],
  roomId: number,
  requestedRange: StayDateRange,
  excludeBookingId?: number,
): boolean => {
  if (!Array.isArray(bookings) || bookings.length === 0) return false;

  return bookings.some((booking) => {
    if (booking.maPhong !== roomId) return false;
    if (excludeBookingId && booking.id === excludeBookingId) return false;

    const bookedRange = getStayDateRange(booking.ngayDen, booking.ngayDi);
    if (!bookedRange) return false;

    return (
      requestedRange.checkIn < bookedRange.checkOut &&
      requestedRange.checkOut > bookedRange.checkIn
    );
  });
};

export const filterAvailableRooms = <Room extends { id: number }>(
  rooms: Room[],
  bookings: ApiBooking[],
  requestedRange: StayDateRange,
): Room[] =>
  rooms.filter(
    (room) => !hasBookingConflict(bookings, room.id, requestedRange),
  );

export type BookingRequestInput = {
  maPhong: number;
  ngayDen: string;
  ngayDi: string;
  soLuongKhach: number;
  maNguoiDung?: number;
};

/**
 * RÀ SOÁT & VALIDATE TOÀN DIỆN LUỒNG ĐẶT PHÒNG
 * 1. Nhóm A: Validation không phụ thuộc database (Format, Date, Số khách, Quá khứ, Overlap)
 * 2. Nhóm B: Validation dựa trên dữ liệu database thực tế (Sự tồn tại của phòng, Sức chứa maxGuests/khach)
 */
export const validateBookingBusinessRules = (
  room: ApiRoom | null | undefined,
  input: BookingRequestInput,
  existingBookings: ApiBooking[],
  excludeBookingId?: number,
): BookingValidationResult => {
  // 1. Kiểm tra mã phòng & mã người dùng
  if (!input || typeof input !== "object") {
    return {
      isValid: false,
      code: "INVALID_REQUEST",
      message: "Dữ liệu yêu cầu đặt phòng không hợp lệ.",
    };
  }

  if (
    typeof input.maPhong !== "number" ||
    !Number.isInteger(input.maPhong) ||
    input.maPhong <= 0
  ) {
    return {
      isValid: false,
      code: "INVALID_REQUEST",
      message: "Mã phòng không hợp lệ.",
    };
  }

  if (
    input.maNguoiDung !== undefined &&
    (typeof input.maNguoiDung !== "number" ||
      !Number.isInteger(input.maNguoiDung) ||
      input.maNguoiDung <= 0)
  ) {
    return {
      isValid: false,
      code: "INVALID_USER",
      message: "Tài khoản người dùng không hợp lệ hoặc phiên đăng nhập đã hết hạn.",
    };
  }

  // 2. Kiểm tra số lượng khách
  if (
    typeof input.soLuongKhach !== "number" ||
    Number.isNaN(input.soLuongKhach) ||
    !Number.isInteger(input.soLuongKhach) ||
    input.soLuongKhach < 1
  ) {
    return {
      isValid: false,
      code: "INVALID_GUEST_COUNT",
      message: "Số lượng khách phải là số nguyên lớn hơn hoặc bằng 1.",
    };
  }

  // 3. Kiểm tra định dạng ngày
  const checkInKey = normalizeDateKey(input.ngayDen);
  const checkOutKey = normalizeDateKey(input.ngayDi);

  if (!isValidDateKey(checkInKey)) {
    return {
      isValid: false,
      code: "INVALID_CHECK_IN",
      message: "Ngày nhận phòng không đúng định dạng ngày hợp lệ (YYYY-MM-DD).",
    };
  }

  if (!isValidDateKey(checkOutKey)) {
    return {
      isValid: false,
      code: "INVALID_CHECK_OUT",
      message: "Ngày trả phòng không đúng định dạng ngày hợp lệ (YYYY-MM-DD).",
    };
  }

  // 4. Kiểm tra ngày nhận không nằm trong quá khứ (theo ngày hiện tại)
  const todayKey = formatDateForInput(new Date());
  if (checkInKey < todayKey) {
    return {
      isValid: false,
      code: "INVALID_CHECK_IN",
      message: "Ngày nhận phòng không thể nằm trong quá khứ.",
    };
  }

  // 5. Kiểm tra ngày trả phải sau ngày nhận
  if (checkOutKey <= checkInKey) {
    return {
      isValid: false,
      code: "INVALID_CHECK_OUT",
      message: "Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.",
    };
  }

  const requestedRange: StayDateRange = {
    checkIn: checkInKey,
    checkOut: checkOutKey,
  };

  // 6. Kiểm tra Room từ database (Nhóm B)
  if (!room || typeof room !== "object" || !room.id) {
    return {
      isValid: false,
      code: "ROOM_NOT_FOUND",
      message: "Phòng lưu trú không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.",
    };
  }

  // 7. Kiểm tra sức chứa tối đa của phòng từ DB (room.khach)
  if (
    typeof room.khach === "number" &&
    Number.isInteger(room.khach) &&
    room.khach > 0 &&
    input.soLuongKhach > room.khach
  ) {
    return {
      isValid: false,
      code: "ROOM_CAPACITY_EXCEEDED",
      message: `Phòng chỉ cho phép tối đa ${room.khach} khách. Bạn đang chọn ${input.soLuongKhach} khách.`,
    };
  }

  // 8. Kiểm tra xung đột lịch đặt phòng (Overlap conflict & Race condition)
  if (
    hasBookingConflict(
      existingBookings,
      room.id,
      requestedRange,
      excludeBookingId,
    )
  ) {
    return {
      isValid: false,
      code: "BOOKING_DATE_CONFLICT",
      message:
        "Phòng đã có khách đặt trong khoảng thời gian bạn chọn. Vui lòng chọn khoảng ngày khác.",
    };
  }

  return { isValid: true };
};
