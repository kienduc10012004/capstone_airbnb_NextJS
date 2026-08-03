import { axiosClient } from "@/app/lib/api/client";
import type { ApiEnvelope } from "@/app/lib/api/types";

export type ApiComment = {
  id: number;
  maPhong: number;
  maNguoiBinhLuan: number;
  ngayBinhLuan: string;
  noiDung: string;
  saoBinhLuan: number;
  tenNguoiBinhLuan?: string;
  avatar?: string;
};

export type CommentPayload = Omit<
  ApiComment,
  "id" | "tenNguoiBinhLuan" | "avatar"
> & {
  id?: number;
};

export const getComments = async () => {
  const { data } =
    await axiosClient.get<ApiEnvelope<ApiComment[]>>("/binh-luan");
  return data;
};

export const getCommentsByRoom = async (roomId: number) => {
  const { data } = await axiosClient.get<ApiEnvelope<ApiComment[]>>(
    `/binh-luan/lay-binh-luan-theo-phong/${roomId}`,
  );
  return data;
};

export const createComment = async (payload: CommentPayload) => {
  const { data } = await axiosClient.post<ApiEnvelope<ApiComment>>(
    "/binh-luan",
    payload,
  );
  return data;
};

export const updateComment = async (id: number, payload: CommentPayload) => {
  const { data } = await axiosClient.put<ApiEnvelope<ApiComment>>(
    `/binh-luan/${id}`,
    { ...payload, id },
  );
  return data;
};

export const deleteComment = async (id: number) => {
  const { data } = await axiosClient.delete<ApiEnvelope<string>>(
    `/binh-luan/${id}`,
  );
  return data;
};
