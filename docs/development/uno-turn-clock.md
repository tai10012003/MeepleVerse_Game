# Đồng hồ lượt UNO

Ngày: 22/11/2026. Áp dụng cho Cơ bản và Mở rộng, do server quyết định.

| Trạng thái | Thời hạn | Hết giờ |
| --- | --- | --- |
| Lượt thường | 30 giây | Bỏ lượt, không tự bốc |
| Đã bốc một lá | Phần còn lại của lượt thường | Giữ lá vừa bốc, bỏ lượt |
| Đáp cộng dồn | 30 giây | Tự nhận toàn bộ phạt, mất lượt |
| Tăng tiến | 20 giây mỗi lần đáp | Server đánh lá hợp lệ đầu tiên theo thứ tự tay bài, không tự hô UNO |
| Battle | 20 giây mỗi giai đoạn | Giữ fallback chọn lá/chọn thưởng đã có, không tự hô UNO |
| Đập tay | 1 giây chuẩn bị + 5 giây phản ứng | Giữ luật người cuối/người chưa bấm đã chốt |

Bốc bài, chọn lá, mở hướng dẫn hoặc popup màu/mục tiêu/÷2 không đặt lại thời gian. Popup chưa xác nhận chưa làm đổi game: hết giờ thì bỏ lượt thường hoặc nhận phạt nếu đang cộng dồn. Lá Cấm/Đảo chiều trả lượt về cùng người vẫn bắt đầu một lượt mới đủ 30 giây.

Cơ bản có bước chọn màu sau khi người nhận đã bốc phạt +4. Người đánh +4 có 30 giây cho bước này; hết giờ server chọn màu xuất hiện nhiều nhất trên tay họ, hòa theo thứ tự đỏ/vàng/xanh lá/xanh dương. Đây là bước đã đánh bài, không thể hủy hoặc để treo ván; sau đó tiếp tục đúng người sau người nhận phạt. Không trộn quy tắc này với lá Wild chưa xác nhận trong popup.

Mất kết nối: phòng dừng cả đồng hồ lượt và mini-game. Nhiều người mất kết nối không đóng băng lần hai; chỉ tiếp tục khi mọi người trở lại, dùng phần thời gian còn lại. Đập tay giữ cơ chế hiệu lệnh/attempt mới đã có. Hết ván, rời phòng, rematch hoặc dispose đều dọn đồng hồ/lịch cũ.

## Kiến trúc

- `room/application/turn-clock.ts`: mặc định 30000/20000 ms, snapshot công khai, giữ/tiếp tục thời gian. Không chứa luật bài.
- Hai game service sở hữu clock; domain `timeout-turn.ts` xử lý bỏ lượt/nhận phạt/đáp Up bằng các luật hiện có. Timeout không phải command client tự gửi để bỏ lượt tùy ý.
- `GameRoom` quản lý một lịch gần nhất, dùng chung với clock Battle/Đập tay. Trước khi xử lý command mới, giải quyết deadline đã đến; sau đó revision/match/effect kiểm tra gói tin trễ. Callback ván cũ không chạy vào rematch.
- `turnClock` trong room view chứa người đang phải thao tác, ID lượt, deadline, thời gian còn lại và giờ server. Tương thích view cũ bằng field optional; server mới luôn gửi clock hoặc null. Không broadcast mỗi giây và không đưa private hand vào schema.
- `TurnCountdown` dùng mốc giờ server để vẽ, tự cập nhật trên client; client không quyết định hết lượt. Hiển thị cạnh avatar đối thủ, hoặc avatar của mình cạnh trạng thái lượt. Khi còn <=5 giây đổi màu; người phải thao tác nghe một âm báo mỗi lượt, dùng thiết lập âm lượng sẵn có. Battle cảnh báo cho người còn phải chọn; Đập tay giữ hiệu lệnh cũ.
- Chọn bài/UNO ở client gắn revision hiện có: khi timeout đổi game, lựa chọn/popup cũ không gửi thành nước đi của lượt sau.

## Kiểm tra

```powershell
npm run test
npm run typecheck
npm run lint

# Chỉ test server nhận các giá trị rút ngắn này; bản thật vẫn 30/20 giây.
$env:PLAYWRIGHT_CHANNEL='msedge'
$env:BROWSER_TURN_MS='10000'
$env:BROWSER_UP_MS='6000'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e --grep 'turn clock:'
Remove-Item Env:BROWSER_TURN_MS
Remove-Item Env:BROWSER_UP_MS
```

Test đồng hồ cũng chạy được trong toàn bộ suite không có override, khi đó dùng đúng 30/20 giây và thời gian chờ tương ứng.

Bổ sung 19 ca service/domain và 6 ca WebSocket cho hai bản: biên deadline, không bốc khi bỏ lượt, giữ lá đã bốc, pause nhiều người, cùng người có lượt mới, packet trễ, không reset vì thao tác sai/get_view, nhận phạt, màu +4, rematch, Up tự đáp và UNO. Năm ca UI kiểm tra cảnh báo, đồng bộ hai client, popup chưa xác nhận, giữ thời gian khi bốc/reconnect và tự đáp Up. Các test cũ kiểm tra snapshot bất biến tiếp tục so toàn bộ trạng thái/ID/deadline, chỉ cho phép giờ server và phần còn lại trôi tự nhiên.

Đã cập nhật hướng dẫn trong popup. Bản này chưa commit hoặc deploy; production build và thử nhóm người thật vẫn là các bước riêng.


## Kết quả kiểm tra

- **383/383 kiểm thử backend, 32 file đạt**, gồm 25 ca mới cho deadline và WebSocket.
- **10 ca UI riêng biệt đạt**: 5 ca đồng hồ với server test rút ngắn 10/6 giây; 5 ca hồi quy Battle, Đập tay bốn người và hướng dẫn Cơ bản với thời hạn mặc định.
- TypeScript và lint toàn workspace đạt. Đã xem ảnh cảnh báo ở mobile; không tràn ngang.

Không dùng thời hạn rút ngắn trong bootstrap thường. Không chạy production build, deploy hay test bốn người qua Internet ở thay đổi này.
