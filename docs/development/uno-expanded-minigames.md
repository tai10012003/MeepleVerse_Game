# UNO Mở rộng — mini-game (bước 7)

Ngày: 20/11/2026. Triển khai backend, contracts và kiểm thử cho Wild Up, Wild Battle và High Five. Kế thừa các luật đã chốt ở bước 5–6; không thay đổi UNO Cơ bản. Đây là quy ước cho bộ kết hợp MeepleVerse, không tuyên bố mọi bộ mở rộng ngoài thị trường có cùng luật.

## Luật đang chạy

| Mini-game | Hành vi |
| --- | --- |
| Wild Up | Chọn màu khi kích hoạt. Người kế mở bằng lá số màu đó; sau đó đáp bất kỳ màu với giá trị >= lá trước. High Five=5, Seven Change=7 chỉ dùng giá trị, không chạy chức năng phụ. Không có bài hợp lệ thì tự bốc bằng số gần nhất (chưa mở: 1; sau 0: 0), mất lượt rồi quay lại lượt thường. Không giới hạn một vòng, 9 đáp 9 được. |
| Wild Battle | Chọn màu và một đối thủ. Mỗi bên bí mật khóa một lá số cùng màu, lật cùng lúc sau khi đủ lựa chọn. High Five/Seven Change được so bằng 5/7. Cao hơn thắng: bỏ thêm min(2,N) lá tùy chọn; thấp hơn +2. Bằng nhau chỉ bỏ lá so. Một bên có số thì chọn và thắng; cả hai không có: người kích hoạt +3, đối thủ +2. |
| High Five | Người kích hoạt được miễn. Chuẩn bị 1,5 giây, sau đó cửa sổ 8 giây. Xếp thứ tự theo lúc server nhận phản hồi hợp lệ. Người cuối +2; khi hết giờ, chọn đúng một người chưa bấm đầu tiên theo ghế sau người kích hoạt trong chiều hiện tại. Hai người chơi thì đối thủ tự +2 ngay. |

Battle luôn tiếp tục lượt thường ở ghế sau người kích hoạt, không lấy ghế người thắng/thua làm mốc. Lá so và phần thưởng nằm dưới lá Battle; giữ màu đã chọn. High Five tiếp tục ghế sau người kích hoạt, không bỏ thêm lượt người bị phạt. Shield không phản ứng trong ba mini-game.

## Phase và lệnh

| Phase | Lệnh hợp lệ |
| --- | --- |
| `up` | `UP_PLAY { effectId, cardId, declareUno? }` từ người đang đáp |
| `battle-select` | `BATTLE_SELECT { effectId, cardId, declareUno? }` từ người có số phù hợp, chưa khóa |
| `battle-discard` | `BATTLE_DISCARD { effectId, cardIds, declareUno? }` từ người thắng, chọn đúng số thưởng |
| `high-five` | `HIGH_FIVE { effectId, attempt }` từ người không được miễn, chưa bấm, trong cửa sổ |

Kích hoạt vẫn dùng `PLAY_CARD`; Up/Battle chọn màu trong cùng lệnh, Battle thêm `targetPlayerId`. Không có lệnh tự khai “không có bài”: server kiểm tra tay thật. Trong mini-game không nhận đánh thường, bốc thường, nối phạt hoặc Shield.

Lệnh qua phòng giữ envelope `matchId`, `expectedRevision`, `requestId`. Effect ID chỉ có ý nghĩa trong đúng ván. `BATTLE_SELECT` và `HIGH_FIVE` chấp nhận revision cũ không lớn hơn revision hiện tại, nhưng vẫn kiểm tra effect/phase/người gửi/slot/deadline/attempt. Nhờ đó hai người phản hồi cùng snapshot đều được ghi nhận. Up và thưởng Battle giữ revision hiện tại nghiêm ngặt. Retry cùng requestId/payload không chạy lại; cùng ID với payload khác bị từ chối.

## Bí mật và sự kiện

- `game.effect` chỉ có dữ liệu công khai: loại, ID, người liên quan, phase con, hạn giờ, trạng thái khóa hoặc thứ tự phản hồi. Trước khi lật, không có ID/mặt/số hoặc khai báo UNO của lựa chọn đối thủ.
- `self.battle` chứa riêng các ID hợp lệ, ID đã khóa, cờ UNO của mình và số lá thưởng mình được chọn. Người ngoài Battle nhận `null`.
- Khóa bài chưa bỏ lá khỏi tay. Cả hai lá chỉ được bỏ khi giải quyết; thứ tự vật lý cố định người kích hoạt rồi đối thủ, không phụ thuộc packet đến trước.
- `BATTLE_REVEALED` công khai đúng lá đã lật; `BATTLE_REWARD_DISCARDED` công khai lá thưởng đã bỏ. Bài bốc phạt chỉ công khai số lượng, mặt bài ở view riêng.
- Các sự kiện `EFFECT_STARTED`, `EFFECT_OPENED`, `EFFECT_TIMEOUT`, `UP_ENDED`, `BATTLE_RESOLVED`, `HIGH_FIVE_RESPONSE`, `HIGH_FIVE_RESOLVED` phục vụ UI sau này. Khi timer chuyển sang giai đoạn có người được hành động, phát `TURN_CHANGED` như lệnh thường.
- Schema Colyseus nhị phân tiếp tục chỉ giữ metadata/số lá. Không đưa các lựa chọn bí mật hoặc bài bốc lên schema.

