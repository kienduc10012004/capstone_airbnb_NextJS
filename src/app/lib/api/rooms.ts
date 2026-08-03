import { axiosClient } from "@/app/lib/api/client";
import type { ApiEnvelope, PaginatedData } from "@/app/lib/api/types";

export type ApiRoom = {
  id: number;
  tenPhong: string;
  khach: number;
  phongNgu: number;
  giuong: number;
  phongTam: number;
  moTa: string;
  giaTien: number;
  mayGiat: boolean;
  banLa: boolean;
  tivi: boolean;
  dieuHoa: boolean;
  wifi: boolean;
  bep: boolean;
  doXe: boolean;
  hoBoi: boolean;
  banUi: boolean;
  maViTri: number;
  hinhAnh: string;
};

export type RoomPayload = Omit<ApiRoom, "id"> & { id?: number };

export const getAllRooms = async () => {
  const { data } = await axiosClient.get<ApiEnvelope<ApiRoom[]>>("/phong-thue");
  return data;
};

export const getRooms = async (pageIndex = 1, pageSize = 12, keyword = "") => {
  const { data } = await axiosClient.get<ApiEnvelope<PaginatedData<ApiRoom>>>(
    "/phong-thue/phan-trang-tim-kiem",
    {
      params: { pageIndex, pageSize, keyword: keyword || undefined },
    },
  );
  return data;
};

export const getRoomsByLocation = async (locationId: number) => {
  const { data } = await axiosClient.get<ApiEnvelope<ApiRoom[]>>(
    "/phong-thue/lay-phong-theo-vi-tri",
    { params: { maViTri: locationId } },
  );
  return data;
};

export const getRoomById = async (id: number) => {
  const { data } = await axiosClient.get<ApiEnvelope<ApiRoom>>(
    `/phong-thue/${id}`,
  );
  return data.content;
};

export const createRoom = async (payload: RoomPayload) => {
  const { data } = await axiosClient.post<ApiEnvelope<ApiRoom>>(
    "/phong-thue",
    payload,
  );
  return data;
};

export const updateRoom = async (id: number, payload: RoomPayload) => {
  const { data } = await axiosClient.put<ApiEnvelope<ApiRoom>>(
    `/phong-thue/${id}`,
    { ...payload, id },
  );
  return data;
};

export const deleteRoom = async (id: number) => {
  const { data } = await axiosClient.delete<ApiEnvelope<string>>(
    `/phong-thue/${id}`,
  );
  return data;
};

export const uploadRoomImage = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append("formFile", file);
  const { data } = await axiosClient.post<ApiEnvelope<ApiRoom>>(
    "/phong-thue/upload-hinh-phong",
    formData,
    { params: { maPhong: id } },
  );
  return data;
};
