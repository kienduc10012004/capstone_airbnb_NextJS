# Airbnb Capstone

Ứng dụng đặt phòng Airbnb xây dựng bằng Next.js 16, React 19 và TypeScript.

## Công nghệ

- Next.js App Router
- TypeScript strict
- Tailwind CSS 4
- Axios
- Zustand
- React Hook Form và Zod

## Cài đặt

```bash
npm install
npm run dev
```

Ứng dụng chạy tại `http://localhost:3000`.

## Biến môi trường

Tạo file `.env`:

```env
NEXT_PUBLIC_API_URL=https://airbnbnew.cybersoft.edu.vn/api
NEXT_PUBLIC_TOKEN_CYBERSOFT=your_token
```

Không commit file `.env` hoặc token thật lên Git.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Route người dùng

- `/`: trang chủ và vị trí nổi bật
- `/rooms`: tìm kiếm, lọc và phân trang phòng
- `/rooms/[id]`: chi tiết, bình luận và đặt phòng
- `/locations`: tìm kiếm và phân trang vị trí
- `/locations/[id]`: chi tiết vị trí và phòng liên quan
- `/profile`: hồ sơ, avatar và lịch sử đặt phòng

## Route quản trị

- `/admin`: dashboard
- `/admin/users`: CRUD người dùng
- `/admin/locations`: CRUD và upload hình vị trí
- `/admin/rooms`: CRUD và upload hình phòng
- `/admin/bookings`: xem, cập nhật và hủy đặt phòng

## Quy chuẩn

Toàn bộ quy chuẩn Clean Code, cấu trúc, màu sắc và responsive được mô tả
trong `des.txt`.

## Kiểm tra trước khi bàn giao

```bash
npm run lint
npm run build
```
