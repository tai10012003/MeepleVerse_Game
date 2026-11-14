# Chạy local

Yêu cầu Node.js 24 LTS. Chạy lệnh tại thư mục gốc repo.
Trên Windows dùng npx.cmd nếu PowerShell chặn file .ps1.
Không cần cài pnpm global.

```powershell
npx.cmd --yes pnpm@10.34.9 install
Copy-Item apps/meepleverse-api/.env.example apps/meepleverse-api/.env
Copy-Item apps/meepleverse-user-web/.env.example apps/meepleverse-user-web/.env.local
Copy-Item apps/meepleverse-admin-portal/.env.example apps/meepleverse-admin-portal/.env.local
npx.cmd --yes pnpm@10.34.9 dev
```

Các file môi trường local được Git bỏ qua. Chỉ sao chép khi chưa có file để tránh ghi đè cấu hình riêng.

- User: http://localhost:3000
- API: http://localhost:5000/health
- Admin: http://localhost:9000

Admin giữ health check. User web đã có lobby và bàn UNO chơi hoàn chỉnh; xem user-lobby.md và uno-table.md.
Backend chỉ cho phép CORS cho các origin trong CORS_ORIGINS.
Đây chưa phải cơ chế xác thực hoặc phân quyền.

Chạy riêng: thay dev bằng dev:user, dev:admin hoặc dev:api.
Kiểm tra: thay dev bằng typecheck, lint hoặc build.
Sau build, dùng pnpm --filter <tên-app> start (hoặc npx.cmd --yes pnpm@10.34.9 --filter <tên-app> start).

Đã có domain UNO và phòng Colyseus realtime trên port 5000. Chưa tích hợp MongoDB hoặc đăng nhập tài khoản. Xem realtime-uno.md.
Realtime có test SDK Node và test trình duyệt cho user lobby.
Các route phụ hiện chỉ là placeholder; các file module khác vẫn là khung rỗng.
Không có Docker, CI/CD hoặc AI.

ESLint được ghim ở 9.39.5 để tương thích các plugin của eslint-config-next hiện tại. npm thông báo nhánh này đã hết hỗ trợ; cần nâng đồng bộ khi plugin hỗ trợ ESLint mới.

Chạy test UNO: npx.cmd --yes pnpm@10.34.9 test. Xem docs/games/uno.md.
