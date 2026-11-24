# Card Swap — bước 1: backend

Chốt ngày 24/11/2026. Thêm 4 lá `wild-card-swap`, nâng bộ Mở rộng lên **202 lá**: 112 số thuần + 32 chức năng nền + 58 mở rộng. Có 156 lá mang màu và 46 lá đen. Ván mới dùng `uno-expanded-v2`; UNO Cơ bản giữ nguyên.

## Luật và giao thức

- Chỉ dùng trong lượt thường, hoặc đánh chính lá Swap vừa bốc. Không đáp cộng dồn và không chen vào Up/Battle/Đập tay.
- `PLAY_CARD` gửi `cardId`, `targetPlayerId` và `chosenColor`. Mục tiêu phải là một người khác trong cùng ván. Màu phải là một trong bốn màu.
- Server xác thực toàn bộ trước khi thay đổi trạng thái, bỏ lá Swap lên bàn rồi đổi hai tay bài còn lại. Không chuyển chồng bốc, bài bỏ, chiều chơi hay ghế ngồi. Người kế của người đánh tiếp tục, không phải người kế của mục tiêu.
- Người đánh quyết định màu. Lựa chọn màu được gửi cùng mục tiêu và xác nhận nguyên khối, thống nhất giao thức các Wild hiện có; chưa có giai đoạn giữ tay mới rồi đợi chọn màu.
- Đổi tay là một hành động chuyển bài hoàn chỉnh: cả hai người nhận tay một lá đều không bị phạt UNO. Không đánh giá tay một lá tạm thời giữa bước bỏ Swap và đổi tay, và không tự hô UNO. `declareUno: true` ở Swap bị từ chối vì không cần khai báo cho chuyển tay.
- Swap là lá cuối: thắng ngay, không đổi tay. Có thể bỏ qua mục tiêu ở trường hợp này; nếu vẫn gửi mục tiêu thì phải hợp lệ. Màu vẫn bắt buộc như các Wild khác.
- Lựa chọn chưa gửi không thay đổi trạng thái. Hết 60 giây vẫn bỏ lượt theo cơ chế hiện có; không tự đoán mục tiêu. Mất kết nối đóng băng thời gian còn lại. Kết nối lại nhận đúng tay bài hiện tại.

## Bảo mật và đồng bộ

`HANDS_SWAPPED` chỉ chứa `playerId`, `targetPlayerId`, `playerHandCount`, `targetHandCount`. Không đưa ID/mặt bài nhận chuyển vào sự kiện hay Colyseus Schema công khai. Mỗi người nhận tay riêng qua `room_view.self.hand`. Giữ kiểm tra match/revision và dedup request để một lệnh không đổi bài hai lần.

## Phạm vi bước 1

Đã thêm loại bài, bộ 202 lá, logic server, nhãn/mặt lá để frontend hiểu contract mới, và kiểm thử domain/service/WebSocket. Popup chọn mục tiêu/màu, animation và điều chỉnh UNO của frontend đã được bổ sung ở bước 2 bên dưới. Các trang giới thiệu/popup hướng dẫn vẫn để trạng thái xem trước cho tới bước cập nhật nội dung.

## Kiểm tra

- Bộ bài: đúng 4 Swap, 202 ID duy nhất; mở đầu vẫn chỉ lá số; Cơ bản vẫn 108 lá.
- Bàn 2/3/4 người, cả hai chiều, mục tiêu không ngồi kế, bảo toàn mọi lá và tay của người ngoài cuộc.
- Thiếu/sai mục tiêu, màu, chọn thêm bài, gói tin sai lượt; không làm thay đổi trạng thái khi bị từ chối.
- Nhận tay một lá, đánh lá cuối, lá vừa bốc, điểm lá đen 50, hết giờ và giữ giờ khi reconnect.
- WebSocket 2/3/4 người: dữ liệu riêng, gói tin lặp/stale và phục hồi tay sau reconnect.

## Bước 2 — thao tác và trình diễn

Đã ghép popup chọn đối thủ/màu vào `useExpandedTurn` và `ExpandedPlayDialog`. Chọn mục tiêu hiển thị số lá công khai và số lá sẽ nhận; không suy đoán mặt bài đối thủ. Xác nhận chỉ bật khi đủ lựa chọn, mở popup không đổi deadline. Swap cuối chỉ chọn màu, không cần mục tiêu. Không gửi `declareUno` khi dùng Swap.

`HANDS_SWAPPED` tạo hai chuyến bài úp, số lượng hình giới hạn tối đa 5 lá mỗi chồng nhưng huy hiệu giữ đúng tổng. Trong lúc bay, tay cũ được ẩn và tay mới chỉ xuất hiện khi tới đích. Người ngoài cuộc không bị ẩn tay; nhận Swap không đánh dấu “Vừa bốc”. Âm thanh dùng hiệu ứng Wild hiện có. Thông báo gộp tên hai người đổi bài, lượt tiếp xuất hiện sau khi trao đổi.

Ưu tiên giảm chuyển động cập nhật tay bài trực tiếp, vẫn có thông báo. Resize/ẩn tab/kết nối lại hủy trình diễn cũ và trở về snapshot hiện tại, tránh tay bị ẩn hoặc phát lại hiệu ứng. Chưa cập nhật toàn bộ nội dung hướng dẫn/trang giới thiệu 202 lá; phần này và nghiệm thu trọn ván thuộc bước 3.

Kiểm tra bước 2: 8 ca Card Swap UI đạt (bàn 2/3/4 người, mobile, UNO, lá cuối, giảm chuyển động, resize, reconnect và lá vừa bốc), cùng 2 ca hồi quy bốc bài/+2. TypeScript workspace và lint các phần sửa đạt. Chưa nghiệm thu lại toàn bộ ván; việc đó thuộc bước 3.
