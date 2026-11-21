# Sảnh game MeepleVerse

- `/`: trang khám phá và danh mục hai phiên bản UNO.
- `/games`: danh mục dùng cùng dữ liệu với trang chủ.
- `/games/uno-basic`: bộ 108 lá, nhãn Đang mở bàn, hướng dẫn và tạo/vào phòng.
- `/games/uno-expanded`: bộ 198 lá, nhãn Chơi thử, hướng dẫn và tạo/vào phòng. Nút Chơi ngay dẫn tới `#play`.
- `/room/[id]`: link mời và bàn chơi; tự nhận diện đúng phiên bản. Layout phòng riêng với sảnh.
- Slug không có trong danh mục trả 404.

Nguồn dữ liệu là `modules/game-catalog/model/games.ts`. `available` và `beta` mở chơi; `development` chỉ giới thiệu. GameCatalog dùng chung ở trang chủ/danh mục. RoomEntryForm chọn đúng room type: `uno` cho Cơ bản, `uno-expanded` cho Mở rộng; vào bằng mã/link dùng room ID chung.

Ảnh hai phiên bản dùng mặt bài SVG gameplay và các vector số/chức năng chung, không phải chữ thay hình. Cơ bản có số 7, Cấm, +4, số 2 và +2. Mở rộng có số 7, Tăng tiến, +8, Khiên và ×2. Nền xanh/vàng nâu và dải năm lá giúp nhận diện hai bộ; responsive giữ ảnh trong khung. Không dùng dịch vụ ảnh bên ngoài.

Header/footer thể hiện nền tảng nhiều game. Nút hướng dẫn ở từng thẻ và trang game; trên sảnh/bàn hiển thị đúng luật theo phiên bản.

Xem [hướng dẫn chơi](uno-expanded-rules-ui.md) và [mở chơi thử bước 12](uno-expanded-beta.md).

## Kiểm tra

```powershell
$env:PLAYWRIGHT_CHANNEL='msedge'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e --grep 'home discovers both playable|mobile universe, catalog|catalog navigation works|a player can return'
```

Kiểm tra trạng thái/nút, mặt bài phân biệt hai bộ, tạo/vào phòng, quay lại phòng, điều hướng/404 và không tràn ngang trên mobile. Hai ván trọn trong `uno-expanded-full-game.spec.ts` bắt đầu từ trang chủ, có vào mã và link mời, kết thúc rồi rematch.
