"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import Button from "@/app/components/ui/Button";
import DeleteConfirmDialog from "@/app/components/ui/DeleteConfirmDialog";
import EmptyState from "@/app/components/ui/EmptyState";
import LoadingState from "@/app/components/ui/LoadingState";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay";
import Modal from "@/app/components/ui/Modal";
import Pagination from "@/app/components/ui/Pagination";
import StatusMessage from "@/app/components/ui/StatusMessage";
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
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
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

  //==== Tải danh sách người dùng: đồng bộ phân trang, tìm kiếm và dữ liệu chi tiết từ API ====
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
      setMessage({
        text: getApiErrorMessage(error, "Không thể tải danh sách người dùng."),
        type: "error",
      });
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
          setMessage({
            text: "Không thể tải danh sách người dùng.",
            type: "error",
          });
        }
      })
      .finally(() => {
        if (active && requestId === latestRequestId.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  //==== Biểu mẫu người dùng: chuẩn bị dữ liệu cho thao tác thêm và sửa tài khoản ====
  const openCreate = () => {
    setEditing(null);
    reset(emptyForm);
    setModalOpen(true);
  };

  const openEdit = async (user: ApiUser) => {
    if (user.id === currentUser?.id) return;

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
      setMessage({
        text: getApiErrorMessage(
          error,
          "Không thể tải thông tin chi tiết người dùng.",
        ),
        type: "error",
      });
    } finally {
      setEditingUserId(null);
    }
  };

  const submit = async (values: AdminUserFormData) => {
    if (!editing && !values.password) {
      setError("password", { message: "Vui lòng nhập mật khẩu." });
      return;
    }
    setMessage(null);
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
        setMessage(null);
        showToast("Đã cập nhật người dùng.", "success");
        await loadPage(currentPage);
      } else {
        const response = await createUser({
          ...payload,
          password: values.password,
        });
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
        setMessage(null);
        showToast("Đã thêm người dùng.", "success");
      }
      setModalOpen(false);
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể lưu người dùng."),
        type: "error",
      });
    }
  };

  //==== Xóa người dùng: thực thi yêu cầu sau khi quản trị viên xác nhận ====
  const confirmRemove = async () => {
    if (!deletingUser || deletingUser.id === currentUser?.id) return;

    setDeleting(true);
    try {
      await deleteUser(deletingUser.id);
      setMessage(null);
      showToast("Đã xóa người dùng.", "success");
      await loadPage(currentPage);
    } catch (error) {
      setMessage({
        text: getApiErrorMessage(error, "Không thể xóa người dùng."),
        type: "error",
      });
    } finally {
      setDeleting(false);
      setDeletingUser(null);
    }
  };

  const search = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadPage(1);
  };

  //==== Giao diện quản lý người dùng: hiển thị bộ lọc, bảng dữ liệu và các hộp thoại ====
  return (
    <div>
      <AdminPageHeader
        action={
          <Button
            className="w-full sm:w-auto"
            variant="create"
            onClick={openCreate}
          >
            + Thêm người dùng
          </Button>
        }
        description="Tìm kiếm, thêm mới, cập nhật vai trò và quản lý tài khoản."
        title="Quản lý người dùng"
      />
      <form
        className={`${uiClassNames.surface} mt-6 grid grid-cols-2 gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]`}
        onSubmit={search}
      >
        <input
          className={`${uiClassNames.field} col-span-2 sm:col-span-1`}
          placeholder="Tìm theo tên hoặc email"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Button className="w-full whitespace-nowrap" type="submit">
          Tìm
        </Button>
        <Button
          className="w-full whitespace-nowrap"
          disabled={!keyword}
          variant="secondary"
          onClick={() => {
            setKeyword("");
            void loadPage(1, "");
          }}
        >
          Xóa lọc
        </Button>
      </form>
      {message && (
        <div className="mt-5">
          <StatusMessage message={message.text} type={message.type} />
        </div>
      )}
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
            className={`${uiClassNames.surface} relative mt-6 w-full max-w-[calc(100vw-2rem)] overflow-hidden sm:max-w-[calc(100vw-3rem)] lg:max-w-[calc(100vw-314px)]`}
          >
            {loading && <LoadingOverlay label="Đang cập nhật người dùng..." />}
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[900px] text-left text-sm whitespace-nowrap">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Người dùng</th>
                    <th className="px-5 py-4">Điện thoại</th>
                    <th className="px-5 py-4">Vai trò</th>
                    <th className="px-5 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr
                      className="transition-colors duration-300 ease-out hover:bg-gray-50"
                      key={user.id}
                    >
                      <td className="px-5 py-4 text-gray-500">{user.id}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {user.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {user.email}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {user.phone || (
                          <span className="text-xs text-amber-600">
                            Chưa cập nhật
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.role === "ADMIN"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          disabled={user.id === currentUser?.id}
                          loading={editingUserId === user.id}
                          variant="edit"
                          onClick={() => void openEdit(user)}
                        >
                          Sửa
                        </Button>
                        <Button
                          disabled={user.id === currentUser?.id}
                          variant="delete"
                          onClick={() => setDeletingUser(user)}
                        >
                          Xóa
                        </Button>
                      </td>
                    </tr>
                  ))}
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

      <Modal
        open={modalOpen}
        title={editing ? "Cập nhật người dùng" : "Thêm người dùng"}
        onClose={() => setModalOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => void handleSubmit(submit)(event)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Họ tên
              <input
                className={`${uiClassNames.field} mt-1.5`}
                {...register("name")}
              />
              {errors.name && (
                <span className="text-xs text-red-500">
                  {errors.name.message}
                </span>
              )}
            </label>
            <label className="text-sm font-medium">
              Email
              <input
                className={`${uiClassNames.field} mt-1.5`}
                type="email"
                {...register("email")}
              />
              {errors.email && (
                <span className="text-xs text-red-500">
                  {errors.email.message}
                </span>
              )}
            </label>
            <label className="text-sm font-medium">
              Điện thoại
              <input
                className={`${uiClassNames.field} mt-1.5`}
                inputMode="numeric"
                {...register("phone")}
              />
              {errors.phone && (
                <span className="text-xs text-red-500">
                  {errors.phone.message}
                </span>
              )}
            </label>
            <label className="text-sm font-medium">
              Ngày sinh
              <input
                className={`${uiClassNames.field} mt-1.5`}
                type="date"
                {...register("birthday")}
              />
            </label>
            <label className="text-sm font-medium">
              Giới tính
              <select
                className={`${uiClassNames.field} mt-1.5`}
                {...register("gender")}
              >
                <option value="true">Nam</option>
                <option value="false">Nữ</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Vai trò
              <select
                className={`${uiClassNames.field} mt-1.5`}
                {...register("role")}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
          </div>
          {!editing && (
            <label className="block text-sm font-medium">
              Mật khẩu
              <input
                className={`${uiClassNames.field} mt-1.5`}
                type="password"
                {...register("password")}
              />
              {errors.password && (
                <span className="text-xs text-red-500">
                  {errors.password.message}
                </span>
              )}
            </label>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button
              loading={isSubmitting}
              type="submit"
              variant={editing ? "edit" : "create"}
            >
              Lưu người dùng
            </Button>
          </div>
        </form>
      </Modal>
      <DeleteConfirmDialog
        description={`Người dùng "${deletingUser?.name ?? ""}" sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.`}
        loading={deleting}
        open={Boolean(deletingUser)}
        title="Xóa người dùng"
        onCancel={() => setDeletingUser(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}
