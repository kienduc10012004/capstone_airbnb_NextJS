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
  createComment,
  deleteComment,
  getApiErrorMessage,
  getCommentsByRoom,
  updateComment,
  type ApiComment,
} from "@/app/lib/api";
import { commentSchema, type CommentFormData } from "@/app/lib/schemas";
import { uiClassNames } from "@/app/lib/styles";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useToastStore } from "@/app/store/useToastStore";

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
  const [comments, setComments] = useState<ApiComment[]>(() =>
    sortCommentsNewestFirst(initialComments),
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
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
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { noiDung: "", saoBinhLuan: 5 },
  });

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

  //==== Đồng bộ đánh giá: tải lại danh sách và luôn sắp xếp bình luận mới nhất lên đầu ====
  const refreshComments = async () => {
    const response = await getCommentsByRoom(roomId);
    setComments(sortCommentsNewestFirst(response.content));
  };

  const submit = async (values: CommentFormData) => {
    setMessage(null);
    if (!user) {
      setMessage({
        text: "Vui lòng đăng nhập để gửi đánh giá.",
        type: "error",
      });
      return;
    }

    const current = comments.find((comment) => comment.id === editingId);
    const payload = {
      id: editingId ?? 0,
      maNguoiBinhLuan: user.id,
      maPhong: roomId,
      ngayBinhLuan: current?.ngayBinhLuan ?? new Date().toISOString(),
      noiDung: values.noiDung,
      saoBinhLuan: values.saoBinhLuan,
    };

    try {
      if (editingId) {
        await updateComment(editingId, payload);
      } else {
        await createComment(payload);
      }
      await refreshComments();
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

    setDeleting(true);
    try {
      await deleteComment(deletingCommentId);
      await refreshComments();
      setMessage(null);
      showToast("Đã xóa bình luận.", "success");
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể xóa bình luận."),
        type: "error",
      });
    } finally {
      setDeleting(false);
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

      <div className="mt-6 flex justify-end">
        <Button
          variant={reviewFormOpen ? "secondary" : "create"}
          onClick={() => setReviewFormOpen((current) => !current)}
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
          className={`${uiClassNames.surface} mt-4 space-y-4 p-5`}
          onSubmit={handleSubmit(submit)}
        >
          {message && (
            <StatusMessage message={message.text} type={message.type} />
          )}
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <label className="text-sm font-medium text-gray-700">
              Số sao
              <select
                className={`${uiClassNames.field} mt-1.5`}
                {...register("saoBinhLuan", { valueAsNumber: true })}
              >
                {[5, 4, 3, 2, 1].map((star) => (
                  <option key={star} value={star}>
                    {star} sao
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Nội dung
              <textarea
                className={`${uiClassNames.field} mt-1.5 min-h-24 resize-y`}
                placeholder="Chia sẻ điều bạn thích về nơi ở này"
                {...register("noiDung")}
              />
              {errors.noiDung && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.noiDung.message}
                </span>
              )}
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {editingId && (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  reset({ noiDung: "", saoBinhLuan: 5 });
                }}
              >
                Hủy sửa
              </Button>
            )}
            <Button
              loading={isSubmitting}
              type="submit"
              variant={editingId ? "edit" : "create"}
            >
              {editingId ? "Lưu thay đổi" : "Gửi đánh giá"}
            </Button>
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
        loading={deleting}
        open={Boolean(deletingCommentId)}
        title="Xóa bình luận"
        onCancel={() => setDeletingCommentId(null)}
        onConfirm={() => void confirmRemove()}
      />
    </section>
  );
};

export default CommentsSection;
