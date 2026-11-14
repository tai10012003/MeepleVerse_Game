# Bàn chơi UNO — user web

## Chơi thử
Tại root repo, chạy API và user web trong hai terminal:
```powershell
npx.cmd --yes pnpm@10.34.9 dev:api
npx.cmd --yes pnpm@10.34.9 dev:user
```
Nếu các ứng dụng đang chạy thì dùng lại.
Mở http://localhost:3000, chọn UNO Cơ bản → Chơi ngay, tạo phòng và gửi link sang cửa sổ ẩn danh/trình duyệt khác.
Sau khi đủ 2–4 người, chủ phòng bắt đầu; cả nhóm vào bàn chơi.

- Chọn một lá trên tay, rồi bấm Đánh lá bài.
- Lá không phù hợp hoặc chưa đến lượt không chọn được; server vẫn kiểm tra mọi lệnh.
- Bốc bài: nếu lá vừa bốc đánh được, chọn nó hoặc Bỏ lượt. Không đánh lá cũ sau khi bốc.
- Wild thường mở hộp chọn màu; có thể hủy chọn để đổi lá trước khi gửi nước đi.
- Nút UNO luôn hiển thị, sáng hiệu ứng khi còn hai lá. Trong lượt của mình, bấm nút trước khi đánh.
- Trạng thái Đã hô chỉ áp dụng cho nước đánh kế tiếp; không tự hô sẵn. Hủy chọn màu vẫn giữ trạng thái này.
- Quên hô khi đánh từ hai xuống một lá: server tự phạt bốc hai ngay; không có nút bắt lỗi/hô muộn.
- Luật riêng này dùng mã uno-house-v3; tạo phòng mới khi thử phiên bản đã cập nhật.
- +2/+4 cộng dồn bất kỳ màu. Khi chịu phạt chỉ chọn lá cộng hoặc Nhận N lá.
- Lá cuối +2 giữ màu lá đó. Lá cuối +4: người đánh +4 cuối chọn màu sau khi đối phương nhận phạt; lượt chuyển tới người sau người nhận.
- +4 không mở hộp chọn màu cho người đánh; bỏ hoàn toàn thách thức và bằng chứng.
- Kết quả hiển thị điểm bài còn lại và điểm thắng. Chủ phòng mở ván mới.
- Mobile có vuốt ngang tay bài, bàn chơi nằm trong chiều cao màn hình.
- Rời phòng vẫn có xác nhận; mất kết nối tạm dừng điều khiển, reload khôi phục ghế trong thời hạn server.

## Ranh giới và dữ liệu
RoomSession dùng chung pipeline request/reply cho START_GAME và GAME_COMMAND.
Mỗi hành động có requestId, matchId và expectedRevision từ snapshot mới nhất.
Khóa thao tác khi đang chờ phản hồi, mất kết nối, tạm dừng hoặc đã kết thúc.
Không tự xóa bài hay chốt người thắng trước xác nhận server.
Timeout không tự lặp lại lệnh; yêu cầu snapshot để người chơi kiểm tra trạng thái.

Module games/uno chỉ dùng contracts công khai.
isPlayable phục vụ gợi ý UI; luật domain server vẫn là nguồn quyết định.
Đối thủ chỉ có số bài, không có mặt bài trong DOM.
Tổng phạt và bước người đánh +4 cuối chọn màu sau nhận phạt phục hồi qua snapshot sau reload/reconnect.
Reload có thể mất thông báo đã gửi trước đó vì events chưa có replay bền vững.
Bài và kết quả được khôi phục từ snapshot. Dữ liệu không được lưu MongoDB trong bước này.

## Browser test
```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e
```
Test tự khởi động các process riêng rồi dừng:
- Next.js: 3100, build folder .next-e2e.
- API test: 5100.
- Fixture controller: 5101, chỉ bind loopback.
Các cổng sản phẩm vẫn là 3000/5000/9000; test không dừng hoặc dùng lại các phiên dev này.

tests/browser/server.ts là entry point riêng trong API tests, không import vào production.
Fixture chọn thế bài chỉ ở process test; không thêm quyền chọn bộ bài hay endpoint test vào API sản phẩm.
Test gồm chơi hết ván hai trình duyệt và rematch, bốc/bỏ lượt, reload giữ bài,
Wild, chuỗi +2/+4 và bảo mật tay bài, UNO, bốn người trên mobile, pause/resume và màn hình ngang.
Artifacts test-results, playwright-report và .next-e2e được Git bỏ qua.

## Phần tiếp theo
Đã có hiệu ứng đánh bài, chức năng, bốc bài và chuyển lượt; xem uno-animations.md. Chia bài đầu ván và âm thanh là phần tiếp theo.
