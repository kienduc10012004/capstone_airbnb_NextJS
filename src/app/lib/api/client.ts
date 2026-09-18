import axios, { AxiosError } from "axios";

type StoredSession = {
  content?: {
    token?: string;
  };
};
  
export const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    accept: "application/json",
    tokenCybersoft: process.env.NEXT_PUBLIC_TOKEN_CYBERSOFT ?? "",
  },
});

axiosClient.interceptors.request.use((config) => {
  if (typeof window === "undefined" || config.headers.token) {
    return config;
  }

  const rawSession = window.localStorage.getItem("user");
  if (!rawSession) {
    return config;
  }

  try {
    const session = JSON.parse(rawSession) as StoredSession;
    if (session.content?.token) {
      config.headers.token = session.content.token;
    }
  } catch {
    window.localStorage.removeItem("user");
  }

  return config;
});

type ApiErrorBody = {
  content?: string;
  message?: string;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Đã có lỗi xảy ra. Vui lòng thử lại.",
): string => {
  if (!(error instanceof AxiosError)) {
    if (
      error instanceof Error &&
      error.message &&
      !error.message.includes("AxiosError") &&
      !error.message.includes("Network Error")
    ) {
      return error.message;
    }
    return fallback;
  }

  // Trường hợp không có response từ máy chủ (mất mạng, timeout, server tắt)
  if (!error.response) {
    if (
      error.code === "ECONNABORTED" ||
      error.message.toLowerCase().includes("timeout")
    ) {
      return "Kết nối đến máy chủ bị quá thời gian. Vui lòng thử lại.";
    }
    return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.";
  }

  const status = error.response.status;
  const data = error.response.data as ApiErrorBody | string | undefined;

  let rawMessage = "";
  if (typeof data === "string") {
    rawMessage = data.trim();
  } else if (data && typeof data === "object") {
    rawMessage = (data.content || data.message || "").trim();
  }

  // Loại bỏ nếu backend trả về trang HTML thô (ví dụ: lỗi 502/504 Bad Gateway)
  if (
    rawMessage.startsWith("<") ||
    rawMessage.toLowerCase().includes("<!doctype") ||
    rawMessage.toLowerCase().includes("<html")
  ) {
    rawMessage = "";
  }

  // Ánh xạ lỗi trùng email phổ biến từ CyberSoft backend thành thông báo dễ hiểu
  const lowerMessage = rawMessage.toLowerCase();
  if (
    lowerMessage.includes("email đã tồn tại") ||
    lowerMessage.includes("email đã được sử dụng") ||
    lowerMessage.includes("email already exists")
  ) {
    return "Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.";
  }

  // Chuẩn hóa định dạng nếu có nội dung hợp lệ từ backend
  if (rawMessage) {
    return rawMessage.replace(/\s+!+$/, ".").replace(/!+$/, ".").trim();
  }

  // Ánh xạ theo HTTP Status Code nếu không có body message
  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn hoặc không có quyền truy cập.";
  }
  if (status === 403) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }
  if (status === 404) {
    return "Không tìm thấy dữ liệu yêu cầu.";
  }
  if (status >= 500) {
    return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.";
  }

  return fallback;
};

export const isApiNotFoundError = (error: unknown) =>
  error instanceof AxiosError &&
  (error.response?.status === 404 || error.response?.status === 400);
