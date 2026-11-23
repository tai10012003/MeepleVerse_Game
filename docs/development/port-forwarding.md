# Thử chơi qua VS Code Port Forwarding

Ngày: 23/11/2026. Dùng cho thử nghiệm qua Internet từ máy phát triển, chưa phải triển khai production.

## Chạy và forward hai dịch vụ

Tại gốc repo, mở hai terminal và giữ chúng chạy:

```powershell
npm run dev:api   # HTTP + Colyseus, cổng 5000
npm run dev:user  # Next.js, cổng 3000
```

Xác minh `http://localhost:3000` mở được và `http://localhost:5000/health` trả JSON status ok. Chỉ thêm port vào VS Code không khởi động ứng dụng; khi dịch vụ chưa chạy, tunnel có thể trả 502.

Trong Ports, forward cả **3000 và 5000**, đặt Public để khách không phải đăng nhập tài khoản của chủ tunnel. Hai ứng dụng local dùng HTTP; địa chỉ công khai do tunnel cấp dùng HTTPS. Copy chính xác Forwarded Address của từng cổng.

## Cấu hình local

Các giá trị dưới đây là mẫu; thay YOUR-API-HOST/YOUR-WEB-HOST bằng hostname thực từ VS Code.

`apps/meepleverse-user-web/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=https://YOUR-API-HOST.devtunnels.ms
NEXT_DEV_ALLOWED_ORIGINS=YOUR-WEB-HOST.devtunnels.ms
```

API URL phải là địa chỉ HTTPS của cổng 5000, không phải localhost:5000 và không phải URL web 3000. Khi người khác mở web, localhost trỏ về chính máy họ. NEXT_DEV_ALLOWED_ORIGINS chỉ nhận hostname web, không có https://, path hoặc port; có thể ngăn cách nhiều hostname bằng dấu phẩy. Next development dùng danh sách này để cho phép tài nguyên/HMR từ địa chỉ tunnel.

`apps/meepleverse-api/.env`:

```dotenv
PORT=5000
CORS_ORIGINS=http://localhost:3000,http://localhost:9000,https://YOUR-WEB-HOST.devtunnels.ms
```

CORS phải là origin **của web**, không phải API; dùng HTTPS, không dấu / cuối và giữ origin local nếu vẫn mở localhost. API kiểm tra cả HTTP matchmaking và WebSocket bằng allowlist này. Không dùng wildcard để né lỗi.

Sau khi sửa môi trường, dừng và khởi động lại hai tiến trình nếu cấu hình chưa được nạp. File .env local được bỏ qua bởi Git. Nếu VS Code đổi địa chỉ tunnel, cập nhật lại các giá trị tương ứng.

## Mở và kiểm tra

Mở URL cổng 3000. Ở trình duyệt mới, Microsoft có thể hiện trang “You are about to connect to a developer tunnel”; chọn Continue cho tunnel bạn vừa tạo để vào web.

Thử hai trình duyệt/phiên ẩn danh: tạo phòng, vào bằng mã/link và bắt đầu. Chỉ mở được trang chủ chưa chứng minh kết nối game hoạt động: matchmaking HTTP và WebSocket cũng phải tới đúng API 5000. Không cần forward admin 9000 để chơi.

Khi ngừng dùng tunnel và quay về local, đặt lại NEXT_PUBLIC_API_URL=http://localhost:5000 rồi khởi động lại web. Địa chỉ tunnel và quyền Public chỉ phục vụ thử nghiệm hiện tại.

Tham khảo: [VS Code Port Forwarding](https://code.visualstudio.com/docs/debugtest/port-forwarding). Cấu hình Next dựa theo tài liệu allowedDevOrigins của phiên bản đã cài trong node_modules/next/dist/docs.


## Kiểm tra cấu hình lần này

Đã xác nhận web/API local và cả hai tunnel trả 200; API health qua tunnel trả JSON và CORS đúng web origin. Đã thử hai browser context độc lập (desktop/mobile) qua URL công khai: xác nhận trang Microsoft, tạo phòng UNO Mở rộng, vào bằng mã, bắt đầu và nhận 7 lá mỗi người qua HTTPS/WebSocket; sau đó rời phòng kiểm thử. Đây là kiểm tra kết nối, không thay thế chơi trọn ván với bốn người trên mạng thật.

Cũng đã chặn form tạo/vào phòng cho tới khi React sẵn sàng: qua tunnel chậm, HTML có thể hiện trước JavaScript; trước đây bấm quá sớm có thể submit GET thông thường và chỉ thêm nickname vào URL. Nút hiện Đang tải… rồi mở lại khi giao diện xử lý được thao tác. Không cần thay luật game để sửa kết nối.
