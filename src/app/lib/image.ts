export const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;

export const getImageValidationMessage = (file: File) => {
  if (!file.type.startsWith("image/")) {
    return "Vui lòng chọn đúng định dạng hình ảnh.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Hình ảnh phải có dung lượng dưới 1MB.";
  }
  return null;
};

export const getImageSource = (value?: string | null) => {
  const source = value?.trim();
  if (!source) {
    return null;
  }
  if (
    source.startsWith("http://") ||
    source.startsWith("https://") ||
    source.startsWith("data:")
  ) {
    return source;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "");
  if (!apiUrl) {
    return null;
  }

  if (source.startsWith("/")) {
    return `${apiUrl}${source}`;
  }

  return `${apiUrl}/images/${encodeURIComponent(source)}`;
};
