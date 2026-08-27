"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createComment,
  deleteComment,
  getBookingsByUser,
  getCommentsByRoom,
  updateComment,
  type CommentPayload,
} from "@/app/lib/api";

export const COMMENT_KEYS = {
  byRoom: (roomId: number) => ["comments", "room", roomId] as const,
  userBookings: (userId: number) => ["bookings", "user", userId] as const,
};

export const useUserBookingsQuery = (userId?: number) => {
  return useQuery({
    queryKey: COMMENT_KEYS.userBookings(userId || 0),
    queryFn: async () => {
      if (!userId) return [];
      const res = await getBookingsByUser(userId);
      return res.content || [];
    },
    enabled: Boolean(userId),
  });
};

export const useCommentsQuery = (roomId: number) => {
  return useQuery({
    queryKey: COMMENT_KEYS.byRoom(roomId),
    queryFn: async () => {
      const res = await getCommentsByRoom(roomId);
      return res.content;
    },
    enabled: Boolean(roomId),
  });
};

export const useCreateCommentMutation = (roomId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CommentPayload) => createComment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.byRoom(roomId) });
    },
  });
};

export const useUpdateCommentMutation = (roomId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CommentPayload }) =>
      updateComment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.byRoom(roomId) });
    },
  });
};

export const useDeleteCommentMutation = (roomId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.byRoom(roomId) });
    },
  });
};
