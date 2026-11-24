# Card Swap — luật, giao diện và nghiệm thu

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

Đã thêm loại bài, bộ 202 lá, logic server, nhãn/mặt lá để frontend hiểu contract mới, và kiểm thử domain/service/WebSocket. Popup chọn mục tiêu/màu, animation và điều chỉnh UNO của frontend đã được bổ sung ở bước 2 bên dưới. Các trang giới thiệu và popup hướng dẫn đã được cập nhật sang bộ 202 lá, 15 nhóm ở bước 3.

## Kiểm tra

- Bộ bài: đúng 4 Swap, 202 ID duy nhất; mở đầu vẫn chỉ lá số; Cơ bản vẫn 108 lá.
- Bàn 2/3/4 người, cả hai chiều, mục tiêu không ngồi kế, bảo toàn mọi lá và tay của người ngoài cuộc.
- Thiếu/sai mục tiêu, màu, chọn thêm bài, gói tin sai lượt; không làm thay đổi trạng thái khi bị từ chối.
- Nhận tay một lá, đánh lá cuối, lá vừa bốc, điểm lá đen 50, hết giờ và giữ giờ khi reconnect.
- WebSocket 2/3/4 người: dữ liệu riêng, gói tin lặp/stale và phục hồi tay sau reconnect.

## Bước 2 — thao tác và trình diễn

Đã ghép popup chọn đối thủ/màu vào `useExpandedTurn` và `ExpandedPlayDialog`. Chọn mục tiêu hiển thị số lá công khai và số lá sẽ nhận; không suy đoán mặt bài đối thủ. Xác nhận chỉ bật khi đủ lựa chọn, mở popup không đổi deadline. Swap cuối chỉ chọn màu, không cần mục tiêu. Không gửi `declareUno` khi dùng Swap.

`HANDS_SWAPPED` tạo hai chuyến bài úp, số lượng hình giới hạn tối đa 5 lá mỗi chồng nhưng huy hiệu giữ đúng tổng. Trong lúc bay, tay cũ được ẩn và tay mới chỉ xuất hiện khi tới đích. Người ngoài cuộc không bị ẩn tay; nhận Swap không đánh dấu “Vừa bốc”. Âm thanh dùng hiệu ứng Wild hiện có. Thông báo gộp tên hai người đổi bài, lượt tiếp xuất hiện sau khi trao đổi.

Ưu tiên giảm chuyển động cập nhật tay bài trực tiếp, vẫn có thông báo. Resize/ẩn tab/kết nối lại hủy trình diễn cũ và trở về snapshot hiện tại, tránh tay bị ẩn hoặc phát lại hiệu ứng. Phần nội dung hướng dẫn/trang giới thiệu 202 lá và nghiệm thu trọn ván được hoàn tất ở bước 3.

Kiểm tra bước 2: 8 ca Card Swap UI đạt (bàn 2/3/4 người, mobile, UNO, lá cuối, giảm chuyển động, resize, reconnect và lá vừa bốc), cùng 2 ca hồi quy bốc bài/+2. TypeScript workspace và lint các phần sửa đạt. Kết quả nghiệm thu trọn ván được ghi ở bước 3 bên dưới.

## Bước 3 — nội dung phát hành và nghiệm thu (24/11/2026)

- Catalog, trang giới thiệu, popup luật và thư viện mặt bài thống nhất **202 lá, 15 nhóm**, 112 số thuần + 32 chức năng nền + 58 mở rộng; 156 lá mang màu và 46 lá đen.
- Mục 15 hiển thị 4 Card Swap đang chơi, đầy đủ chọn mục tiêu/màu, giữ chiều/lượt, ngoại lệ UNO và thắng bằng lá cuối. Không còn nhãn xem trước. Thư viện có 20 nhóm trình bày / 61 mẫu / 23 kind (số nhóm gallery gồm 5 nhóm nền).
- Ca Card Swap bốn trình duyệt dùng đủ bộ 202 lá thật: đối chiếu tay nhận, người ngoài cuộc, chồng bài, lượt/màu, tổng bài và bảo mật sau khi trao đổi.
- Hai ván bốn trình duyệt dùng seed 17/21 đã chơi tới kết quả và rematch, có rời trang/kết nối lại giữa ván. Sau từng thao tác, các client thống nhất revision, lượt, màu, chiều, chồng bài và số lá; không trùng ID hay lộ mặt đối thủ. Viewport gồm desktop/laptop/tablet/mobile. Hai ván dài dùng giảm chuyển động; hiệu ứng thường đã được kiểm tra ở bước 2.
- **10/10 ca UI đạt**: 1 nghiệm thu Swap, 3 thư viện, 2 trọn ván và 4 hướng dẫn/sảnh/bàn laptop/mobile. **404/404 backend**, TypeScript workspace và lint các phần sửa đều đạt. Đã xem ảnh mục 15 trên mobile, không tràn ngang, nội dung chữ tối thiểu 13px.
- Đây là nghiệm thu local bằng trình duyệt tự động, chưa thay thế buổi chơi người thật qua Internet.

Lệnh kiểm tra UI tập trung:

```powershell
$env:PLAYWRIGHT_CHANNEL='msedge'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e --grep 'expanded guide:|card studio:|expanded acceptance: swap|expanded acceptance: public catalog'
```
