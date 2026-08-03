const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const formatBirthdayForInput = (birthday: string) => {
  if (DATE_INPUT_PATTERN.test(birthday)) {
    return birthday;
  }

  const parsedBirthday = new Date(birthday);
  if (Number.isNaN(parsedBirthday.getTime())) {
    return "";
  }

  const vietnamTime = new Date(parsedBirthday.getTime() + 7 * 60 * 60 * 1000);
  return vietnamTime.toISOString().slice(0, 10);
};

export const formatPhoneForInput = (phone?: string | null) =>
  (phone ?? "").replace(/\D/g, "");
