"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminSearchBar from "@/app/components/admin/AdminSearchBar";
import Button from "@/app/components/ui/Button";
import DeleteConfirmDialog from "@/app/components/ui/DeleteConfirmDialog";
import EmptyState from "@/app/components/ui/EmptyState";
import LoadingState from "@/app/components/ui/LoadingState";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay";
import Modal from "@/app/components/ui/Modal";
import Pagination from "@/app/components/ui/Pagination";
import {
  createUser,
  deleteUser,
  getApiErrorMessage,
  getUserById,
  getUsers,
  getUsersPaged,
  getUsersWithDetails,
  searchUsersByName,
  updateUser,
  type ApiUser,
} from "@/app/lib/api";
import { formatDateForInput } from "@/app/lib/date";
import { adminUserSchema, type AdminUserFormData } from "@/app/lib/schemas";
import { uiClassNames } from "@/app/lib/styles";
import { formatBirthdayForInput, formatPhoneForInput } from "@/app/lib/user";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useToastStore } from "@/app/store/useToastStore";

const PAGE_SIZE = 15;

const emptyForm: AdminUserFormData = {
  birthday: "",
  email: "",
  gender: "true",
  name: "",
  password: "",
  phone: "",
  role: "USER",
};

const normalizeSearchValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi")
    .trim();

const userMatchesKeyword = (user: ApiUser, keyword: string) => {
  const normalizedKeyword = normalizeSearchValue(keyword);
  return [user.name, user.email].some((value) =>
    normalizeSearchValue(value).includes(normalizedKeyword),
  );
};

const mergeUsers = (...userGroups: ApiUser[][]) =>
  Array.from(
    new Map(userGroups.flat().map((user) => [user.id, user] as const)).values(),
  );

const isApiUser = (value: unknown): value is ApiUser =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "number";

