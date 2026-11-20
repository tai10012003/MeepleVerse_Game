> Historical milestone: this document describes step 4. Step 5 now enables internal base turns and draw/defense rules; see [current backend rules](uno-expanded-draw-defense.md). Public room creation remains disabled.

# UNO Mở rộng — nền phòng nội bộ (bước 4)

## Trạng thái

- Có bộ 198 lá, state và service riêng; chia 7 lá cho 2–4 người, mở đầu bằng **số thuần**.
- `gameId: uno-expanded`, `rulesVersion: uno-expanded-v1`, `phase: prepared`.
- `currentPlayerId` là `null`: đây là ván đã chuẩn bị, chưa có lượt chơi được phép thực hiện.
- Chưa triển khai luật của 14 nhóm chức năng; D01–D15 trong bảng quyết định vẫn chờ review. Việc khởi tạo theo phạm vi bước 4 không phê duyệt các luật tương tác còn lại.
- Trang danh mục vẫn ghi **Đang phát triển**; không có nút tạo phòng Mở rộng.

## Kiến trúc

| Lớp | Vị trí | Trách nhiệm |
| --- | --- | --- |
| Contracts | `packages/contracts/src/games/uno-expanded` | Kiểu bài, góc nhìn, command dự phòng, event khởi tạo và giao thức phòng |
| Domain | `apps/meepleverse-api/src/modules/games/uno-expanded/domain` | Khởi tạo state, chia bài, mở đầu, bảo mật góc nhìn |
| Application | `uno-expanded/application/services` | Thành viên, chủ phòng, trạng thái phòng, chuẩn bị ván, kiểm tra revision/match |
| Realtime | `uno-expanded/presentation/colyseus` | Adapter service và schema công khai riêng |
| Transport chung | `modules/room/presentation/colyseus/GameRoom.ts` | Mã phòng, reconnect, gửi góc nhìn riêng, chống xử lý lặp |
| Frontend | `modules/games/uno-expanded` | Nhận diện snapshot Mở rộng và thông báo chưa sẵn sàng; không dùng bộ điều khiển Cơ bản |

Phần vận chuyển realtime dùng chung cho hai phiên bản. Domain/service, parser lệnh và schema của Mở rộng tách khỏi Cơ bản. Hai phiên bản dùng chung pool mã phòng để tránh trùng mã.

## Bật trong kiểm thử nội bộ

Entry point production `src/index.ts` không bật Mở rộng. Chỉ mã server tin cậy mới được dùng:

```typescript
const runtime = createRealtimeServer({ enableExpandedRooms: true });
```

Khi bật, SDK có thể tạo phòng loại `uno-expanded`. Mặc định chỉ đăng ký phòng Cơ bản (`uno`); `gameId` trong góc nhìn Cơ bản là `uno-basic`. Tham số client không thể bật tính năng hay thay thế factory.

Không thêm biến môi trường hoặc trang quản trị để bật Mở rộng ở bước này. Test browser dùng entry point riêng trong `tests/browser/server.ts`, chỉ lắng nghe trên loopback.

## Giao thức hiện tại

Các kênh giữ tên `get_view`, `room_view`, `action`, `action_reply`, `game_events`. Snapshot phòng có `gameId` để frontend phân luồng chính xác. Token reconnect tiếp tục tra cứu theo mã phòng, không cần đổi khóa lưu session.

```typescript
// Chủ phòng chuẩn bị ván sau khi có ít nhất hai thành viên kết nối.
room.send("action", {
  requestId: crypto.randomUUID(),
  action: { type: "START_GAME", expectedRoomRevision: view.revision },
});
```

Server trả ván `prepared`, event công khai `GAME_PREPARED`, cùng bài riêng của mỗi người qua `room_view`. Chỉ schema metadata được đồng bộ nhị phân; không có tay bài hay ID chồng bốc trong schema.

`GAME_COMMAND` cần `matchId` và `expectedRevision`. Năm dạng lệnh nền đã được mô tả để chuẩn bị giao thức: `PLAY_CARD`, `DRAW_CARD`, `PASS_TURN`, `CHOOSE_COLOR`, `ACCEPT_DRAW_PENALTY`. **Tất cả vẫn trả `UNSUPPORTED_COMMAND`** khi envelope, phiên ván và revision hợp lệ; không làm thay đổi state. Các lệnh mini-game chưa được định nghĩa và bị từ chối là `INVALID_ACTION`.

Mất kết nối giữ chỗ mặc định 30 giây và tạm dừng phòng. Kết nối lại giữ nguyên danh tính, mã ván và tay bài. Hết thời gian hoặc rời phòng khi đã chuẩn bị sẽ kết thúc ván; nhóm còn ít nhất hai người có thể chuẩn bị ván mới.

## Kiểm tra

Chạy tại thư mục gốc:

```powershell
npm run test
npm run typecheck
npm run lint
npm run build
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e
```

Test bổ sung bao phủ khởi tạo 2–4 người qua 100 seed mỗi cấu hình; bảo toàn 198 ID; bài mở đầu số; không lộ bài; không alias state; từ chối gameplay; chặn client bật phòng; host/revision/dedup/capacity; reconnect và hết hạn; ván mới; phân luồng frontend nội bộ và tải lại trang.

Các test Cơ bản tiếp tục kiểm tra luật, phòng realtime, ván đầy đủ và giao diện. Đây là nghiệm thu nền kỹ thuật, chưa phải nghiệm thu toàn bộ luật Mở rộng E001–E070.
