"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import Button from "@/app/components/ui/Button";
import Modal from "@/app/components/ui/Modal";
import StatusMessage from "@/app/components/ui/StatusMessage";
import {
  getApiErrorMessage,
  signIn,
  signUp,
  type ApiUser,
} from "@/app/lib/api";
import {
  signInSchema,
  signUpSchema,
  type SignInFormData,
  type SignUpFormData,
} from "@/app/lib/schemas";
import { setSession } from "@/app/lib/session";
import { uiClassNames } from "@/app/lib/styles";
import { useToastStore } from "@/app/store/useToastStore";

export type AuthMode = "SignIn" | "SignUp";

type AuthModalProps = {
  initialSignInEmail?: string;
  mode: AuthMode;
  open: boolean;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
  onSignedIn: (user: ApiUser) => void;
};

type FieldProps = {
  error?: string;
  label: string;
  children: React.ReactNode;
};

const Field = ({ children, error, label }: FieldProps) => (
  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
    {label}
    <span className="mt-1.5 block">{children}</span>
    {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
  </label>
);

const SignInForm = ({
  initialEmail = "",
  onSignedIn,
}: {
  initialEmail?: string;
  onSignedIn: (user: ApiUser) => void;
}) => {
  const [apiError, setApiError] = useState("");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: initialEmail, password: "" },
  });

  //==== Đăng nhập: xác thực tài khoản và khởi tạo session người dùng ====
  const submit = async (values: SignInFormData) => {
    setApiError("");
    try {
      const response = await signIn(values);
      setSession(response);
      onSignedIn(response.content.user);
    } catch (error) {
      setApiError(
        getApiErrorMessage(
          error,
          "Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.",
        ),
      );
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      {apiError && <StatusMessage message={apiError} type="error" />}
      <Field error={errors.email?.message} label="Email">
        <input
          autoComplete="email"
          className={uiClassNames.field}
          placeholder="you@example.com"
          type="email"
          {...register("email")}
        />
      </Field>
      <Field error={errors.password?.message} label="Mật khẩu">
        <input
          autoComplete="current-password"
          className={uiClassNames.field}
          placeholder="Tối thiểu 6 ký tự"
          type="password"
          {...register("password")}
        />
      </Field>
      <Button className="w-full" loading={isSubmitting} type="submit">
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
};

const SignUpForm = ({
  onModeChange,
}: {
  onModeChange: (mode: AuthMode) => void;
}) => {
  const [apiError, setApiError] = useState("");
  const showToast = useToastStore((state) => state.showToast);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      birthday: "",
      email: "",
      gender: "true",
      name: "",
      password: "",
      phone: "",
    },
  });

  //==== Đăng ký: tạo tài khoản mới và chuyển về biểu mẫu đăng nhập ====
  const submit = async (values: SignUpFormData) => {
    setApiError("");
    try {
      await signUp({
        birthday: values.birthday,
        email: values.email,
        gender: values.gender === "true",
        id: 0,
        name: values.name,
        password: values.password,
        phone: values.phone,
        role: "USER",
      });
      reset();
      showToast("Đã tạo tài khoản thành công.", "success");
      onModeChange("SignIn");
    } catch (error) {
      setApiError(getApiErrorMessage(error, "Không thể tạo tài khoản."));
    }
  };

  //==== Biểu mẫu đăng ký: hiển thị các trường tài khoản và lỗi kiểm tra dữ liệu ====
  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      {apiError && <StatusMessage message={apiError} type="error" />}
      <Field error={errors.name?.message} label="Tên tài khoản">
        <input className={uiClassNames.field} placeholder="VD: nam_nguyen hoặc Nguyễn Văn A" {...register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={errors.email?.message} label="Email">
          <input
            autoComplete="email"
            className={uiClassNames.field}
            type="email"
            {...register("email")}
          />
        </Field>
        <Field error={errors.phone?.message} label="Số điện thoại">
          <input
            className={uiClassNames.field}
            inputMode="numeric"
            {...register("phone")}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={errors.birthday?.message} label="Ngày sinh">
          <input
            className={uiClassNames.field}
            type="date"
            {...register("birthday")}
          />
        </Field>
        <Field error={errors.gender?.message} label="Giới tính">
          <select className={uiClassNames.field} {...register("gender")}>
            <option value="true">Nam</option>
            <option value="false">Nữ</option>
          </select>
        </Field>
      </div>
      <Field error={errors.password?.message} label="Mật khẩu">
        <input
          autoComplete="new-password"
          className={uiClassNames.field}
          type="password"
          {...register("password")}
        />
      </Field>
      <Button
        className="w-full"
        loading={isSubmitting}
        type="submit"
        variant="create"
      >
        {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
      </Button>
    </form>
  );
};

const AuthModal = ({
  initialSignInEmail,
  mode,
  onClose,
  onModeChange,
  onSignedIn,
  open,
}: AuthModalProps) => {
  useEffect(() => {
    if (!open) {
      onModeChange("SignIn");
    }
  }, [onModeChange, open]);

  //==== Giao diện xác thực: chuyển đổi giữa biểu mẫu đăng nhập và đăng ký ====
  return (
    <Modal
      description="Đăng nhập để đặt phòng và quản lý chuyến đi của bạn."
      open={open}
      size="sm"
      title="Chào mừng đến Airbnb"
      onClose={onClose}
    >
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
        {(["SignIn", "SignUp"] as AuthMode[]).map((tab) => (
          <button
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              mode === tab
                ? "bg-white text-rose-600 shadow-sm"
                : "text-gray-500"
            }`}
            key={tab}
            type="button"
            onClick={() => onModeChange(tab)}
          >
            {tab === "SignIn" ? "Đăng nhập" : "Đăng ký"}
          </button>
        ))}
      </div>
      {mode === "SignIn" ? (
        <SignInForm
          initialEmail={initialSignInEmail}
          key={initialSignInEmail}
          onSignedIn={onSignedIn}
        />
      ) : (
        <SignUpForm onModeChange={onModeChange} />
      )}
    </Modal>
  );
};

export default AuthModal;
