import { axiosClient } from "@/app/lib/api/client";
import type {
  ApiEnvelope,
  PaginatedData,
  PaginationParams,
} from "@/app/lib/api/types";

export type ApiLocation = {
  id: number;
  tenViTri: string;
  tinhThanh: string;
  quocGia: string;
  hinhAnh: string;
};

export type LocationPayload = Omit<ApiLocation, "id"> & { id?: number };

export const getLocations = async () => {
  const { data } = await axiosClient.get<ApiEnvelope<ApiLocation[]>>("/vi-tri");
  return data;
};

export const getLocationsPaged = async (params: PaginationParams = {}) => {
  const { data } = await axiosClient.get<
    ApiEnvelope<PaginatedData<ApiLocation>>
  >("/vi-tri/phan-trang-tim-kiem", { params });
  return data;
};

export const getLocationById = async (id: number) => {
  const { data } = await axiosClient.get<ApiEnvelope<ApiLocation>>(
    `/vi-tri/${id}`,
  );
  return data.content;
};

export const createLocation = async (payload: LocationPayload) => {
  const { data } = await axiosClient.post<ApiEnvelope<ApiLocation>>(
    "/vi-tri",
    payload,
  );
  return data;
};

export const updateLocation = async (id: number, payload: LocationPayload) => {
  const { data } = await axiosClient.put<ApiEnvelope<ApiLocation>>(
    `/vi-tri/${id}`,
    { ...payload, id },
  );
  return data;
};

export const deleteLocation = async (id: number) => {
  const { data } = await axiosClient.delete<ApiEnvelope<string>>(
    `/vi-tri/${id}`,
  );
  return data;
};

export const uploadLocationImage = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append("formFile", file);
  const { data } = await axiosClient.post<ApiEnvelope<ApiLocation>>(
    "/vi-tri/upload-hinh-vitri",
    formData,
    { params: { maViTri: id } },
  );
  return data;
};
