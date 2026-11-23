# UNO — luật MeepleVerse v3

Mã luật: `uno-house-v3`. Bộ bài 108 lá, 2–4 người, chia 7 lá mỗi người.
Tham khảo bộ bài cổ điển [Mattel W2085](https://service.mattel.com/instruction_sheets/W2085-UNO.pdf).
Cộng dồn và phạt UNO dưới đây là luật riêng MeepleVerse.

## Bộ bài và lượt thường
- Mỗi màu: một số 0, hai bản số 1–9, hai Skip, hai Reverse, hai Draw Two.
  Thêm bốn Wild và bốn Wild Draw Four.
- Đánh cùng màu, số hoặc biểu tượng; Wild thường chọn màu khi đánh.
- +4 được đánh tự do trong lượt thường, không phải chọn màu và không có thách thức.
- Được chủ động bốc 1 lá; sau đó chỉ đánh lá vừa bốc hoặc bỏ lượt.
  Nếu lá vừa bốc không đánh được thì tự chuyển lượt.
- Skip bỏ người kế; Reverse đổi chiều. Hai người: Skip/Reverse trả lượt về người đánh.
- Hết chồng bốc thì xào lại chồng bỏ, giữ lá trên cùng. Nếu không đủ bài thì bốc tối đa
  số có thể, không tạo thêm lá. Một vòng bốc thường không lấy được lá nào thì kết thúc blocked.

## Chuỗi cộng dồn +2/+4
- Đánh +2 hoặc +4 mở phase draw-stack, pendingDraw tăng 2 hoặc 4, chuyển sang người kế.
- Người kế được nối bất kỳ +2/+4, bất kể màu và giá trị; hoặc chọn nhận toàn bộ phạt.
  Không được đánh số, Wild thường, Skip, Reverse, bốc một lá hay bỏ lượt trong chuỗi.
- Nhận phạt qua ACCEPT_DRAW_PENALTY: bốc một lần toàn bộ tổng phạt và đặt pendingDraw=0.
- Lá cuối là +2: giữ màu của lá đó, người nhận mất lượt, chuyển người kế.
- Lá cuối là +4: người nhận bốc toàn bộ tổng phạt; chuyển quyền CHOOSE_COLOR về người
  đánh +4 cuối cùng ở phase penalty-color, rồi chuyển tới người sau người nhận phạt
  theo chiều hiện hành. Người nhận không được chọn màu hoặc dùng bài mới để nối lại chuỗi.
- Ví dụ A +2, B +4, C +4, D nhận 10 lá: C chọn màu, rồi tới A.
- Ví dụ A +4, B +2 đỏ, C nhận 6 lá: màu đỏ, rồi tới A.
- Quy tắc chọn màu này áp dụng cả +4 đơn lẻ và chuỗi cộng. Chuỗi và bước chọn màu nằm trong state server, được phục hồi sau reload/reconnect.
- Lá mở đầu luôn là số 0–9 để xác định màu và số. Sau khi chia 7 lá mỗi người,
  rút cho tới khi gặp lá số; các lá chức năng gặp trước đó được để riêng và trộn lại
  vào chồng bốc. Không áp dụng hiệu lực chức năng lúc mở ván, không tạo tổng phạt.
  Ghế sau dealer đi đầu, chiều mặc định +1, phase turn và pendingDraw=0.

## UNO và kết quả
- Còn hai lá: bấm UNO trước khi đánh, gửi declareUno=true cùng PLAY_CARD.
  Quên khi đánh xuống một lá: tự bốc 2 ngay, không cần người khác bắt, không cho hô muộn.
- Phạt UNO là riêng: không cộng vào pendingDraw; tác dụng lá vừa đánh vẫn áp dụng.
  Nước sai không bị phạt, đánh lá cuối cùng không cần declareUno.
- Người đánh hết bài thắng. Nếu lá cuối là +2/+4, người kế tự nhận toàn bộ tổng phạt
  trước tính điểm, không được nối tiếp và không phải chọn màu sau khi ván đã kết thúc.
- Điểm bài số theo giá trị; Skip/Reverse/+2 là 20, Wild/+4 là 50.
  Điểm thắng bằng tổng điểm còn lại của đối phương. Chưa có giải đến 500 điểm, đội hay xếp hạng.

## Hợp đồng và quyền riêng tư
createGame(playerIds, random?, dealerIndex?) tạo state. applyCommand trả state mới và public events.
Lỗi không sửa input; mỗi command hợp lệ tăng revision. Actor lấy từ kết nối đã xác thực.
Phases: turn, drawn, choose-color, draw-stack, penalty-color, ended.
Commands: PLAY_CARD, DRAW_CARD, PASS_TURN, CHOOSE_COLOR, ACCEPT_DRAW_PENALTY.
chosenColor chỉ dành cho Wild thường; +4 không nhận chosenColor.
Các lệnh thách thức, chấp nhận +4 cũ, CALL_UNO/CATCH_UNO bị từ chối.

Domain giữ toàn bộ bài nhưng không broadcast UnoGame. getPlayerView chỉ gửi tay bài của
người nhận, số bài đối phương, tối đa 8 lá bỏ gần nhất, tổng phạt và trạng thái lượt.
Public events bốc bài chỉ chứa playerId và số lượng, không chứa mặt bài, ID bài bốc hoặc bằng chứng.
Không còn dữ liệu bằng chứng +4 hay event thách thức. View là bản sao, không sửa được domain qua tham chiếu.

## Kiểm thử
Từ root: `npx.cmd --yes pnpm@10.34.9 test`.
Bao gồm setup, validation, chức năng, cộng dồn, chọn màu sau phạt, UNO, scoring,
quyền riêng tư, realtime và 100 ván seed bảo toàn đủ 108 lá sau mỗi lệnh.
MongoDB, phục hồi server crash, bot và timer lượt chưa được triển khai.


## Đồng hồ lượt — 22/11/2026

Mỗi lượt thường/đáp cộng dồn có 60 giây. Bốc bài và mở popup không đặt lại giờ. Hết giờ thường thì bỏ lượt, giữ lá đã bốc; đang chịu phạt thì tự nhận toàn bộ. Bước chọn màu sau +4 nếu hết giờ sẽ chọn màu theo tay người đánh để tiếp tục. Phòng mất kết nối giữ thời gian còn lại. Xem [đồng hồ và kiểm thử](../development/uno-turn-clock.md).
