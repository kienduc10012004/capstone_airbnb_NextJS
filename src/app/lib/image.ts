export const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;

const CDN_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80",
];

export const getCdnFallbackImage = (index = 0) => {
  return CDN_FALLBACK_IMAGES[index % CDN_FALLBACK_IMAGES.length];
};

export const getImageValidationMessage = (file: File) => {
  if (!file.type.startsWith("image/")) {
    return "Vui lòng chọn đúng định dạng hình ảnh.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Hình ảnh phải có dung lượng dưới 1MB.";
  }
  return null;
};

export const getImageSource = (value?: string | null, fallbackIndex = 0) => {
  const source = value?.trim();
  if (!source) {
    return getCdnFallbackImage(fallbackIndex);
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
    return getCdnFallbackImage(fallbackIndex);
  }

  if (source.startsWith("/")) {
    return `${apiUrl}${source}`;
  }

  return `${apiUrl}/images/${encodeURIComponent(source)}`;
};
