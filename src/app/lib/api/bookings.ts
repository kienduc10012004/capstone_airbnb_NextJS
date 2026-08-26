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

export type BookingPayload = {
  id?: number;
  maPhong: number;
  ngayDen: string;
  ngayDi: string;
  soLuongKhach: number;
  maNguoiDung: number;
};

export const getBookings = async () => {
  const { data } =
    await axiosClient.get<ApiEnvelope<ApiBooking[]>>("/dat-phong");
  return data;
};

export const getBookingById = async (id: number) => {
  const numericId = Number(id);
  const { data } = await axiosClient.get<ApiEnvelope<ApiBooking>>(
    `/dat-phong/${numericId}`,
  );
  return data.content;
};

export const getBookingsByUser = async (userId: number) => {
  const numericUserId = Number(userId);
  const { data } = await axiosClient.get<ApiEnvelope<ApiBooking[]>>(
    `/dat-phong/lay-theo-nguoi-dung/${numericUserId}`,
  );
  return data;
};

export const createBooking = async (payload: BookingPayload) => {
  const safePayload: BookingPayload = {
    id: typeof payload.id === "number" ? Number(payload.id) : 0,
    maNguoiDung: Number(payload.maNguoiDung),
    maPhong: Number(payload.maPhong),
    ngayDen: String(payload.ngayDen),
    ngayDi: String(payload.ngayDi),
    soLuongKhach: Number(payload.soLuongKhach),
  };

  const { data } = await axiosClient.post<ApiEnvelope<ApiBooking>>(
    "/dat-phong",
    safePayload,
  );
  return data;
};

export const updateBooking = async (id: number, payload: BookingPayload) => {
  const numericId = Number(id);
  const safePayload: BookingPayload = {
    id: numericId,
    maNguoiDung: Number(payload.maNguoiDung),
    maPhong: Number(payload.maPhong),
    ngayDen: String(payload.ngayDen),
    ngayDi: String(payload.ngayDi),
    soLuongKhach: Number(payload.soLuongKhach),
  };

  const { data } = await axiosClient.put<ApiEnvelope<ApiBooking>>(
    `/dat-phong/${numericId}`,
    safePayload,
  );
  return data;
};

export const deleteBooking = async (id: number) => {
  const numericId = Number(id);
  const { data } = await axiosClient.delete<ApiEnvelope<string>>(
    `/dat-phong/${numericId}`,
  );
  return data;
};
