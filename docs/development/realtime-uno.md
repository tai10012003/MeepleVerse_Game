# UNO realtime — local v1

## Chạy và kiểm tra
Từ root:
- npx.cmd --yes pnpm@10.34.9 dev:api
- npx.cmd --yes pnpm@10.34.9 test
- Chỉ realtime: npx.cmd --yes pnpm@10.34.9 --filter meepleverse-api test tests/integration/realtime/uno-room.test.ts

HTTP /health và WebSocket Colyseus dùng chung port 5000. Không có bàn chơi frontend trong bước này.
SDK dùng @colyseus/sdk 0.18.x; core/transport dùng cùng nhánh 0.18.
Tham khảo API [Colyseus](https://docs.colyseus.io/server) và
[reconnection](https://docs.colyseus.io/room/reconnection).

## Vào phòng
Dùng sdk.create("uno", { nickname }) tạo phòng, nhận room.roomId gồm 4 ký tự A–Z/0–9.
Dùng sdk.joinById(code, { nickname }) vào phòng đã biết mã.
Nickname sau trim có 1–24 ký tự. Payload không nhận playerId, hostId hoặc thiết lập server.
Mỗi lần tham gia mới được cấp UUID riêng trong phạm vi phòng; chưa phải danh tính tài khoản lâu dài.
Mã phòng được cấp đồng bộ bằng bộ nhớ tiến trình; trả lại khi phòng dispose.
Chỉ hỗ trợ một tiến trình ở giai đoạn hiện tại.

LOBBY cho 2–4 người bắt đầu; tối đa 4 ghế gồm cả ghế đang chờ reconnect.
Phòng private không tự ghép người lạ, không xuất hiện trong danh sách public.
Chỉ host được bắt đầu. Host rời lobby thì chuyển quyền cho người còn lại.
Sau khi bắt đầu, không nhận người mới, kể cả khi đã kết thúc; nhóm cũ có thể chơi lại.
Muốn thêm người sau khi ván bắt đầu: tạo phòng mới.
Mã mời không phải mật khẩu; chưa có phòng mật khẩu hoặc xác thực tài khoản.

## Giao thức
Client đăng ký listener trước, sau đó send("get_view") để lấy snapshot hiện tại.

Messages server:
- room_view: UnoRoomView trong @meepleverse/contracts/room, gồm public room và UNO view riêng của người nhận.
- action_reply: RoomActionReply, có requestId, ok, code lỗi và các revision.
- game_events: RoomGameEvents; chỉ chứa public events và private events dành cho chính người nhận.

Client send("action", { requestId, action }):
- START_GAME: { type: "START_GAME", expectedRoomRevision }
- GAME_COMMAND: { type: "GAME_COMMAND", matchId, expectedRevision, command }
command theo đặc tả docs/games/uno.md. Identity luôn lấy từ kết nối server.

Mỗi requestId là chuỗi tối đa 64 ký tự, phải mới cho mỗi ý định; retry giữ nguyên ID và nội dung.
Cache giữ 100 kết quả gần nhất cho mỗi guest, cả thành công/lỗi, tồn tại qua reconnect.
Retry cùng nội dung trả receipt cũ, snapshot hiện tại, không lặp lại hành động/events.
Đổi nội dung nhưng dùng lại ID: REQUEST_ID_CONFLICT.
matchId mới cho mỗi ván và expectedRevision ngăn thao tác cũ tác động ván/lượt mới.
START_GAME kiểm tra revision phòng vì thành viên có thể đã thay đổi.
Sau lỗi stale, lấy view mới và xác nhận lại ý định; không tự gửi mù quáng.
Malformed envelope trả requestId=null; các lỗi nghiệp vụ gửi riêng người gửi.
Snapshots là nguồn dữ liệu chính; events phục vụ hiệu ứng, không phải nhật ký bền vững.

## Đồng bộ và quyền riêng tư
Public Colyseus schema dùng binary patches cho trạng thái phòng, lượt, màu và số bài.
Không chứa tay bài, chồng bốc hoặc bằng chứng +4.
Snapshot đầy đủ theo người được gửi riêng qua room_view sau thay đổi và khi reconnect.
Bằng chứng +4 chỉ có trong game_events riêng của challenger; không broadcast.
Không xuất UnoGame hoặc service trực tiếp qua transport.
CORS HTTP và Origin WebSocket dùng cùng allowlist trong CORS_ORIGINS.
SDK native không gửi Origin vẫn được dùng; Origin không thay thế xác thực.
Giới hạn transport 8 KiB/message và 40 message/giây/client; chưa có chống spam tạo phòng trên HTTP.

## Mất mạng và rời phòng
Mặc định allowReconnection 30 giây; không nhận thời gian này từ client.
Trong thời gian chờ, giữ identity/tay bài và tạm dừng tất cả hành động ván.
onReconnect gửi lại view riêng và tiếp tục khi mọi ghế còn lại đã kết nối.
Lưu room.reconnectionToken ở client, cập nhật khi reconnect thành công; không chia sẻ hoặc ghi log token.
SDK có thể tự reconnect; reload trang dùng sdk.reconnect(token), gắn lại listeners rồi get_view.
room.leave() là rời có chủ đích, không chờ reconnect.
Rời hẳn/quá hạn: kết thúc ván hiện tại. Hai người => người còn lại thắng bỏ cuộc;
ba/bốn người => hủy ván, không có người thắng. Không sửa domain hoặc bỏ ghế giữa lượt.
Người còn lại có thể rematch nếu đủ ít nhất hai ghế đã kết nối.
Thông tin kết thúc này nằm ở outcome, game=null khi ván bị ngắt; chưa cộng điểm hoặc lưu DB.

## Phạm vi và kiểm thử
Integration test dùng cổng ngẫu nhiên, reconnect 0.5 giây để không đợi 30 giây mỗi lần.
Game factory/timeout test là cấu hình server qua closure, client không thay được.
Test chơi thật 2/3/4 client đến hết ván và rematch; kiểm tra lỗi, dedup, bài riêng,
evidence, reconnect, hết hạn và chuyển host.
Chưa có MongoDB, phục hồi server crash, turn timer, bot, UI hoặc lưu replay.
Restart server làm mất phòng/ghế/receipts; client cần tạo/vào phòng mới.
