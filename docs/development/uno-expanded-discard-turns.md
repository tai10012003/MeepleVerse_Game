> Mốc lịch sử: tài liệu mô tả bước 6. Up/Battle/High Five và timer đã được bổ sung ở [bước 7](uno-expanded-minigames.md); các câu chưa triển khai bên dưới ghi lại phạm vi tại bước 6.

# UNO Mở rộng — xả bài và điều khiển lượt (bước 6)

Ngày: 20/11/2026. Bước này chỉ mở rộng backend, contracts và kiểm thử. Giao diện vẫn Đang phát triển; chưa có mặt bài hoặc bộ điều khiển Mở rộng mới.

## Quy tắc

| Nhóm | Hành vi |
| --- | --- |
| ÷2 | Bỏ lá kích hoạt trước; N là số lá còn lại. Chọn đúng floor(N/2) lá để đưa xuống đáy kho bốc, không công khai mặt/ID. N nhỏ hơn 2 thì có thể bỏ qua danh sách rỗng. |
| Xả màu cố định | Xả toàn bộ lá có màu của lá kích hoạt, gồm cả chức năng màu; giữ các màu khác và lá đen. |
| Wild Discard | Chọn màu ngay khi đánh; xả hết các lá có màu đã chọn, không xả lá đen khác. |
| Seven Change L | Chuyền đồng thời mỗi tay tới ghế kế trong thứ tự ghế cố định, đặt chiều +1. |
| Seven Change R | Chuyền đồng thời mỗi tay tới ghế trước trong thứ tự ghế cố định, đặt chiều -1. |
| Skip Two | Bỏ hai cơ hội lượt kế tiếp theo chiều hiện tại. Với 2 người tới đối thủ; 3 người về người đánh; 4 người tới ghế thứ tư theo chiều đang chơi. |

L/R có giá trị 7: có thể đánh khác màu lên số 7 hoặc lá L/R khác, và số 7 thường cũng đánh được lên L/R. Hướng chuyền theo thứ tự ghế server, không theo vị trí avatar trên từng màn hình; không phụ thuộc chiều trước khi đánh. Lượt tiếp theo là ghế kế người kích hoạt theo chiều mới.

Xả màu được dùng kể cả không có lá phụ cùng màu. Thứ tự lá phụ theo tay bài server; chúng nằm dưới lá kích hoạt trong chồng bỏ. ÷2 đưa các lá đã chọn xuống dưới kho hiện có; sau khi bốc hết kho cũ, các lá đó được bốc theo thứ tự tay bài server. Đảo thứ tự ID trong payload không thay đổi kết quả.

Không chạy chức năng của bài đi kèm khi xả, chia hoặc chuyền. Các lá của bước này không dùng để phản hồi chuỗi cộng dồn. Up/Battle/High Five vẫn chưa dùng được làm lá kích hoạt, nhưng chức năng màu có thể đi kèm khi xả mà không kích hoạt.

## UNO và kết thúc

- Hành động bỏ chủ động từ ít nhất 2 lá xuống còn 1 lá cần `declareUno: true`, kể cả tay ban đầu có nhiều hơn 2 lá. Quên thì người đánh bốc 2, tách khỏi chuỗi cộng dồn.
- Bài mới bốc để phạt UNO không bị xả/chia tiếp trong cùng hành động.
- Nhận một lá do chuyền không yêu cầu hô UNO. Khai báo UNO của hành động trước không theo tay bài được chuyền.
- Nếu người đánh Seven Change chủ động từ 2 xuống 1 mà quên UNO, chuyền đồng thời trước rồi bốc phạt cho chính người đánh. Người nhận tay bài cũ không chịu thay hình phạt.
- Khi xả hết bài, thắng và tính điểm bình thường. Nếu Seven Change là lá cuối, kết thúc trước khi chuyền, không chuyển tay rỗng cho người khác để tạo người thắng mới.

## Lệnh

Chọn ÷2 khi tay ban đầu có 8 lá, sau lá kích hoạt còn 7 và cần chọn 3:

```typescript
command: {
  type: "PLAY_CARD",
  cardId: divideCard.id,
  chosenColor: "blue",
  discardCardIds: [first.id, second.id, third.id],
}
```

ID phải thuộc tay người gửi, khác nhau và không gồm lá kích hoạt. Thiếu/thừa/ID trùng/ID đối thủ trả `INVALID_SELECTION` và không thay đổi state hoặc revision. Mảng rỗng hoặc bỏ qua được chấp nhận khi số cần bỏ bằng 0. Cấu trúc sai kiểu hoặc vượt giới hạn trả `INVALID_COMMAND`.

`discardCardIds` chỉ dành cho ÷2; gửi trường này cho lá khác, kể cả mảng rỗng, bị từ chối. Xả màu tự động xác định toàn bộ lá cần bỏ; client không được chọn một phần hoặc sắp xếp chồng bài. L/R không nhận người đích tùy chọn.

Ví dụ xả nhiều lá xuống còn một:

```typescript
command: {
  type: "PLAY_CARD",
  cardId: wildDiscard.id,
  chosenColor: "red",
  declareUno: true,
}
```

Không gửi màu cho lá có màu cố định. Khai báo UNO khi hành động không chủ động giảm xuống một lá trả `INVALID_UNO_CALL`.

## Event và bảo mật

- `COLOR_DISCARDED`: màu và các lá phụ đã công khai trên chồng bỏ; lá kích hoạt có event `CARD_PLAYED` riêng.
- `HAND_REDUCED`: chỉ người đánh và số lá đưa xuống kho, không có ID hoặc mặt bài.
- `HANDS_PASSED`: người kích hoạt, chiều mới và các cặp ghế/số lá được chuyển; không có tay bài.
- Mỗi client nhận đúng tay mới qua góc nhìn riêng sau chuyển trạng thái. Schema nhị phân chỉ chứa metadata/số lá, không chứa bài.

Lựa chọn được kiểm tra trước khi di chuyển bài. Toàn bộ hành động dùng state clone và một revision, kể cả bốc phạt UNO. Lỗi giữa chừng không để lại state chuyển dở. Retry đúng requestId/payload nhận lại kết quả cũ; payload khác cùng ID bị từ chối. Reconnect sau chuyển tay giữ đúng danh tính và tay bài mới.

## Kiểm tra

```powershell
npm run test
npm run typecheck
npm run lint
npm run build
```

Unit test mới: `divide-hand.test.ts`, `discard-colors.test.ts`, `hand-transfers.test.ts`, `bulk-and-turn-interactions.test.ts`. Mô phỏng được bổ sung lựa chọn ÷2 và UNO theo số lá thực tế bị bỏ, tiếp tục kiểm tra bảo toàn 198 ID sau mỗi lệnh.

Test WebSocket kiểm tra chuỗi ÷2 → xả màu → chuyền R giữa 4 người, lựa chọn sai không đổi state, duplicate không chia/chuyền lần hai, bài đưa xuống kho không lộ, reconnect nhận đúng tay mới, Skip Two với 2–4 người và hoàn tất ván bằng xả màu.

Đây chưa phải nghiệm thu toàn bộ bộ luật Mở rộng: ba mini-game của bước 7 và phần giao diện/animation vẫn đang chờ triển khai.
