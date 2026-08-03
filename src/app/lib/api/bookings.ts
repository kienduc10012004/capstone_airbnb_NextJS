import { axiosClient } from "@/app/lib/api/client";
import type { ApiEnvelope } from "@/app/lib/api/types";

export type ApiBooking = {
  id: number;
  maPhong: number;
  ngayDen: string;
  ngayDi: string;
  soLuongKhach: number;
  maNguoiDung: number;
};

export type BookingPayload = Omit<ApiBooking, "id"> & { id?: number };

export const getBookings = async () => {
  const { data } =
    await axiosClient.get<ApiEnvelope<ApiBooking[]>>("/dat-phong");
  return data;
};

export const getBookingById = async (id: number) => {
  const { data } = await axiosClient.get<ApiEnvelope<ApiBooking>>(
    `/dat-phong/${id}`,
  );
  return data.content;
};

export const getBookingsByUser = async (userId: number) => {
  const { data } = await axiosClient.get<ApiEnvelope<ApiBooking[]>>(
    `/dat-phong/lay-theo-nguoi-dung/${userId}`,
  );
  return data;
};

export const createBooking = async (payload: BookingPayload) => {
  const { data } = await axiosClient.post<ApiEnvelope<ApiBooking>>(
    "/dat-phong",
    payload,
  );
  return data;
};

export const updateBooking = async (id: number, payload: BookingPayload) => {
  const { data } = await axiosClient.put<ApiEnvelope<ApiBooking>>(
    `/dat-phong/${id}`,
    { ...payload, id },
  );
  return data;
};

export const deleteBooking = async (id: number) => {
  const { data } = await axiosClient.delete<ApiEnvelope<string>>(
    `/dat-phong/${id}`,
  );
  return data;
};
