# UNO Mở rộng — nhóm rút bài và phòng thủ (bước 5)

Ngày: 20/11/2026. Đây là mốc backend nội bộ, chưa phát hành gameplay Mở rộng trên giao diện.

## Phạm vi

Hỗ trợ lượt nền: số thuần, Skip, Reverse, Wild; +2/+4/+6/+8/Target +4; Shield; Tornado; Random; ×2. Chia 7 lá cho 2–4 người, mở đầu số thuần, bộ bài vẫn 198 lá.

Các lá của bước 6–7 vẫn tồn tại vật lý nhưng bị loại khỏi gợi ý và trả `UNSUPPORTED_COMMAND` khi cố đánh: Up, Battle, High Five, Seven Change, Skip Two, xả màu cố định/tự chọn, ÷2. Không thể coi mốc này là toàn bộ UNO Mở rộng hoàn chỉnh.

## Quy ước đã dùng

| Nội dung | Hành vi |
| --- | --- |
| Wild | Chọn màu ngay trong PLAY_CARD. Thiếu màu bị từ chối; CHOOSE_COLOR riêng không hợp lệ. |
| Cộng dồn | +2/+4/+6/+8/Target +4 nối chéo bất kể màu/mức; không giới hạn tổng ở 8. |
| Target +4 | Chọn người khác trong ván, tăng tổng thêm 4 và chuyển phạt tới người đó. Không đổi ghế; nhận xong tới ghế sau người nhận theo chiều hiện tại. |
| Shield | Chuyển nguyên tổng, không xóa/tăng. Không nối +2 trực tiếp lên Shield. Cho +4/+6/+8/Target/Shield hoặc nhận. Lượt thường chỉ đổi màu. |
| Tornado | Bốc đến đúng màu, giữ cả lá dừng; Wild không dừng; bài bốc riêng tư; mất lượt. |
| Random | Lật công khai 1 lá và giữ trên tay. Số thuần N thì bốc thêm N lá kín; số 0 chỉ nhận lá lật. Lá chức năng (kể cả High Five/Seven Change) không bốc thêm, không chạy chức năng. Luôn mất lượt. |
| ×2 | Chụp N là số lá người kế đang cầm, bốc thêm N rồi mất lượt. Không cộng dồn, không dùng Shield chặn, không tính lại sau từng lá. |
| UNO | Đánh từ 2 xuống 1 cần declareUno; quên tự bốc 2 riêng, không cộng vào chuỗi. |
| Lá cuối | Lá bắt rút hoặc Shield chuyển chuỗi phải hoàn thành rút bắt buộc trước khi tính điểm và thắng. Không mở cơ hội cộng tiếp sau khi người đánh đã hết bài. |
| Thiếu bài | Xào lại chồng bỏ, giữ lá trên cùng. Bốc tối đa số lá còn khả dụng, không lặp vô hạn hoặc sinh thêm lá. |
| Bế tắc | Chỉ kết thúc blocked khi cả vòng thường không bốc được và không ai còn nước đi được hỗ trợ. Không dùng số lần nhận phạt để suy ra blocked. |

Không challenge +4. Luật Cơ bản tiếp tục giữ màu +4 chọn sau khi nhận phạt; các thay đổi trên chỉ thuộc Mở rộng.

## Tổ chức backend

- Contracts: phase, command, event và result riêng trong `@meepleverse/contracts/uno-expanded`.
- `supported-cards.ts`: phạm vi lá được phép xử lý ở mốc hiện tại.
- `apply-command.ts`: validate, clone, áp dụng một hành động và tăng revision đúng một lần; lỗi không đổi state đầu vào.
- `play-card.ts`: điều kiện đánh, màu/mục tiêu/UNO, chuyển lượt và phối hợp hiệu ứng.
- `accept-draw-penalty.ts`, `resolve-draw-effect.ts`, `draw-cards.ts`: nhận phạt và xử lý rút hữu hạn.
- `scoring.ts`: tính kết quả sau hiệu ứng bắt buộc; số theo giá trị, chức năng màu 20, lá đen 50.
- Service kiểm tra membership, paused, matchId và revision trước khi gọi domain. Room dùng cơ chế dedup/reconnect của bước 4.

## State và giao thức

Phase hiện tại: `turn`, `drawn`, `draw-stack`, `ended`. Snapshot có `currentPlayerId`, `pendingDraw`, `result` và `self.playableCardIds`; chỉ người đang hành động nhận danh sách gợi ý. Gợi ý trong chuỗi chỉ gồm lá nối hợp lệ, +2 bị loại ngay sau Shield. `self.drawnCardId` chỉ xuất hiện cho chính người đã bốc.

```typescript
room.send("action", {
  requestId: crypto.randomUUID(),
  action: {
    type: "GAME_COMMAND",
    matchId: view.matchId,
    expectedRevision: view.game.revision,
    command: {
      type: "PLAY_CARD",
      cardId: selected.id,
      chosenColor: "blue",        // Bắt buộc cho lá đen; không gửi cho lá có màu.
      targetPlayerId: opponentId,  // Chỉ gửi cho Target +4.
      declareUno: true,           // Chỉ khi tay đang có đúng 2 lá.
    },
  },
});
```

Ví dụ trên áp dụng cho Target +4 khi tay có 2 lá. Lệnh khác: `DRAW_CARD`, `PASS_TURN` sau bốc hợp lệ, `ACCEPT_DRAW_PENALTY` khi đang chịu chuỗi. Các trường không liên quan bị từ chối.

Event công khai chỉ có bài đã đánh, màu, lượng bốc, người chịu phạt, đổi lượt, kết quả; Random có thêm đúng lá lật công khai. Các lá rút khác và chồng bốc không được phát công khai. Server giải quyết toàn bộ hiệu ứng trước khi công bố state/event; client không gửi lệnh theo từng khung animation.

Reconnect giữ nguyên match, revision, bài và tổng phạt; nhận phạt gửi trùng cùng requestId không bốc lại. Rematch tạo matchId mới để chặn lệnh từ ván cũ.

## Kiểm tra và giới hạn giao diện

```powershell
npm run test
npm run typecheck
npm run lint
npm run build
```

Test backend bao phủ chuỗi phạt, Shield, Target, nhận phạt trùng, reconnect giữa chuỗi, rút hữu hạn, Random riêng tư, UNO, kết quả, các lỗi không thay đổi state và mô phỏng nhiều lượt giữ đủ 198 ID. Mô phỏng dùng phạm vi luật từng phần, không cam kết kết thúc mọi ván có lá chưa triển khai.

Phòng Mở rộng vẫn chỉ được bật bằng tùy chọn server tin cậy trong kiểm thử. Production không đăng ký loại phòng đó; catalog vẫn Đang phát triển. Adapter frontend nhận phase mới nhưng chỉ hiện thông báo, chưa có mặt bài mới hay bộ điều khiển gameplay. Test trình duyệt được chọn kiểm tra danh mục, sảnh và link mời Mở rộng nội bộ.
