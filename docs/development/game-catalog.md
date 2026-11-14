# Sảnh game MeepleVerse

- `/`: trang khám phá với minh họa board game và danh mục hai phiên bản UNO.
- `/games`: danh mục trò chơi, dùng chung nguồn dữ liệu với trang chủ.
- `/games/uno-basic`: giới thiệu bộ 108 lá, luật nhà và form tạo/vào phòng hiện có.
- `/games/uno-expanded`: chỉ giới thiệu và nhãn Đang phát triển; không render form tạo phòng.
- `/room/[id]`: link mời và bàn chơi giữ luồng hiện tại; layout chơi tách khỏi sảnh.
- Slug không có trong danh mục trả 404.

Model ở modules/game-catalog/model/games.ts là nguồn trạng thái, tên, mô tả và tags.
GameCatalog được dùng ở trang chủ và danh mục. HomeScreen thuộc module game-catalog.
Hình minh họa SVG/CSS có trong repo, không phụ thuộc dịch vụ ảnh hay font từ xa.
Header/footer thể hiện nền tảng nhiều game, không gắn cố định với UNO.

Đây là bước giao diện. uno-basic và uno-expanded là mã danh mục frontend.
UNO Cơ bản vẫn kết nối room type uno của API hiện tại; chưa thêm engine, room type
hoặc endpoint cho bản mở rộng. Các tính năng mở rộng chỉ là dự kiến.

## Kiểm tra
`npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e`
Catalog tests kiểm tra điều hướng hai phiên bản, không có form chơi bản mở rộng,
404 và không tràn ngang trên mobile. Các test chơi vào /games/uno-basic;
link mời vẫn mở trực tiếp trang phòng.
