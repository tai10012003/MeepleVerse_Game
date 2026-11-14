# UNO — luật MeepleVerse v2

## Phạm vi và nguồn luật
Mã luật: uno-house-v2. Đây là đặc tả triển khai MeepleVerse, không phải bản sao hướng dẫn.
Nguồn chính: [Mattel W2085](https://service.mattel.com/instruction_sheets/W2085-UNO.pdf).
Tham khảo cơ chế hai người và bluff; cách phạt quên UNO dưới đây là luật riêng của MeepleVerse:
[Mattel H9022](https://service.mattel.com/instruction_sheets/h9022.pdf); không dùng lá bổ sung của bộ H9022.

Bộ bài 108 lá: mỗi màu có một số 0, hai bản số 1–9, hai Skip, hai Reverse,
hai Draw Two; thêm bốn Wild và bốn Wild Draw Four. Chia bảy lá mỗi người.
Đánh cùng màu, số hoặc biểu tượng; Wild chọn màu. Được chủ động bốc một lá,
sau đó chỉ đánh lá vừa bốc hoặc bỏ lượt. Lá không hợp lệ tự chuyển lượt.
Skip bỏ người kế; Reverse đảo chiều; Draw Two bắt người kế bốc hai và mất lượt.
Wild Draw Four yêu cầu không có màu hiện hành trên tay. Hết chồng bốc thì xào bài bỏ,
giữ lá trên cùng. Điểm bài: số theo giá trị, lá chức năng màu 20, Wild 50.
Hết bài kết thúc ván; bài phạt cuối vẫn được xử lý trước tính điểm.

Với hai người, Skip/Reverse trả lượt về người đánh.
Cho phép bluff +4. Người chịu phạt chọn chấp nhận hoặc thách thức: bắt đúng thì
người đánh bốc bốn và người thách thức giữ lượt; bắt sai thì bốc sáu và mất lượt.
Bằng chứng tay bài trước nước đi chỉ gửi người thách thức.
Khi còn hai lá, phải bấm UNO trước khi đánh để còn một lá. Nếu quên, server tự phạt
bốc hai ngay trong nước đánh; không có thao tác bắt lỗi hoặc hô muộn. Hiệu lực lá vừa đánh vẫn áp dụng.

## Lựa chọn sản phẩm
- 2–4 người, một ván độc lập; chưa có giải nhiều ván đến 500 điểm, đội hoặc xếp hạng.
- Server chọn dealer ngẫu nhiên; application có thể cấp dealerIndex hợp lệ.
- Theo thứ tự ghế: hướng +1 là chiều mặc định. Chia từng vòng từ ghế sau dealer.
- Lá mở: số => ghế sau dealer; Skip/Draw Two áp dụng lên ghế đó; Reverse => dealer đi,
  hướng -1 (cả khi hai người); Wild => ghế sau dealer chọn màu rồi đi.
  Draw Four mở đầu được đặt sang bên, rút lá khác, sau đó trộn trở lại.
- Không cộng dồn phạt, đánh chen, đánh nhiều lá hoặc luật 7–0.
- Khi đánh Wild phải gửi màu cùng command; lá màu không nhận chosenColor.
- declareUno=true đi kèm PLAY_CARD chỉ hợp lệ khi nước đi để lại đúng một lá.
- Quên declareUno khi đánh từ hai xuống một lá: phát UNO_PENALTY và bốc hai ngay,
  rồi xử lý chức năng lá bài. Không phạt khi nước đánh không hợp lệ hoặc đánh lá cuối cùng.
- +4 cuối: chờ phản hồi rồi mới chốt kết quả. Màu đã chọn giữ nguyên dù thách thức thành công.
  Bằng chứng được chụp trước lúc đánh, không đổi theo các hình phạt xảy ra sau.
- Nếu thực sự không đủ bài để bốc, lấy tối đa số có thể; không tạo thêm lá.
  Sau một vòng toàn bộ người chơi bốc được 0 lá và không có nước đánh xen giữa, kết thúc blocked,
  không có người thắng. Đây là quy tắc chống kẹt riêng cho bản web.

## Hợp đồng thực thi
createGame(playerIds, random?, dealerIndex?) tạo trạng thái server.
applyCommand(state, actorId, payload, random?) trả state mới và events, hoặc UnoRuleError.
actorId phải do application lấy từ kết nối đã xác thực, không lấy từ payload.

Phase: turn, drawn, choose-color, draw-four, ended.
Command: PLAY_CARD, DRAW_CARD, PASS_TURN, CHOOSE_COLOR,
ACCEPT_DRAW_FOUR, CHALLENGE_DRAW_FOUR. Lệnh CALL_UNO/CATCH_UNO cũ bị từ chối.
Payload được Zod kiểm tra strict; từ chối field thừa và màu không tồn tại.
Mỗi command thành công tăng revision. Lỗi không sửa input. Nguồn ngẫu nhiên được truyền vào
để tái hiện test; production sử dụng mặc định Math.random ở giai đoạn hiện tại.

Domain giữ đủ tay bài, chồng bốc và bằng chứng +4; tuyệt đối không broadcast UnoGame.
getPlayerView chỉ trả bài của người nhận, lá trên bàn, số lượng, lượt và kết quả.
View được sao chép để người dùng hàm không sửa state qua tham chiếu.
Events chia public/private; tầng giao tiếp tương lai phải lọc private theo recipientId.
Số lá và id trong event bốc bài không bao giờ bao gồm nội dung lá bốc.

## Ngoài bước triển khai này
Chưa có endpoint chơi, Colyseus, lưu MongoDB, UI, reconnect, timeout hoặc bỏ cuộc.
Chúng thuộc application/presentation ở bước sau, không được tự gán thành luật đã triển khai.
Mọi replay sau này phải lưu command, phiên bản và nguồn ngẫu nhiên/trạng thái ban đầu phù hợp;
revision hiện tại chưa phải cơ chế chống gửi trùng trên mạng.

## Kiểm tra local
Từ root: npx.cmd --yes pnpm@10.34.9 test
Test bao gồm setup, nước đi sai, luật chức năng, UNO, thách thức, scoring,
quyền riêng tư và 100 ván seed kiểm tra bảo toàn đủ 108 lá sau mỗi lệnh.