## Timer và reconnect

Battle có 20 giây cho chọn số và thêm 20 giây cho chọn thưởng. Hết giờ, server giữ lựa chọn đã khóa, tự lấy lá hợp lệ đầu tiên theo thứ tự tay; thưởng tự lấy đúng số lá đầu tiên. Không tự hô UNO hộ người chơi. Đây là phương án tránh kẹt ván, không tối ưu chiến thuật hộ người vắng mặt.

Mất kết nối tạm dừng cả phòng và lưu thời gian còn lại. Battle giữ lựa chọn bí mật và cả giai đoạn thưởng. High Five giữ thứ tự người đã bấm; sau khi tất cả kết nối lại, tăng `attempt`, chuẩn bị lại 1,5 giây rồi chạy phần thời gian phản hồi còn lại. Click attempt cũ bị từ chối. Nếu mất mạng trong chuẩn bị thì vẫn giữ đủ thời lượng cửa sổ phản hồi chưa bắt đầu.

Domain nhận clock/timing qua dependency để kiểm thử; client không gửi timestamp hoặc thời lượng. Adapter Colyseus chỉ lên một timeout cho mốc kế tiếp và kiểm tra lại match/deadline trước khi chạy. Publish/pause/end/leave/rematch/dispose hủy timer cũ. Reconnect mặc định vẫn 30 giây; hết hạn hoặc rời chủ động dùng quy tắc kết thúc phòng hiện có.

Không thêm timeout cho lượt thường/Up; không bổ sung DB snapshot, phục hồi tiến trình hoặc đồng bộ nhiều server ở bước này.

## UNO và kết thúc

- Up kiểm tra UNO khi bỏ lá đáp từ 2 xuống 1.
- Battle chỉ lưu khai báo khi khóa; kiểm tra lúc bỏ lá so thật. Bỏ thưởng từ nhiều xuống 1 là một lần kiểm tra riêng. Phạt UNO và phạt thua được giải quyết trước xét thắng.
- Thắng Battle được ưu tiên nếu sau giải quyết có nhiều tay rỗng; nếu hòa và cùng hết thì kết quả `simultaneous-finish`, `winnerId: null`.
- Up/Battle/High Five là lá kích hoạt cuối thì thắng ngay, không mở mini-game; Battle cuối không bắt chọn mục tiêu. Màu Wild vẫn cần chọn. Lá đáp cuối trong Up cũng thắng và hủy chuỗi.
- Mọi hành động/timeout dùng clone rồi commit đúng một revision. Lệnh sai hoặc lỗi giữa chừng không để lại bài di chuyển dở.

## Kiểm thử và trạng thái phát hành

Unit test: `wild-up.test.ts`, `wild-battle.test.ts`, `high-five.test.ts`, `mini-endings.test.ts`, `effect-service.test.ts`. Bao gồm clock giả, UNO, hòa/kết thúc, lỗi không đổi state, giới hạn phản hồi, hai chiều, pause và fallback.

`simulation.test.ts` chơi trọn 60 ván có seed (20 ván mỗi cấu hình 2/3/4 người), dùng tất cả nhóm luật và clock giả; sau mỗi lệnh/timer kiểm tra bảo toàn 198 ID. Bot chọn nước hợp lệ, chọn màu theo số bài đang giữ; đây không phải bot thi đấu sản phẩm.

`uno-expanded-minigames.test.ts` dùng 4 client SDK với WebSocket thật: giữ bí mật trước lật, chọn đồng thời, retry, timer thật, reconnect Battle/High Five/Up, attempt cũ và hủy timer trước rematch. Timing ngắn chỉ được inject từ cấu hình server test.

```powershell
npm run test
npm run typecheck
npm run lint
npm run build
$env:PLAYWRIGHT_CHANNEL = "msedge" # Dùng Edge đã cài nếu chưa có Chromium Playwright
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e
```

Backend đã có hành vi cho mọi loại lá trong bộ 198. Catalog vẫn **Đang phát triển**, production chưa mở tạo phòng Mở rộng; trang nội bộ vẫn hiển thị thông báo phát triển. Thiết kế mặt bài, bộ điều khiển mini-game và animation thuộc các bước giao diện tiếp theo. Test SDK/domain không thay thế kiểm thử thao tác và độ trễ với bốn người thật.

Kết quả tại mốc 20/11/2026: 353 kiểm thử backend và 42 E2E hồi quy trên Edge đều qua; typecheck, lint và build toàn workspace đạt. E2E gồm Cơ bản/catalog/phòng Mở rộng nội bộ; chưa phải kiểm thử giao diện mini-game Mở rộng.
