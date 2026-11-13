# Luồng vào phòng — user web

## Chạy local
Từ root repo:
```powershell
npx.cmd --yes pnpm@10.34.9 dev
```
User web: http://localhost:3000; API: http://localhost:5000.
Admin vẫn chạy port 9000, giữ trang health check hiện có.

## Thử bằng hai trình duyệt
1. Mở trang chủ, nhập tên và chọn Tạo phòng UNO.
2. Lobby hiển thị mã bốn ký tự. Chọn Sao chép link mời.
3. Mở link trong cửa sổ ẩn danh/trình duyệt khác; nhập tên và vào phòng.
   Hoặc dùng Vào bằng mã ở trang chủ; chữ thường được chuyển sang chữ hoa.
4. Cả hai nhìn thấy danh sách cập nhật. Chỉ host có nút bắt đầu khả dụng khi đủ 2–4 ghế đã kết nối.
5. Host bắt đầu: cả hai thấy xác nhận ván đã chạy. Bàn bài và thao tác chơi chưa có trong mốc này.
6. Tải lại trang phòng trong 30 giây: khôi phục cùng ghế, không tạo người chơi thứ hai.
7. Rời phòng có xác nhận; người còn lại nhận cập nhật. Rời trong ván sẽ kết thúc ván theo luật realtime.

## Kiến trúc frontend
- presentation: HomeScreen, RoomEntryForm, RoomScreen, LeaveDialog.
- application: useRoomSession kết nối React với phiên.
- infrastructure: RoomSession quản lý SDK, request/reply, token và cleanup; session-storage bọc browser storage.
- model: thông báo lỗi dễ hiểu.
- app: chỉ ghép route/layout; room params được await theo Next.js App Router.

Một phiên Colyseus cho mỗi tab. Phiên giữ qua điều hướng nội bộ; logo về trang chủ
sẽ cho quay lại phòng hiện tại. Nút Rời phòng mới giải phóng ghế có chủ đích.
Token nằm trong sessionStorage, không xuất hiện trong URL hoặc log. Không dùng localStorage
để chia sẻ token giữa các tab. Nếu storage bị chặn, phiên vẫn chạy nhưng reload có thể không phục hồi.
Link chỉ chứa roomId, người nhận link tạo guest riêng.

GET_VIEW sau khi gắn listener khắc phục snapshot ban đầu đến trước UI.
START_GAME dùng requestId riêng và expectedRoomRevision; chờ action_reply, không tự gửi lại mù quáng.
Snapshot từ server quyết định trạng thái; không tự đánh dấu bắt đầu ở client.
Kết nối lại tự động của SDK cập nhật token và yêu cầu snapshot mới.
Nếu phiên hết hạn/không khôi phục được, UI cho nhập tên để thử vào phòng đang chờ.
Không tự tạo phòng khác hoặc giả định đã bắt đầu khi API không phản hồi.

## UX
Desktop và mobile; lobby được cuộn để đủ chỗ cho bốn ghế và bảng mời.
Form có label/validation, trạng thái chờ/lỗi, nút thử lại, clipboard có fallback chọn link thủ công.
Dialog native giữ focus, hỗ trợ Escape và xác nhận trước khi rời.
Phòng đã bắt đầu không nhận người mới: nút sao chép mời bị vô hiệu hóa có giải thích.
Ván kết thúc chỉ còn một người: hướng dẫn tạo phòng mới, vì phòng cũ không nhận người mới.

## Browser tests
Đã thêm Playwright, không cài browser hoặc thay đổi thiết lập máy.
Mặc định chạy Chromium; nếu chưa có, có thể dùng Edge đã cài trên Windows:
```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e
```
Nếu chưa chạy server, Playwright khởi động API/web và dừng các process do test tạo.
Nếu đã có server trên port 5000/3000, dùng lại; cần bảo đảm đúng repo và phiên bản code hiện tại.
Artifacts trong apps/meepleverse-user-web/test-results được Git bỏ qua.

Test gồm hai browser context vào/bắt đầu cùng phòng, link mời, nhập mã chữ thường,
reload giữ ghế, chuyển host, xác nhận rời, phòng không tồn tại, lỗi mạng và responsive 375px.
Chưa có Docker, CI/CD, MongoDB, đăng nhập hoặc board UI trong bước này.
