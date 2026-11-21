# UNO Mở rộng — mở chơi thử từ trang chính (bước 12)

Ngày: 21/11/2026. Bước này mở luồng sử dụng trong mã nguồn/local; chưa triển khai lên máy chủ hay xác nhận production build.

## Giao diện và cách chơi

Cơ bản vẫn Đang mở bàn. Mở rộng chuyển từ Đang phát triển sang **Chơi thử**, có nút **Chơi ngay** ở trang chủ/danh mục dẫn tới `/games/uno-expanded#play`. Trang game có giới thiệu riêng, bộ 198 lá, nút hướng dẫn và form tạo/vào phòng đúng phiên bản.

Ảnh hai phiên bản tái sử dụng SVG mặt bài và vector số/chức năng chung của gameplay. Cơ bản minh họa số 7 đỏ, Cấm xanh lá, +4, số 2 vàng, +2 xanh dương. Mở rộng minh họa số 7 xanh lá, Tăng tiến, +8, Khiên và ×2. Năm lá xòe, giữ hai nền màu để nhận diện, co giãn theo màn hình.

```powershell
npm run dev:api
npm run dev:user
```

Truy cập http://localhost:3000. Chọn phiên bản → Chơi ngay → nhập tên → tạo phòng. Bạn bè vào cùng mã tại trang game hoặc mở link phòng. Chủ phòng bắt đầu khi đủ 2–4 người, chơi hết ván rồi Chơi ván mới.

## API và tương thích

`createRealtimeServer()` mặc định đăng ký `uno` và `uno-expanded`, dùng chung pool mã phòng để không trùng. Cấu hình server tin cậy vẫn có thể đặt `enableExpandedRooms: false`; client không được tự bật lại. Luật, bộ bài, private views và room type Cơ bản giữ nguyên.

`dev` API chuyển về `src/index.ts`; `start` sau build cũng dùng entry này. Entry `src/dev-expanded.ts` chỉ còn là alias tương thích. Frontend bỏ chặn createExpanded theo NODE_ENV; các trang thư viện/dev vẫn chỉ dùng cho development. Fixture/control test không được import vào bootstrap thường.

## Kiểm tra

```powershell
npm run test
npm run typecheck
npm run lint
$env:PLAYWRIGHT_CHANNEL='msedge'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e --grep 'home discovers both playable|mobile universe, catalog|catalog navigation works|a player can return|expanded guide:|public catalog, code and invites|artwork preview stays separate|UNO guide is usable'
```

Các ván đủ 198 lá dùng bốn browser context độc lập, vào từ catalog; một khách nhập mã, hai khách theo link mời. Có gián đoạn/kết nối lại, so trạng thái/riêng tư/tổng bài, kết quả và rematch. Các ca khác kiểm tra catalog, mặt bài, hướng dẫn laptop/mobile, tạo phòng Cơ bản và 404. Ảnh và summary theo từng lần chạy nằm trong thư mục Playwright test-results.

Kiểm tra production build, triển khai và nhóm bốn người chơi qua Internet nằm ở bước sau. Các mục “chỉ nội bộ/chưa bật production” trong tài liệu bước 4–11 là lịch sử trước khi mở chơi thử này.

## Kết quả ngày 21/11/2026

- **358/358 test backend, 30 file đạt**, gồm đăng ký cả hai game với cấu hình mặc định, mã phòng không trùng và vẫn tôn trọng tắt Mở rộng từ server.
- **12 ca UI riêng biệt đạt** qua lượt chạy tập trung và kiểm tra lại selector điều hướng cũ. Hai ván đủ 198 lá qua trang chính với seed 17/21 đều hoàn thành, có reconnect và rematch. Không chạy lại ván dài chỉ để sửa selector của catalog.
- TypeScript và lint toàn workspace đạt. Đã xem ảnh desktop/mobile; năm lá mỗi cover có đúng loại, không tràn ngang.

Ca điều hướng cũ giả định chỉ có một nút Chơi ngay; đã sửa để chọn đúng thẻ Cơ bản và chạy lại thành công. Không thay luật để vượt kiểm thử. Các thay đổi hướng dẫn bước 11 vẫn được giữ cùng working tree, chưa commit.


## Cập nhật nhãn theo phản hồi

UNO Mở rộng hiện dùng trạng thái `available` và nhãn **Đang mở bàn** giống Cơ bản, bao gồm trang chủ/danh mục, giới thiệu và sảnh. Các mô tả Chơi thử/Beta phía trên ghi lại trạng thái ban đầu của bước 12; việc đổi nhãn không đồng nghĩa đã deploy lên server thật.
