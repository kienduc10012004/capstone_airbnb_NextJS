import { axiosClient } from "@/app/lib/api/client";
import type {
  ApiEnvelope,
  PaginatedData,
  PaginationParams,
} from "@/app/lib/api/types";

export type UserRole = "ADMIN" | "USER";

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone: string | null;
  birthday: string;
  avatar?: string;
  gender: boolean;
  role: UserRole | string;
};

export type UserPayload = {
  id?: number;
  name: string;
  email: string;
  password?: string;
  phone: string;
  birthday: string;
  gender: boolean;
  role: UserRole | string;
};

export const getUsers = async () => {
  const { data } = await axiosClient.get<ApiEnvelope<ApiUser[]>>("/users");
  return data;
};

export const getUsersPaged = async (params: PaginationParams = {}) => {
  const { data } = await axiosClient.get<ApiEnvelope<PaginatedData<ApiUser>>>(
    "/users/phan-trang-tim-kiem",
    { params },
  );
  return data;
};

export const getUserById = async (id: number) => {
  const numericId = Number(id);
  const { data } = await axiosClient.get<ApiEnvelope<ApiUser>>(`/users/${numericId}`);
  return data.content;
};

export const getUsersWithDetails = async (users: ApiUser[]) =>
  Promise.all(
    users.map(async (user) => {
      try {
        return await getUserById(user.id);
      } catch {
        return user;
      }
    }),
  );

export const searchUsersByName = async (name: string) => {
  const { data } = await axiosClient.get<ApiEnvelope<ApiUser[]>>(
    `/users/search/${encodeURIComponent(name)}`,
  );
  return data;
};

export const createUser = async (payload: UserPayload) => {
  const { data } = await axiosClient.post<ApiEnvelope<ApiUser>>(
    "/users",
    payload,
  );
  return data;
};

export const updateUser = async (id: number, payload: UserPayload) => {
  const safePayload = { ...payload };
  delete safePayload.password;
  const numericId = Number(id);

  try {
    const { data } = await axiosClient.put<ApiEnvelope<ApiUser>>(
      `/users/${numericId}`,
      {
        ...safePayload,
        id: numericId,
      },
    );
    return data;
  } catch (error: unknown) {
    // Nếu backend báo người dùng không tồn tại hoặc 404, thử tìm ID mới nhất của tài khoản theo email
    const axiosErr = error as { response?: { data?: { message?: string }; status?: number } };
    if (
      axiosErr?.response?.data?.message?.includes("không tồn tại") ||
      axiosErr?.response?.status === 404
    ) {
      try {
        const allUsers = await getUsers();
        const matched = allUsers.content.find(
          (u) =>
            u.email.toLowerCase() === payload.email.toLowerCase() ||
            (payload.phone && u.phone === payload.phone),
        );
        if (matched && matched.id !== numericId) {
          const { data } = await axiosClient.put<ApiEnvelope<ApiUser>>(
            `/users/${matched.id}`,
            {
              ...safePayload,
              id: matched.id,
            },
          );
          return data;
        }
      } catch {
        // Giữ nguyên lỗi ban đầu
      }
    }
    throw error;
  }
};

export const deleteUser = async (id: number) => {
  const numericId = Number(id);
  const { data } = await axiosClient.delete<ApiEnvelope<string>>("/users", {
    params: { id: numericId },
  });
  return data;
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("formFile", file);
  const { data } = await axiosClient.post<ApiEnvelope<ApiUser>>(
    "/users/upload-avatar",
    formData,
  );
  return data;
};
