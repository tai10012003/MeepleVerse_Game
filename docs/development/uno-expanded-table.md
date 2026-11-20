# UNO Mở rộng — bàn nội bộ và thao tác nền (9A)

Ngày: 20/11/2026. Không đổi luật hoặc cấu hình 198 lá. Chưa phát hành công khai.

## Chạy thử

Tại repo, mở hai terminal:

```powershell
# API nội bộ, dùng thay dev:api, port 5000
npm run dev:api:expanded
# Frontend, port 3000
npm run dev:user
```

Vào http://localhost:3000/dev/uno-expanded/play, nhập nickname, tạo phòng rồi gửi link hoặc mã cho trình duyệt khác. Chủ phòng bắt đầu với 2–4 người. Tab riêng tư/trình duyệt khác có phiên độc lập.

Entry `src/dev-expanded.ts` từ chối NODE_ENV=production, chỉ nghe loopback. Entry production `src/index.ts`, script start và mặc định createRealtimeServer tiếp tục không đăng ký Mở rộng. Trang dev có noindex và chỉ mở khi development; catalog vẫn Đang phát triển.

## Phạm vi

- Sảnh dùng chung: danh sách, chủ phòng, mã/link mời, bắt đầu, rời có xác nhận, giữ phiên khi reload.
- Bàn/tay bài riêng Mở rộng: SVG bước 8; chồng bốc ngoài tâm; bài bỏ xếp lệch; vòng màu/chiều; bài úp và số bài đối thủ.
- Gợi ý dựa trên self.playableCardIds server gửi. Lá chọn có viền vàng, bài không được đánh tối đi. Bốc/bỏ lượt theo phase server.
- Cộng dồn +2/+4/+6/+8/Target/Khiên, tổng phạt ở đúng người nhận. +2 sau Khiên bị server loại khỏi gợi ý.
- Hộp chọn màu, mục tiêu Target +4, đúng số lá ÷2. Chỉ gửi một PLAY_CARD khi xác nhận đủ lựa chọn; hủy không đổi trạng thái server.
- Xem trước số bài sau đánh để hô UNO, kể cả xả nhiều xuống một. Không tự khai báo; quên thì server phạt. Nút UNO luôn hiện, sáng khi có cơ hội; có nút hô trong hộp lựa chọn.
- Hiển thị kết quả/điểm, chủ phòng rematch bằng matchId mới. Reload giữ bài/phiên, bỏ lựa chọn và cờ UNO đang chuẩn bị.

Wild Up, Wild Battle, High Five tạm không cho chọn kích hoạt bằng UI 9A: bộ điều khiển sẽ làm ở 9B. Đây là giới hạn UI, không thêm luật cấm ở backend. Các lá đó vẫn ở đúng trong bộ 198 và có thể được xả/chuyền như bài phụ. Phiên mini-game mở bằng SDK chỉ hiển thị chờ và khóa điều khiển thường. Chưa tuyên bố chơi được mọi ván đến cuối trước 9B.

Animation bay/bốc, thông báo hành động và sound cues riêng thuộc 9C. Nhạc nền/cài đặt âm lượng hiện có được dùng lại.

## Kiến trúc

RoomSession phân biệt gameId và có phương thức typed riêng cho commands Mở rộng; gắn matchId/revision mới nhất, kiểm tra kết nối/paused/pending. Không đưa snapshot Mở rộng vào queue animation Cơ bản; giữ lỗi lệnh khi lấy lại snapshot không đổi.

useExpandedTurn quản lý lựa chọn theo match, game revision, room revision và kết nối. Thay đổi phase/lượt/pause/reconnect làm lựa chọn cũ hết hiệu lực. remainingAfterPlay chỉ đếm preview để chọn bài và khai báo UNO; không quyết định hợp lệ hoặc phạt.

ExpandedTable/Hand/PlayDialog/Results chỉ đọc view riêng, phát sự kiện người dùng. Dùng lại CardBack, OpponentHand, DirectionRing, DrawDebt, ColorChoices và vị trí bỏ bài ổn định ở common. RoomLobby dùng chung metadata; toolbar không mở luật Cơ bản trong Mở rộng. CSS có namespace riêng. Không render ID/mặt bài đối thủ trong DOM.

## Kiểm tra nhanh

```powershell
npm run typecheck
npm run lint
$env:PLAYWRIGHT_CHANNEL = "msedge"
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e --grep 'expanded 9A|two browsers join through an invite|ordinary Wild still chooses color'
```

7 ca Mở rộng: chia đúng 198 lá với 4 browser/reload/privacy/mobile; drawn-card-only; +2 → Khiên → +4 và nhận 6; Target +4 không liền ghế/cancel/UNO; ÷2 có và không hô (hai ca, gồm reload lựa chọn); xả hết/rematch. Thêm 2 hồi quy sảnh/chọn màu Cơ bản. Cả 9 ca liên quan đã qua: 8 ca trong lượt đầu, ca chia bài sửa giả định chủ phòng đi đầu rồi chạy lại riêng. TypeScript/lint toàn workspace đạt.

Fixture browser chỉ nằm trong entry test, không được import production. Không chạy lại ván chơi dài hay toàn bộ backend vì không sửa luật/transport server. Chưa nghiệm thu mini-game UI, đầy đủ animation hoặc bốn người thật qua Internet.
