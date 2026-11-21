# UNO Mở rộng — hướng dẫn chơi (bước 11)

Ngày: 21/11/2026.

Nút `? Luật chơi` xuất hiện trên thẻ game ở trang chủ/danh mục, trang giới thiệu `/games/uno-expanded` và trang vào bàn nội bộ `/dev/uno-expanded/play`. Trong sảnh/bàn/kết quả, nút `?` gọn nằm ở thanh phòng cạnh nút âm thanh, tự chọn đúng hướng dẫn theo game.

Hai phiên bản dùng chung `shared/ui/rules/GameRulesButton.tsx` và CSS dialog. Nội dung Cơ bản giữ riêng; Mở rộng có `ExpandedRulesContent.tsx` và dữ liệu minh họa `expanded-rule-cards.ts`. Mặt bài minh họa tái sử dụng SVG của game, không tạo bộ hình khác.

Hướng dẫn Mở rộng nêu cấu hình 198 lá (112 số + 32 nền + 54 mở rộng), số lượng từng nhóm, lượt thường, 14 nhóm chức năng, cộng dồn, lựa chọn màu/mục tiêu/÷2, UNO khi bỏ nhiều lá, các mini-game, kết thúc/điểm/kết nối. Đối chiếu đặc tả và bảng quyết định đã triển khai, gồm cập nhật Đập tay: mọi người cùng tham gia, chuẩn bị 1 giây, phản hồi 5 giây. Khiên chuyển tổng phạt; ×2/÷2 tác động tay bài; Up đi cả bàn, cho đáp bằng số; Battle chọn số bí mật cùng màu.

Có mục lục nhảy trong popup, cuộn riêng, nút đóng cố định, Escape và trả focus về nút mở. Nội dung chính 14 px, bảng/nhãn từ 13 px. Mở hướng dẫn không gửi lệnh game và không ngắt kết nối; **ván và đồng hồ mini-game vẫn tiếp tục**. Cảnh báo này nằm trong nội dung và footer để người chơi biết cần đóng hướng dẫn khi có phản ứng giới hạn giờ.

Trang giới thiệu phân biệt 108/198 lá, cách cộng dồn và các thao tác mới. Mở rộng vẫn `development`, chỉ chơi nội bộ, chưa mở tạo phòng công khai ở bước này.

## Kiểm tra

```powershell
npm run typecheck
npm run lint
$env:PLAYWRIGHT_CHANNEL='msedge'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e --grep 'expanded guide:|UNO guide|home discovers two UNO editions|mobile universe, catalog'
```

Kết quả: **8/8 ca UI đạt**, TypeScript và lint toàn workspace đạt. Bốn ca mới kiểm tra giới thiệu/sảnh/bàn ở 1366×768 và 375×812: đủ 14 nhóm, bố cục/font, mục lục, cuộn/mở lại, Escape/focus; khách vẫn vào sảnh và đối thủ vẫn đánh bài khi popup mở, không mất match/tay bài/lượt sau khi đóng. Bốn ca còn lại bảo vệ catalog và hướng dẫn Cơ bản. Đã xem ảnh popup laptop/mobile. Không chạy lại 357 test luật vì không sửa domain hoặc transport; nghiệm thu trọn ván nằm ở [bước 10](uno-expanded-full-game-acceptance.md).
