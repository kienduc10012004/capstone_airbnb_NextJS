"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import Button from "@/app/components/ui/Button";
import DeleteConfirmDialog from "@/app/components/ui/DeleteConfirmDialog";
import EmptyState from "@/app/components/ui/EmptyState";
import ExpandableText from "@/app/components/ui/ExpandableText";
import StatusMessage from "@/app/components/ui/StatusMessage";
import {
  getApiErrorMessage,
  type ApiComment,
} from "@/app/lib/api";
import { commentSchema, type CommentFormData } from "@/app/lib/schemas";
import { uiClassNames } from "@/app/lib/styles";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useToastStore } from "@/app/store/useToastStore";

import {
  useCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useUserBookingsQuery,
} from "@/app/hooks/useComments";

const COMMENTS_BATCH_SIZE = 6;

const sortCommentsNewestFirst = (comments: ApiComment[]) =>
  [...comments].sort((firstComment, secondComment) => {
    const timeDifference =
      new Date(secondComment.ngayBinhLuan).getTime() -
      new Date(firstComment.ngayBinhLuan).getTime();

    return Number.isNaN(timeDifference)
      ? secondComment.id - firstComment.id
      : timeDifference || secondComment.id - firstComment.id;
  });

const Stars = ({ value }: { value: number }) => (
  <span aria-label={`${value} trên 5 sao`} className="text-amber-500">
    {"★".repeat(value)}
    <span className="text-gray-200">{"★".repeat(5 - value)}</span>
  </span>
);

type CommentsSectionProps = {
  initialComments: ApiComment[];
  roomId: number;
};

