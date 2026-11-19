# Chạy local

Yêu cầu Node.js 24 LTS. Chạy lệnh tại thư mục gốc repo `D:\HocTap\MeepleVerse_Game`.
Không cần cài pnpm global: các script npm tự gọi pnpm phiên bản 10.34.9.
Trên Windows dùng `npm.cmd` hoặc `npx.cmd` nếu PowerShell chặn file `.ps1`.

## Cài đặt lần đầu

```powershell
npx.cmd --yes pnpm@10.34.9 install
Copy-Item apps/meepleverse-api/.env.example apps/meepleverse-api/.env
Copy-Item apps/meepleverse-user-web/.env.example apps/meepleverse-user-web/.env.local
Copy-Item apps/meepleverse-admin-portal/.env.example apps/meepleverse-admin-portal/.env.local
```

Các file môi trường local được Git bỏ qua. Chỉ sao chép khi chưa có file để tránh ghi đè cấu hình riêng.
Dùng pnpm để cài dependencies của workspace; không dùng `npm install`.
Lần đầu gọi script, npx có thể cần tải pnpm; các lần sau sử dụng cache.

## Chạy hằng ngày

Chạy cả ba ứng dụng trong một terminal:

```powershell
npm run dev
```

Hoặc mở các terminal riêng:

```powershell
npm run dev:user
npm run dev:api
npm run dev:admin
```

- User: http://localhost:3000
- API: http://localhost:5000/health
- Admin: http://localhost:9000

Nhấn `Ctrl+C` để dừng. Nếu PowerShell chặn `npm`, dùng cùng lệnh với `npm.cmd`, ví dụ `npm.cmd run dev:user`.

Admin giữ health check. User web đã có lobby và bàn UNO chơi hoàn chỉnh; xem user-lobby.md và uno-table.md.
Backend chỉ cho phép CORS cho các origin trong CORS_ORIGINS.
Đây chưa phải cơ chế xác thực hoặc phân quyền.

## Kiểm tra và build

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

Sau build, dùng `npx.cmd --yes pnpm@10.34.9 --filter <tên-app> start`.

Đã có domain UNO và phòng Colyseus realtime trên port 5000. Chưa tích hợp MongoDB hoặc đăng nhập tài khoản. Xem realtime-uno.md.
Realtime có test SDK Node và test trình duyệt cho user lobby.
Các route phụ hiện chỉ là placeholder; các file module khác vẫn là khung rỗng.
Không có Docker, CI/CD hoặc AI.

ESLint được ghim ở 9.39.5 để tương thích các plugin của eslint-config-next hiện tại. npm thông báo nhánh này đã hết hỗ trợ; cần nâng đồng bộ khi plugin hỗ trợ ESLint mới.

Test UNO: xem docs/games/uno.md.
