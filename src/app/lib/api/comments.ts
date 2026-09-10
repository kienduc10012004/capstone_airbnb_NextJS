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

type ApiRoomComment = Omit<ApiComment, "maPhong" | "maNguoiBinhLuan"> & {
  maPhong: number | null;
  maNguoiBinhLuan: number | null;
};

const toPositiveInteger = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : 0;
};

const normalizeRoomComments = (
  comments: ApiRoomComment[],
  roomId: number,
  fullCommentById = new Map<number, ApiComment>(),
): ApiComment[] =>
  comments.map((comment) => {
    const fullComment = fullCommentById.get(comment.id);

    return {
      ...comment,
      avatar: comment.avatar || fullComment?.avatar,
      maPhong:
        toPositiveInteger(comment.maPhong) ||
        toPositiveInteger(fullComment?.maPhong) ||
        roomId,
      maNguoiBinhLuan:
        toPositiveInteger(comment.maNguoiBinhLuan) ||
        toPositiveInteger(fullComment?.maNguoiBinhLuan),
      tenNguoiBinhLuan:
        comment.tenNguoiBinhLuan || fullComment?.tenNguoiBinhLuan,
    };
  });

export const getComments = async () => {
  const { data } =
    await axiosClient.get<ApiEnvelope<ApiComment[]>>("/binh-luan");
  return data;
};

export const getCommentsByRoom = async (roomId: number) => {
  const numericRoomId = Number(roomId);
  const { data } = await axiosClient.get<ApiEnvelope<ApiRoomComment[]>>(
    `/binh-luan/lay-binh-luan-theo-phong/${numericRoomId}`,
  );

  const hasMissingOwner = data.content.some(
    (comment) => !toPositiveInteger(comment.maNguoiBinhLuan),
  );
  if (!hasMissingOwner) {
    return {
      ...data,
      content: normalizeRoomComments(data.content, numericRoomId),
    };
  }

  try {
    const allCommentsResponse = await getComments();
    const fullCommentById = new Map(
      allCommentsResponse.content.map((comment) => [comment.id, comment]),
    );

    return {
      ...data,
      content: normalizeRoomComments(
        data.content,
        numericRoomId,
        fullCommentById,
      ),
    };
  } catch {
    return {
      ...data,
      content: normalizeRoomComments(data.content, numericRoomId),
    };
  }
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
