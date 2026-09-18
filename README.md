# Capstone Project: Airbnb Clone Web Application

Hệ thống đặt phòng và quản lý lưu trú trực tuyến mô phỏng Airbnb, xây dựng trên nền tảng **Next.js 16 App Router**, **React 19**, **TypeScript** kết nối với RESTful API của CyberSoft.

---

## 📌 Liên kết & Thông tin đồ án

- **Demo Website:** `http://localhost:3000` *(hoặc link Vercel nếu đã deploy)*
- **Swagger API Docs:** [CyberSoft Airbnb API](https://airbnbnew.cybersoft.edu.vn/swagger/index.html)
- **Công nghệ chính:** Next.js 16 (App Router), React 19, TypeScript (Strict Mode), Tailwind CSS 4, React Query v5, Zustand, React Hook Form, Zod, Vitest.

---

## 👥 Thành viên & Phân công nhiệm vụ

| STT | Thành viên | Vai trò | Phân công phụ trách |
| :--- | :--- | :--- | :--- |
| 1 | **Nguyễn Kiến Đức** | Lead Frontend / Developer | Kiến trúc Next.js App Router, Tích hợp API, Quản lý Booking/Rooms, Admin Dashboard & State Management |
| 2 | **Nhóm phát triển** | Frontend Developer | Giao diện Responsive, Authentication Flow, Quản lý Vị trí & Đánh giá, Unit Test với Vitest |

---

## 🛠️ Công nghệ & Thư viện sử dụng

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components)
- **Giao diện & Styling:** [Tailwind CSS 4](https://tailwindcss.com/) (Hỗ trợ Dark / Light Theme đồng bộ)
- **Ngôn ngữ:** [TypeScript](https://www.typescriptlang.org/) (Chế độ strict toàn bộ codebase)
- **Quản lý State:** [Zustand](https://github.com/pmndrs/zustand) (Auth store, Toast notification, Favorites store)
- **Xử lý bất đồng bộ & Cache:** [@tanstack/react-query](https://tanstack.com/query)
- **Form & Validation:** [React Hook Form](https://react-hook-form.com/) kết hợp [Zod](https://zod.dev/) Schema Validation
- **HTTP Client:** [Axios](https://axios-http.com/) với Interceptor tự động gắn Token & xử lý lỗi tập trung
- **Kiểm thử (Unit Test):** [Vitest](https://vitest.dev/) kiểm thử toàn diện nghiệp vụ và validation rules

---

## 📂 Cấu trúc thư mục dự án

```text
capstone_airbnb_NextJS/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Route & modal xác thực (SignIn, SignUp)
│   │   ├── admin/               # Phân hệ Quản trị viên (Admin Portal)
│   │   │   ├── bookings/        # Quản lý đặt phòng
│   │   │   ├── locations/       # Quản lý vị trí lưu trú & Upload ảnh
│   │   │   ├── rooms/           # Quản lý thông tin phòng & Tiện ích
│   │   │   ├── users/           # Quản lý người dùng & Phân quyền
│   │   │   └── page.tsx         # Dashboard thống kê tổng quan
│   │   ├── components/          # Reusable UI Components
│   │   │   ├── admin/           # Components dành riêng cho Admin
│   │   │   ├── auth/            # AuthModal, Form đăng ký/đăng nhập
│   │   │   ├── bookings/        # BookingCard, DateSelector, Lịch đặt phòng
│   │   │   ├── comments/        # Đánh giá & bình luận phòng
│   │   │   ├── favorites/       # Danh sách phòng yêu thích
│   │   │   ├── locations/       # Hiển thị & tìm kiếm vị trí
│   │   │   ├── profile/         # Hồ sơ cá nhân & lịch sử chuyến đi
│   │   │   ├── rooms/           # Thẻ phòng, chi tiết phòng, bộ lọc tiện ích
│   │   │   ├── search/          # Thanh tìm kiếm nâng cao đa tiêu chí
│   │   │   └── ui/              # Button, Modal, Toast, Skeleton, Table, ConfirmDialog
│   │   ├── favorites/           # Trang danh sách phòng đã lưu
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/
│   │   │   ├── api/             # API clients & service layers (CyberSoft)
│   │   │   ├── booking-availability.ts # Thuật toán chống trùng lịch & quy tắc đặt phòng
│   │   │   ├── date.ts          # Utility xử lý ngày tháng chuẩn hóa
│   │   │   ├── schemas.ts       # Định nghĩa toàn bộ Zod validation schemas
│   │   │   └── session.ts       # Quản lý token & session người dùng
│   │   ├── locations/           # Trang danh sách & chi tiết vị trí
│   │   ├── profile/             # Trang thông tin cá nhân & lịch sử đặt phòng
│   │   ├── providers/           # React Query Provider, Theme Provider
│   │   ├── rooms/               # Trang danh sách & chi tiết phòng
│   │   ├── store/               # Zustand Stores (Auth, Toast, Favorites)
│   │   ├── globals.css          # Định nghĩa tokens, theme dark/light
│   │   ├── layout.tsx           # Root Layout (Header, Footer, ToastContainer)
│   │   └── page.tsx             # Trang chủ (Hero, Quick Search, Featured)
├── tests/                       # Bộ Unit Test (Vitest)
│   ├── api-error.test.ts        # Test chuẩn hóa lỗi backend & mapping email trùng
│   ├── booking-availability.test.ts # Test thuật toán overlap & ràng buộc đặt phòng
│   └── validation-schemas.test.ts   # Test Zod schemas (Auth, Room, Booking, Comment)
├── .env.example                 # Mẫu cấu hình biến môi trường
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # Cấu hình TypeScript & Path Alias
└── vitest.config.mts            # Cấu hình Vitest
```

---

## 🚀 Danh sách chức năng chi tiết

### 1. Phân hệ Người dùng (Client / User)
- **Trang chủ:** Hero banner, thanh tìm kiếm nhanh theo địa điểm/ngày/số khách, danh sách địa điểm nổi bật.
- **Tìm kiếm & Bộ lọc nâng cao:**
  - Lọc theo địa điểm, khoảng giá, số lượng phòng ngủ/giường/phòng tắm.
  - Bộ lọc tiện ích: Máy giặt, bàn là, tivi, điều hòa, wifi, bếp ăn, chỗ đỗ xe, hồ bơi.
  - Phân trang dữ liệu và tìm kiếm theo từ khóa.
- **Chi tiết phòng:**
  - Thư viện hình ảnh, thông tin chi tiết chủ nhà, mô tả tiện nghi.
  - Bản đồ và thông tin vị trí du lịch liên quan.
  - Hệ thống bình luận, chấm điểm sao (1 - 5 sao) và xem nhận xét từ khách hàng khác.
- **Quy trình Đặt phòng (Booking Flow):**
  - Chọn khoảng ngày nhận phòng (`ngayDen`) & trả phòng (`ngayDi`).
  - **Thuật toán kiểm tra lịch:** Tự động phát hiện và ngăn chặn đặt phòng bị trùng lịch (Date Conflict / Overlap).
  - **Kiểm soát sức chứa:** Chặn việc đặt vượt quá số khách tối đa (`khach`) của phòng.
  - Chặn chọn ngày trong quá khứ hoặc ngày trả phòng trước ngày nhận phòng.
  - Popup xác nhận thông tin và tính tổng chi phí trước khi lưu.
- **Tài khoản & Hồ sơ (User Profile):**
  - Đăng ký tài khoản (xác thực mật khẩu mạnh, email, số điện thoại chuẩn Việt Nam).
  - Đăng nhập và lưu trữ phiên làm việc an toàn.
  - Cập nhật thông tin cá nhân (Tên, ngày sinh, giới tính, số điện thoại).
  - Cập nhật ảnh đại diện (Upload avatar với kiểm tra dung lượng < 1MB).
  - **Lịch sử chuyến đi:** Quản lý toàn bộ danh sách phòng đã đặt, lọc theo trạng thái (Sắp tới, Đang diễn ra, Đã hoàn thành), hỗ trợ **đổi lịch** hoặc **hủy phòng**.
- **Yêu thích (Favorites):** Lưu trữ danh sách phòng yêu thích theo từng tài khoản.
- **Dark Mode:** Hỗ trợ chuyển đổi giao diện Sáng / Tối mượt mà không nhấp nháy (Zero-Flicker).

### 2. Phân hệ Quản trị (Admin Portal)
*Chỉ người dùng có quyền `role: "ADMIN"` mới được phép truy cập.*
- **Dashboard Tổng quan (`/admin`):** Thống kê nhanh tổng số lượng người dùng, vị trí, phòng cho thuê, lượt đặt phòng và bình luận.
- **Quản lý Người dùng (`/admin/users`):**
  - Xem danh sách phân trang, tìm kiếm người dùng theo tên/email.
  - Thêm mới người dùng với phân quyền (`USER` / `ADMIN`).
  - Chỉnh sửa thông tin tài khoản và xóa người dùng (có bảo vệ chống tự xóa chính mình).
- **Quản lý Vị trí (`/admin/locations`):**
  - Xem danh sách phân trang, tìm kiếm vị trí theo tên, tỉnh thành, quốc gia.
  - Thêm mới / Chỉnh sửa vị trí lưu trú.
  - Upload ảnh vị trí trực tiếp lên máy chủ CyberSoft.
- **Quản lý Phòng (`/admin/rooms`):**
  - Xem danh sách phòng phân trang, tìm kiếm theo tên phòng.
  - Thêm mới / Cập nhật phòng với đầy đủ cấu hình giá tiền, số lượng khách, tiện ích đi kèm.
  - Upload hình ảnh phòng lưu trú.
- **Quản lý Đặt phòng (`/admin/bookings`):**
  - Theo dõi toàn bộ đơn đặt phòng trên hệ thống.
  - Tìm kiếm theo mã đặt phòng, tên khách hàng hoặc tên phòng.
  - Chỉnh sửa ngày nhận/trả phòng và số khách.
  - Hủy đơn đặt phòng khi có yêu cầu.

---

## 📡 Danh sách API Swagger CyberSoft đã tích hợp

Hệ thống tích hợp đầy đủ 6 nhóm API chính từ tài liệu [CyberSoft Airbnb Swagger](https://airbnbnew.cybersoft.edu.vn/swagger/index.html):

| Phân nhóm | Method | Endpoint | Mô tả chức năng |
| :--- | :---: | :--- | :--- |
| **Auth** | `POST` | `/api/auth/signin` | Đăng nhập hệ thống & lấy Token JWT |
| | `POST` | `/api/auth/signup` | Đăng ký tài khoản người dùng mới |
| **Users** | `GET` | `/api/users` | Lấy danh sách toàn bộ người dùng |
| | `GET` | `/api/users/phan-trang-tim-kiem` | Phân trang & tìm kiếm người dùng |
| | `GET` | `/api/users/{id}` | Lấy thông tin chi tiết người dùng theo ID |
| | `POST` | `/api/users` | Tạo mới người dùng (Admin) |
| | `PUT` | `/api/users/{id}` | Cập nhật thông tin người dùng |
| | `DELETE`| `/api/users` | Xóa người dùng theo ID |
| | `POST` | `/api/users/upload-avatar` | Upload ảnh đại diện người dùng |
| **ViTri** | `GET` | `/api/vi-tri` | Lấy danh sách tất cả vị trí |
| | `GET` | `/api/vi-tri/phan-trang-tim-kiem` | Phân trang & tìm kiếm vị trí |
| | `GET` | `/api/vi-tri/{id}` | Lấy chi tiết vị trí theo ID |
| | `POST` | `/api/vi-tri` | Tạo mới vị trí |
| | `PUT` | `/api/vi-tri/{id}` | Cập nhật thông tin vị trí |
| | `DELETE`| `/api/vi-tri/{id}` | Xóa vị trí |
| | `POST` | `/api/vi-tri/upload-hinh-vitri` | Upload hình ảnh cho vị trí |
| **PhongThue**| `GET` | `/api/phong-thue` | Lấy danh sách toàn bộ phòng |
| | `GET` | `/api/phong-thue/phan-trang-tim-kiem` | Phân trang & tìm kiếm phòng |
| | `GET` | `/api/phong-thue/{id}` | Lấy chi tiết phòng theo ID |
| | `GET` | `/api/phong-thue/lay-phong-theo-vi-tri`| Lấy danh sách phòng theo mã vị trí |
| | `POST` | `/api/phong-thue` | Tạo mới phòng cho thuê |
| | `PUT` | `/api/phong-thue/{id}` | Cập nhật thông tin phòng |
| | `DELETE`| `/api/phong-thue/{id}` | Xóa phòng |
| | `POST` | `/api/phong-thue/upload-hinh-phong` | Upload hình ảnh phòng |
| **DatPhong** | `GET` | `/api/dat-phong` | Lấy danh sách tất cả đơn đặt phòng |
| | `GET` | `/api/dat-phong/{id}` | Lấy chi tiết đơn đặt phòng theo ID |
| | `GET` | `/api/dat-phong/lay-theo-nguoi-dung/{MaNguoiDung}` | Lấy lịch sử đặt phòng của người dùng |
| | `POST` | `/api/dat-phong` | Tạo mới đơn đặt phòng |
| | `PUT` | `/api/dat-phong/{id}` | Chỉnh sửa đơn đặt phòng |
| | `DELETE`| `/api/dat-phong/{id}` | Hủy / Xóa đơn đặt phòng |
| **BinhLuan** | `GET` | `/api/binh-luan` | Lấy danh sách tất cả bình luận |
| | `GET` | `/api/binh-luan/lay-binh-luan-theo-phong/{MaPhong}` | Lấy danh sách bình luận của 1 phòng |
| | `POST` | `/api/binh-luan` | Gửi đánh giá / bình luận mới |
| | `PUT` | `/api/binh-luan/{id}` | Chỉnh sửa bình luận |
| | `DELETE`| `/api/binh-luan/{id}` | Xóa bình luận |

---

## ⚠️ Giới hạn hệ thống Backend (Backend Constraints)

Trong quá trình phát triển và tích hợp với hệ thống API của CyberSoft, nhóm ghi nhận các giới hạn kỹ thuật từ phía Backend bên thứ ba và đã có giải pháp xử lý phù hợp:

1. **Không hỗ trợ API Notification (Thông báo thời gian thực):**
   - *Thực trạng Backend:* Backend CyberSoft không cung cấp WebSocket hay API lưu trữ/truy xuất thông báo (Notifications).
   - *Giải pháp Frontend:* Hệ thống sử dụng Toast Notification phản hồi tức thì các thao tác (Thành công, Lỗi, Cảnh báo), kết hợp đồng bộ trực tiếp trạng thái chuyến đi trong phần Lịch sử đặt phòng.
2. **Không có trường trạng thái hoạt động riêng (Active/Inactive) của phòng:**
   - *Thực trạng Backend:* Schema bảng `PhongThue` trong cơ sở dữ liệu backend chỉ lưu thông tin cơ bản và tiện ích, không có cờ boolean `isActive` hoặc `status`.
   - *Giải pháp Frontend:* Tính toán tính khả dụng của phòng linh hoạt dựa trên lịch đặt phòng thực tế (`DatPhong`) và thuật toán phát hiện xung đột ngày đặt phòng (`hasBookingConflict`).
3. **Cơ chế chống Trùng lịch (Date Overlap Check):**
   - Do API `POST /api/dat-phong` của Backend không tự động từ chối khi hai khách đặt cùng 1 phòng vào cùng khoảng ngày, Frontend đã xây dựng bộ kiểm tra ràng buộc chặt chẽ 2 lớp trước khi gửi yêu cầu lên máy chủ.

---

## 🔑 Tài khoản Demo

| Vai trò | Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@airbnb.com` | *(Tài khoản Admin đã được gán role ADMIN)* | Toàn quyền Dashboard & CRUD Admin |
| **Người dùng (User)** | `user@airbnb.com` | `123456` | Đặt phòng, đánh giá, quản lý profile cá nhân |

*(Bạn cũng có thể sử dụng tính năng Đăng ký trên giao diện để tạo tài khoản người dùng mới bất kỳ lúc nào).*

---

## 💻 Hướng dẫn Cài đặt & Chạy ứng dụng

### 1. Yêu cầu môi trường
- **Node.js:** phiên bản `18.18.0` trở lên (Khuyến nghị Node.js 20 LTS)
- **Package Manager:** `npm` (hoặc `yarn` / `pnpm`)

### 2. Cài đặt Dependencies
```bash
git clone <URL_REPO_GIT>
cd capstone_airbnb_NextJS
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc của dự án với nội dung:

```env
NEXT_PUBLIC_API_URL=https://airbnbnew.cybersoft.edu.vn/api
NEXT_PUBLIC_TOKEN_CYBERSOFT=YOUR_CYBERSOFT_TOKEN_HERE
```
*(Thay `YOUR_CYBERSOFT_TOKEN_HERE` bằng token CyberSoft được cấp).*

### 4. Khởi chạy Development Server
```bash
npm run dev
```
Mở trình duyệt và truy cập: `http://localhost:3000`

---

## 🧪 Bộ lệnh Kiểm chuẩn chất lượng (Quality Check)

Dự án đảm bảo 100% tuân thủ TypeScript Strict Mode, không có lỗi Linting, vượt qua toàn bộ Unit Tests và Build Production thành công:

### 1. Chạy ESLint (Kiểm tra quy chuẩn code)
```bash
npm run lint
```

### 2. Chạy Unit Tests (Kiểm thử logic & nghiệp vụ)
```bash
npm test
```
*Chạy toàn bộ 49 test cases bao phủ: Xử lý lỗi API, Validation Schemas (Zod), Thuật toán chống trùng lịch và Ràng buộc đặt phòng.*

### 3. Build Production Bundle
```bash
npm run build
```

---

## 📱 Khả năng Responsive & Tương thích thiết bị

Giao diện được thiết kế và kiểm thử tỉ mỉ trên đa dạng kích thước màn hình:
- **Mobile (375px - 640px):** Menu điều hướng Drawer trượt mượt mà, thanh tìm kiếm rút gọn thông minh, các bảng Admin có thanh cuộn ngang độc lập không gây tràn viền trang (No horizontal page overflow).
- **Tablet (768px - 1024px):** Layout lưới linh hoạt từ 2 - 3 cột, hiển thị tối ưu nội dung và bộ lọc tiện ích.
- **Desktop (1280px - 1440px+):** Giao diện chuẩn Airbnb cao cấp, hiển thị bản đồ, bộ lọc sticky và tương tác nhanh.

---
© 2026 Capstone Airbnb Project - CyberSoft Academy.