const CommentsSection = ({ initialComments, roomId }: CommentsSectionProps) => {
  const { data: fetchedComments } = useCommentsQuery(roomId);
  const createMutation = useCreateCommentMutation(roomId);
  const updateMutation = useUpdateCommentMutation(roomId);
  const deleteMutation = useDeleteCommentMutation(roomId);
  const user = useAuthStore((state) => state.user);
  const { data: userBookings } = useUserBookingsQuery(user?.id);

  const hasBookedRoom = useMemo(() => {
    if (!user || !userBookings) return false;
    return userBookings.some((booking) => booking.maPhong === roomId);
  }, [user, userBookings, roomId]);

  const canWriteReview = Boolean(
    user && (user.role === "ADMIN" || hasBookedRoom),
  );

  const comments = useMemo(() => {
    return sortCommentsNewestFirst(fetchedComments || initialComments);
  }, [fetchedComments, initialComments]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(
    null,
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(COMMENTS_BATCH_SIZE);
  const loadingMoreRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const showToast = useToastStore((state) => state.showToast);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { noiDung: "", saoBinhLuan: 5 },
  });

  const selectedStars = watch("saoBinhLuan") || 5;

  const averageRating = useMemo(() => {
    if (!comments.length) return 0;
    return (
      comments.reduce((total, comment) => total + comment.saoBinhLuan, 0) /
      comments.length
    );
  }, [comments]);
  const ratingCounts = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((rating) => ({
        count: comments.filter((comment) => comment.saoBinhLuan === rating)
          .length,
        rating,
      })),
    [comments],
  );

  //==== Infinite scrolling đánh giá: quan sát điểm cuối và tải thêm theo từng nhóm sau 2 giây ====
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= comments.length) {
      return;
    }

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    let observer: IntersectionObserver | null = null;

    const observeSentinel = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting || loadingMoreRef.current) {
            return;
          }

          observer?.unobserve(entry.target);
          loadingMoreRef.current = true;
          setLoadingMore(true);
          timerRef.current = window.setTimeout(() => {
            timerRef.current = null;
            setVisibleCount((current) =>
              Math.min(current + COMMENTS_BATCH_SIZE, comments.length),
            );
            loadingMoreRef.current = false;
            setLoadingMore(false);
          }, 2000);
        },
        {
          root: desktopQuery.matches ? scrollContainerRef.current : null,
          rootMargin: desktopQuery.matches
            ? "0px 0px 140px 0px"
            : "0px 0px 280px 0px",
        },
      );
      observer.observe(sentinel);
    };

    observeSentinel();
    desktopQuery.addEventListener("change", observeSentinel);

    return () => {
      observer?.disconnect();
      desktopQuery.removeEventListener("change", observeSentinel);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
        loadingMoreRef.current = false;
      }
    };
  }, [comments.length, visibleCount]);

  const submit = async (values: CommentFormData) => {
    setMessage(null);
    if (!user) {
      setMessage({
        text: "Vui lòng đăng nhập để gửi đánh giá.",
        type: "error",
      });
      return;
    }

    if (!canWriteReview && !editingId) {
      setMessage({
        text: "Bạn cần từng đặt phòng này để có thể viết đánh giá.",
        type: "error",
      });
      return;
    }

    const current = comments.find((comment) => comment.id === editingId);
    const payload = {
      id: editingId ?? 0,
      maNguoiBinhLuan: current?.maNguoiBinhLuan ?? user.id,
      maPhong: roomId,
      ngayBinhLuan: current?.ngayBinhLuan ?? new Date().toISOString(),
      noiDung: values.noiDung,
      saoBinhLuan: values.saoBinhLuan,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      reset({ noiDung: "", saoBinhLuan: 5 });
      setEditingId(null);
      setReviewFormOpen(false);
      setMessage(null);
      showToast(
        editingId ? "Đã cập nhật bình luận." : "Đã thêm đánh giá của bạn.",
        "success",
      );
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể lưu bình luận."),
        type: "error",
      });
    }
  };

  const startEditing = (comment: ApiComment) => {
    setEditingId(comment.id);
    setValue("noiDung", comment.noiDung);
    setValue("saoBinhLuan", comment.saoBinhLuan);
    setMessage(null);
    setReviewFormOpen(true);
  };

  //==== Xóa đánh giá: thực thi yêu cầu sau khi người dùng xác nhận ====
  const confirmRemove = async () => {
    if (!deletingCommentId) return;

    try {
      await deleteMutation.mutateAsync(deletingCommentId);
      setMessage(null);
      showToast("Đã xóa bình luận.", "success");
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể xóa bình luận."),
        type: "error",
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

  //==== Giao diện đánh giá: hiển thị thống kê, biểu mẫu và danh sách tải lười ====
  return (
    <section className="border-t border-gray-200 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Đánh giá từ khách hàng</h2>
          <p className="mt-2 text-sm text-gray-500">
            {comments.length
              ? `${averageRating.toFixed(1)} / 5 từ ${comments.length} đánh giá`
              : "Hãy là người đầu tiên chia sẻ trải nghiệm."}
          </p>
        </div>
        {comments.length > 0 && <Stars value={Math.round(averageRating)} />}
      </div>

      {comments.length > 0 && (
        <div className="mt-6 grid gap-6 rounded-2xl bg-gray-50 p-5 sm:grid-cols-[180px_1fr] sm:p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-5xl font-semibold tracking-tight text-gray-900">
              {averageRating.toFixed(1)}
            </p>
            <Stars value={Math.round(averageRating)} />
            <p className="mt-2 text-xs text-gray-500">
              {comments.length} đánh giá thực tế
            </p>
          </div>
          <div className="space-y-2">
            {ratingCounts.map(({ count, rating }) => (
              <div
                className="grid grid-cols-[28px_1fr_28px] items-center gap-3 text-xs"
                key={rating}
              >
                <span>{rating}★</span>
                <span className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <span
                    className="block h-full rounded-full bg-gray-900"
                    style={{
                      width: `${comments.length ? (count / comments.length) * 100 : 0}%`,
                    }}
                  />
                </span>
                <span className="text-right text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col items-end gap-2">
        {!canWriteReview && user && (
          <p className="text-xs font-medium text-rose-500">
            * Chỉ khách hàng đã từng đặt phòng này mới có thể viết đánh giá.
          </p>
        )}
        <Button
          variant={reviewFormOpen ? "secondary" : "create"}
          onClick={() => {
            if (!user) {
              setMessage({
                text: "Vui lòng đăng nhập để gửi đánh giá.",
                type: "error",
              });
              return;
            }
            if (!canWriteReview && !editingId) {
              setMessage({
                text: "Bạn cần từng đặt phòng này để có thể viết đánh giá.",
                type: "error",
              });
              return;
            }
            setReviewFormOpen((current) => !current);
          }}
        >
          {reviewFormOpen ? "Đóng biểu mẫu" : "Viết đánh giá"}
        </Button>
      </div>

      {message && !reviewFormOpen && (
        <div className="mt-4">
          <StatusMessage message={message.text} type={message.type} />
        </div>
      )}

      {reviewFormOpen && (
        <form
          className="mt-6 rounded-2xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1a2236] p-5 sm:p-6 shadow-sm space-y-4"
          onSubmit={handleSubmit(submit)}
        >
          {message && (
            <StatusMessage message={message.text} type={message.type} />
          )}

          {/* Header chọn số sao trực quan, cân đối */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {editingId ? "Chỉnh sửa đánh giá" : "Viết đánh giá mới"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Chọn số sao và chia sẻ cảm nhận trải nghiệm thực tế của bạn
              </p>
            </div>

            {/* Bộ chọn sao tương tác */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">Đánh giá:</span>
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-500/30 rounded-xl px-3 py-1.5 shadow-xs">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="text-lg transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    onClick={() => setValue("saoBinhLuan", star)}
                    title={`${star} sao`}
                  >
                    <span className={star <= selectedStars ? "text-amber-500" : "text-gray-300 dark:text-slate-600"}>
                      ★
                    </span>
                  </button>
                ))}
                <span className="ml-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  {selectedStars}/5 sao
                </span>
              </div>
              <input type="hidden" {...register("saoBinhLuan", { valueAsNumber: true })} />
            </div>
          </div>

          {/* Ô nhập nội dung trải rộng toàn bộ */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Nội dung đánh giá <span className="text-rose-500">*</span>
            </label>
            <textarea
              className={`${uiClassNames.field} min-h-24 w-full resize-y text-sm`}
              placeholder="Chia sẻ điều bạn thích về nơi ở này..."
              {...register("noiDung")}
            />
            {errors.noiDung && (
              <span className="mt-1 block text-xs font-semibold text-red-500">
                {errors.noiDung.message}
              </span>
            )}
          </div>

          {/* Nút hành động cân đối */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-gray-100 dark:border-white/10">
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Đánh giá của bạn sẽ được hiển thị công khai
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  reset({ noiDung: "", saoBinhLuan: 5 });
                  setReviewFormOpen(false);
                }}
              >
                Hủy
              </Button>
              <Button
                loading={isSubmitting}
                type="submit"
                variant={editingId ? "edit" : "create"}
              >
                {editingId ? "Lưu thay đổi" : "Gửi đánh giá"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {comments.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description="Chưa có khách hàng nào đánh giá phòng này."
            icon="★"
            title="Chưa có đánh giá"
          />
        </div>
      ) : (
        <div
          aria-label="Danh sách đánh giá"
          className="mt-8 lg:max-h-[600px] lg:overflow-y-auto lg:pr-2 lg:[scrollbar-gutter:stable]"
          ref={scrollContainerRef}
          role="region"
          tabIndex={0}
        >
          <div className="flex flex-col gap-4 w-full">
            {comments.slice(0, visibleCount).map((comment) => {
              const canManage =
                user?.id === comment.maNguoiBinhLuan || user?.role === "ADMIN";
              return (
                <article
                  className="rounded-2xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-slate-900/40 overflow-hidden min-w-0 shadow-sm"
                  key={comment.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-100 dark:bg-rose-950/60 font-semibold text-rose-600 dark:text-rose-400">
                        {(comment.tenNguoiBinhLuan || "K")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {comment.tenNguoiBinhLuan || "Khách hàng Airbnb"}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {new Date(comment.ngayBinhLuan).toLocaleDateString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                    </div>
                    <Stars value={comment.saoBinhLuan} />
                  </div>
                  <ExpandableText
                    className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-slate-200"
                    previewLength={110}
                    text={comment.noiDung}
                  />
                  {canManage && (
                    <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3 text-xs font-semibold">
                      <Button
                        className="px-3 py-2 text-xs"
                        variant="edit"
                        onClick={() => startEditing(comment)}
                      >
                        <i aria-hidden="true" className="fa-solid fa-pen" />
                        Sửa
                      </Button>
                      <Button
                        className="px-3 py-2 text-xs"
                        variant="delete"
                        onClick={() => setDeletingCommentId(comment.id)}
                      >
                        <i aria-hidden="true" className="fa-solid fa-trash" />
                        Xóa
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div
            aria-live="polite"
            className="grid min-h-16 place-items-center text-sm text-gray-500"
            ref={sentinelRef}
          >
            {visibleCount < comments.length ? (
              loadingMore ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-r-transparent motion-reduce:animate-none"
                  />
                  Đang hiển thị thêm đánh giá...
                </span>
              ) : (
                "Cuộn để xem thêm đánh giá"
              )
            ) : (
              `Đã hiển thị toàn bộ ${comments.length} đánh giá`
            )}
          </div>
        </div>
      )}
      <DeleteConfirmDialog
        description="Bình luận này sẽ bị xóa vĩnh viễn khỏi phòng. Hành động này không thể hoàn tác."
        loading={deleteMutation.isPending}
        open={Boolean(deletingCommentId)}
        title="Xóa bình luận"
        onCancel={() => setDeletingCommentId(null)}
        onConfirm={() => void confirmRemove()}
      />
    </section>
  );
};

export default CommentsSection;
