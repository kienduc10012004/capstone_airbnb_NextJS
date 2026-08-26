import { z } from "zod";

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} không được để trống.`);

const phoneRegex = /^(03|05|07|08|09)\d{8}$/;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._#^~+=-])[A-Za-z\d@$!%*?&._#^~+=-]{8,}$/;

const birthdaySchema = requiredText("Ngày sinh")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh không đúng định dạng (YYYY-MM-DD).")
  .refine(
    (val) => new Date(val) <= new Date(),
    "Ngày sinh không thể là ngày trong tương lai.",
  );

export const signInSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ."),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự."),
});

export const signUpSchema = z.object({
  name: requiredText("Tên tài khoản").min(1, "Tên tài khoản không được để trống."),
  email: z.string().trim().email("Email không hợp lệ (VD: user@example.com)."),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
    .regex(
      passwordRegex,
      "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
    ),
  phone: z
    .string()
    .trim()
    .regex(
      phoneRegex,
      "Số điện thoại phải gồm đúng 10 số và bắt đầu bằng 03, 05, 07, 08, 09.",
    ),
  birthday: birthdaySchema,
  gender: z.enum(["true", "false"]),
});

export const profileSchema = signUpSchema
  .omit({ password: true })
  .extend({ role: z.enum(["USER", "ADMIN"]) });

export const adminUserSchema = z.object({
  name: requiredText("Tên tài khoản").min(1, "Tên tài khoản không được để trống."),
  email: z.string().trim().email("Email không hợp lệ (VD: user@example.com)."),
  phone: z
    .string()
    .trim()
    .regex(
      phoneRegex,
      "Số điện thoại phải gồm đúng 10 số và bắt đầu bằng 03, 05, 07, 08, 09.",
    ),
  birthday: birthdaySchema,
  gender: z.enum(["true", "false"]),
  role: z.enum(["USER", "ADMIN"]),
  password: z
    .union([
      z.literal(""),
      z
        .string()
        .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
        .regex(
          passwordRegex,
          "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
        ),
    ])
    .optional(),
});

export const locationSchema = z.object({
  tenViTri: requiredText("Tên vị trí"),
  tinhThanh: requiredText("Tỉnh thành"),
  quocGia: requiredText("Quốc gia"),
  hinhAnh: z.string().trim().optional(),
});

export const roomSchema = z.object({
  tenPhong: requiredText("Tên phòng"),
  khach: z.number().int().min(1, "Số khách phải lớn hơn 0."),
  phongNgu: z.number().int().min(0),
  giuong: z.number().int().min(0),
  phongTam: z.number().int().min(0),
  moTa: requiredText("Mô tả"),
  giaTien: z.number().int().min(1, "Giá phòng phải lớn hơn 0."),
  maViTri: z.number().int().min(1, "Vui lòng chọn vị trí."),
  hinhAnh: z.string().trim().optional(),
  mayGiat: z.boolean(),
  banLa: z.boolean(),
  tivi: z.boolean(),
  dieuHoa: z.boolean(),
  wifi: z.boolean(),
  bep: z.boolean(),
  doXe: z.boolean(),
  hoBoi: z.boolean(),
  banUi: z.boolean(),
});

export const bookingSchema = z
  .object({
    ngayDen: requiredText("Ngày nhận phòng"),
    ngayDi: requiredText("Ngày trả phòng"),
    soLuongKhach: z.number().int().min(1, "Cần ít nhất một khách."),
  })
  .refine((data) => new Date(data.ngayDi) > new Date(data.ngayDen), {
    message: "Ngày trả phòng phải sau ngày nhận phòng.",
    path: ["ngayDi"],
  });

export const commentSchema = z.object({
  noiDung: requiredText("Nội dung").min(
    3,
    "Bình luận phải có ít nhất 3 ký tự.",
  ),
  saoBinhLuan: z.number().int().min(1).max(5),
});

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type AdminUserFormData = z.infer<typeof adminUserSchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
export type RoomFormData = z.infer<typeof roomSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
export type CommentFormData = z.infer<typeof commentSchema>;
