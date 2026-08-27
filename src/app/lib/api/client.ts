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
) => {
  if (!(error instanceof AxiosError)) {
    return fallback;
  }

  const data = error.response?.data as ApiErrorBody | string | undefined;
  if (typeof data === "string") {
    return data.trim() || fallback;
  }

  return data?.content || data?.message || fallback;
};

export const isApiNotFoundError = (error: unknown) =>
  error instanceof AxiosError &&
  (error.response?.status === 404 || error.response?.status === 400);