export default function AdminUsersPage() {
  const latestRequestId = useRef(0);
  const currentUser = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [deletingUser, setDeletingUser] = useState<ApiUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<AdminUserFormData>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: emptyForm,
  });

  const loadPage = async (page: number, searchKeyword = keyword) => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    try {
      if (searchKeyword.trim()) {
        const normalizedKeyword = searchKeyword.trim();
        const [searchResponse, allUsersResponse] = await Promise.all([
          searchUsersByName(normalizedKeyword).catch(() => null),
          getUsers(),
        ]);
        const fallbackMatches = allUsersResponse.content.filter((user) =>
          userMatchesKeyword(user, normalizedKeyword),
        );
        const searchResults = mergeUsers(
          searchResponse?.content ?? [],
          fallbackMatches,
        ).filter((user) => userMatchesKeyword(user, normalizedKeyword));
        const detailedUsers = await getUsersWithDetails(searchResults);
        if (requestId !== latestRequestId.current) return;
        setUsers(detailedUsers);
        setTotalRows(searchResults.length);
      } else {
        const response = await getUsersPaged({
          pageIndex: page,
          pageSize: PAGE_SIZE,
        });
        const detailedUsers = await getUsersWithDetails(response.content.data);
        if (requestId !== latestRequestId.current) return;
        setUsers(detailedUsers);
        setTotalRows(response.content.totalRow);
      }
      setCurrentPage(page);
    } catch (error) {
      if (requestId !== latestRequestId.current) return;
      showToast(getApiErrorMessage(error, "Không thể tải danh sách người dùng."), "error");
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const requestId = ++latestRequestId.current;
    getUsersPaged({ pageIndex: 1, pageSize: PAGE_SIZE })
      .then(async (response) => {
        const detailedUsers = await getUsersWithDetails(response.content.data);
        if (!active || requestId !== latestRequestId.current) return;
        setUsers(detailedUsers);
        setTotalRows(response.content.totalRow);
      })
      .catch(() => {
        if (active && requestId === latestRequestId.current) {
          showToast("Không thể tải danh sách người dùng.", "error");
        }
      })
      .finally(() => {
        if (active && requestId === latestRequestId.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const handleSearchChange = (val: string) => {
    setKeyword(val);
    void loadPage(1, val);
  };

  const openCreate = () => {
    setEditing(null);
    reset({
      birthday: "",
      email: "",
      gender: "true",
      name: "",
      password: "",
      phone: "",
      role: "USER",
    });
    setModalOpen(true);
  };

  const openEdit = async (user: ApiUser) => {
    setEditingUserId(user.id);
    try {
      const detailedUser = await getUserById(user.id);
      setEditing(detailedUser);
      reset({
        birthday: formatBirthdayForInput(detailedUser.birthday),
        email: detailedUser.email,
        gender: detailedUser.gender ? "true" : "false",
        name: detailedUser.name,
        password: "",
        phone: formatPhoneForInput(detailedUser.phone),
        role: detailedUser.role === "ADMIN" ? "ADMIN" : "USER",
      });
      setModalOpen(true);
    } catch (error) {
      showToast(
        getApiErrorMessage(error, "Không thể tải thông tin chi tiết người dùng."),
        "error",
      );
    } finally {
      setEditingUserId(null);
    }
  };

  const submit = async (values: AdminUserFormData) => {
    if (!editing && !values.password) {
      setError("password", { message: "Vui lòng nhập mật khẩu." });
      return;
    }

    try {
      const payload = {
        birthday: values.birthday,
        email: values.email,
        gender: values.gender === "true",
        name: values.name,
        phone: values.phone,
        role: values.role,
      };

      if (editing) {
        await updateUser(editing.id, { ...payload, id: editing.id });
        showToast("Đã cập nhật người dùng thành công.", "success");
        await loadPage(currentPage);
      } else {
        const response = await createUser({
          ...payload,
          password: values.password,
        });
        showToast("Đã thêm người dùng mới thành công.", "success");
        setKeyword(values.name);
        setCurrentPage(1);
        if (isApiUser(response.content)) {
          const detailedUser = await getUserById(response.content.id).catch(
            () => response.content,
          );
          setUsers([detailedUser]);
          setTotalRows(1);
          setLoading(false);
        } else {
          await loadPage(1, values.name);
        }
      }
      setModalOpen(false);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Không thể lưu người dùng."), "error");
    }
  };

  const handleDeleteRequest = (user: ApiUser) => {
    if (user.id === currentUser?.id) {
      showToast("Bạn không thể tự xóa tài khoản của chính mình!", "error");
      return;
    }
    setDeletingUser(user);
  };

  const confirmRemove = async () => {
    if (!deletingUser || deletingUser.id === currentUser?.id) return;

    setDeleting(true);
    try {
      await deleteUser(deletingUser.id);
      showToast(`Đã xóa người dùng "${deletingUser.name}" thành công.`, "success");
      await loadPage(currentPage);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Không thể xóa người dùng."), "error");
    } finally {
      setDeleting(false);
      setDeletingUser(null);
    }
  };

  const maxBirthdayDate = formatDateForInput(new Date());

  return (
    <div className="space-y-6">
      <AdminPageHeader
        action={
          <Button
            className="w-full sm:w-auto font-bold shadow-md"
            variant="create"
            onClick={openCreate}
          >
            <i className="fa-solid fa-user-plus mr-1" />
            Thêm người dùng
          </Button>
        }
        description="Tìm kiếm, thêm mới, cập nhật vai trò và quản lý tài khoản."
        title="Quản lý người dùng"
      />

      {/* Thanh tìm kiếm Debouncing tự động */}
      <AdminSearchBar
        placeholder="Tìm kiếm theo tên hoặc email..."
        value={keyword}
        onChange={handleSearchChange}
      />

      {loading && users.length === 0 ? (
        <LoadingState label="Đang tải người dùng..." variant="table" />
      ) : users.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description="Không có người dùng phù hợp với tìm kiếm hiện tại."
            title="Không có dữ liệu"
          />
        </div>
      ) : (
        <>
          <div
            className={`${uiClassNames.adminCard} relative mt-6 w-full max-w-[calc(100vw-2rem)] overflow-hidden sm:max-w-[calc(100vw-3rem)] lg:max-w-[calc(100vw-330px)]`}
          >
            {loading && <LoadingOverlay label="Đang cập nhật người dùng..." />}
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[900px] text-left text-sm whitespace-nowrap">
                <thead className={uiClassNames.adminTableHead}>
                  <tr>
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Tên tài khoản</th>
                    <th className="px-5 py-4">Điện thoại</th>
                    <th className="px-5 py-4">Vai trò</th>
                    <th className="px-5 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {users.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    return (
                      <tr
                        className={uiClassNames.adminTableRow}
                        key={user.id}
                      >
                        <td className="px-5 py-4 font-mono text-xs text-gray-400 dark:text-slate-500">#{user.id}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 text-sm font-bold text-gray-700 dark:text-slate-200">
                              {user.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {user.name}
                                {isSelf && (
                                  <span className="ml-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                                    Bạn
                                  </span>
                                )}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600 dark:text-slate-300">
                          {user.phone ? (
                            <span className="flex items-center gap-1.5 font-medium">
                              <i className="fa-solid fa-phone text-xs text-gray-400 dark:text-slate-500" />
                              {user.phone}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                              <i className="fa-solid fa-triangle-exclamation text-[10px]" />
                              Chưa cập nhật
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                              user.role === "ADMIN"
                                ? "bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300"
                                : "bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-300"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${user.role === "ADMIN" ? "bg-purple-500 animate-pulse" : "bg-gray-400"}`} />
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              className="min-w-[68px] text-xs font-bold py-1.5 justify-center"
                              loading={editingUserId === user.id}
                              variant="edit"
                              onClick={() => void openEdit(user)}
                            >
                              <i className="fa-solid fa-pen-to-square" />
                              Sửa
                            </Button>
                            <Button
                              className="min-w-[68px] text-xs font-bold py-1.5 justify-center"
                              disabled={isSelf}
                              title={isSelf ? "Bạn không thể tự xóa tài khoản của chính mình" : "Xóa người dùng"}
                              variant="delete"
                              onClick={() => handleDeleteRequest(user)}
                            >
                              <i className="fa-solid fa-trash" />
                              Xóa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {!keyword && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(Math.ceil(totalRows / PAGE_SIZE), 1)}
              onChange={loadPage}
            />
          )}
        </>
      )}

      {/* Modal Thêm / Cập nhật người dùng */}
      <Modal
        open={modalOpen}
        title={editing ? "Cập nhật người dùng" : "Thêm người dùng"}
        onClose={() => setModalOpen(false)}
      >
        <form
          autoComplete="off"
          className="space-y-4"
          onSubmit={(event) => void handleSubmit(submit)(event)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Tên tài khoản */}
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              Tên tài khoản <span className="text-rose-500">*</span>
              <input
                autoComplete="off"
                className={`${uiClassNames.field} mt-1.5`}
                placeholder="VD: nam_nguyen hoặc Nguyễn Văn A"
                {...register("name")}
              />
              {errors.name && (
                <span className="block mt-1 text-xs font-semibold text-red-500">
                  {errors.name.message}
                </span>
              )}
            </label>

            {/* Email */}
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              Email <span className="text-rose-500">*</span>
              <input
                autoComplete="off"
                className={`${uiClassNames.field} mt-1.5`}
                placeholder="VD: an.nguyen@example.com"
                type="email"
                {...register("email")}
              />
              {errors.email && (
                <span className="block mt-1 text-xs font-semibold text-red-500">
                  {errors.email.message}
                </span>
              )}
            </label>

            {/* Điện thoại */}
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              Điện thoại <span className="text-rose-500">*</span>
              <input
                autoComplete="off"
                className={`${uiClassNames.field} mt-1.5`}
                inputMode="numeric"
                maxLength={10}
                placeholder="VD: 0912345678"
                {...register("phone")}
              />
              {errors.phone && (
                <span className="block mt-1 text-xs font-semibold text-red-500">
                  {errors.phone.message}
                </span>
              )}
            </label>

            {/* Ngày sinh */}
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              Ngày sinh <span className="text-rose-500">*</span>
              <input
                className={`${uiClassNames.field} mt-1.5 [color-scheme:light_dark]`}
                max={maxBirthdayDate}
                type="date"
                {...register("birthday")}
              />
              {errors.birthday && (
                <span className="block mt-1 text-xs font-semibold text-red-500">
                  {errors.birthday.message}
                </span>
              )}
            </label>

            {/* Giới tính */}
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              Giới tính
              <select
                className={`${uiClassNames.field} mt-1.5 cursor-pointer`}
                {...register("gender")}
              >
                <option value="true">Nam</option>
                <option value="false">Nữ</option>
              </select>
            </label>

            {/* Vai trò */}
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              Vai trò
              <select
                className={`${uiClassNames.field} mt-1.5 cursor-pointer`}
                {...register("role")}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
          </div>

          {/* Mật khẩu */}
          {!editing && (
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
              Mật khẩu <span className="text-rose-500">*</span>
              <input
                autoComplete="new-password"
                className={`${uiClassNames.field} mt-1.5`}
                placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, thường, số, ký tự đặc biệt"
                type="password"
                {...register("password")}
              />
              {errors.password && (
                <span className="block mt-1 text-xs font-semibold text-red-500">
                  {errors.password.message}
                </span>
              )}
            </label>
          )}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-white/10">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button
              className="font-bold shadow-md"
              loading={isSubmitting}
              type="submit"
              variant={editing ? "edit" : "create"}
            >
              {editing ? "Cập nhật người dùng" : "Lưu người dùng"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Hộp thoại xác nhận xóa có đếm ngược 5 giây */}
      <DeleteConfirmDialog
        countdownSeconds={5}
        description={`Người dùng "${deletingUser?.name ?? ""}" sẽ bị xóa khỏi hệ thống. Vui lòng chờ 5 giây để xác nhận xóa thật sự nhằm tránh thao tác nhầm.`}
        loading={deleting}
        open={Boolean(deletingUser)}
        title="Xác nhận xóa người dùng"
        onCancel={() => setDeletingUser(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}
