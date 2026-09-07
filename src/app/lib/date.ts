const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateKey = (value: string) => {
  if (!DATE_KEY_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const formatDateForInput = (value: Date | string) => {
  if (typeof value === "string") {
    const dateKey = value.slice(0, 10);
    if (isValidDateKey(dateKey)) return dateKey;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const toBookingDateISOString = (dateKey: string) => {
  if (!isValidDateKey(dateKey)) {
    throw new RangeError("Ngày đặt phòng không hợp lệ.");
  }

  return `${dateKey}T00:00:00.000Z`;
};
