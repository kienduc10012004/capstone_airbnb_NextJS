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
  const { data } = await axiosClient.get<ApiEnvelope<ApiUser>>(`/users/${id}`);
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
  const { data } = await axiosClient.put<ApiEnvelope<ApiUser>>(`/users/${id}`, {
    ...safePayload,
    id,
  });
  return data;
};

export const deleteUser = async (id: number) => {
  const { data } = await axiosClient.delete<ApiEnvelope<string>>("/users", {
    params: { id },
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
