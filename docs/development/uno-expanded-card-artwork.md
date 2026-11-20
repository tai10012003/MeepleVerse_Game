# UNO Mở rộng — mặt bài và xưởng xem trước (bước 8)

Ngày: 20/11/2026. Chỉ làm trình bày frontend; luật, cấu hình 198 lá và trạng thái phát hành giữ nguyên.

## Mở xem

Tại repo chạy `npm run dev:user`, truy cập **http://localhost:3000/dev/uno-expanded/cards**. Không cần API để xem thư viện. Route chỉ có trong development; production trả trang không tìm thấy và không có liên kết từ catalog công khai. Metadata đặt noindex/nofollow.

Thư viện có 19 nhóm mẫu: 5 nhóm nền + 14 nhóm mới, 60 mặt bài để đối chiếu màu/biểu tượng, gồm đủ 22 discriminant kind của contracts. Đây không phải cấu hình bộ bài thứ hai: không dùng số mẫu hoặc số component để tạo bộ bài. Bộ thật vẫn 112 số + 32 chức năng nền + 54 mới = 198 lá.

Có lọc Cơ bản/Mở rộng, màu và kích thước 64/86/144px. Khu mẫu tay/bàn dùng cùng kích thước, trên mobile giới hạn đồng thời để không tràn. Các biểu tượng, elip, viền và góc nằm cùng viewBox 100×144 nên co giãn theo tỷ lệ.

## Nguồn hình ảnh đã xem

- [Storm — H2 Rubik](https://rubikonline.vn/huong-dan-cach-choi-uno-storm-ban-mo-rong-uno): Up bốn dấu tăng tiến màu; Seven Change số 7/vòng mũi tên/L-R; Khiên bốn màu; Tornado xoáy; Discard Color chồng bài có ×.
- [Battle — H2 Rubik](https://rubikonline.vn/huong-dan-choi-uno-battle-uno-mo-rong): Wild Battle có hai kiếm ở góc, giữa elip bốn màu; High Five số 5 với bàn tay góc; Skip Two cấm/×2; Target +4 tâm ngắm; Random +?.
- [Infinity — hướng dẫn](https://thuthuatchoi.com/huong-dan-cach-choi-uno-infinity.html) và [ảnh sản phẩm](https://salt.tikicdn.com/ts/product/7e/07/df/4eb25bedd4260b95b5ea53d91974decf.jpg): ×2 hai nhóm bài, ÷2 nhóm bài chia đôi, Wild Discard chồng bài/× trên nền đa màu.

Các hình được vẽ lại bằng SVG theo nét nhận diện, không dùng ảnh sản phẩm làm asset trong app. +6/+8 là cách thể hiện MeepleVerse phát triển từ nhóm bài màu của +4, không tuyên bố sao chép một bản in cụ thể. Mặt sau dùng CardBack chung khi tích hợp bàn chơi ở bước tiếp theo; không tạo mặt sau mới ở bước này.

## Cấu trúc

- `uno-common/presentation/components/CardArtwork.tsx`: hình học nền tái sử dụng. File cũ trong Cơ bản re-export cùng API; hình học, lớp CSS và hành vi cũ không đổi.
- `uno-expanded/model/card-presentation.ts`: palette, tên tiếng Việt và kiểm tra đầy đủ kind ở compile time.
- `uno-expanded/model/card-gallery.ts`: mẫu hiển thị và ghi chú nguồn, không chứa luật hoặc số lượng deck.
- `uno-expanded/presentation/cards`: khung SVG, biểu tượng giữa, góc và CSS chỉ tác động `.expanded-card-face`. Hai switch exhaustive giúp thiếu kind bị TypeScript báo lỗi.
- `uno-expanded/presentation/preview`: UI xem trước và các bộ lọc cục bộ.

`ExpandedCardFace` nhận `UnoExpandedCardFace` (card thật có ID cũng dùng được), không nhận state phòng hoặc gửi lệnh. Mặc định có role img và tên tiếng Việt; dùng `decorative` khi nằm trong button đã có nhãn. Không có SVG ID/gradient ID nên nhiều bản sao không xung đột. Không phụ thuộc kích thước font của container bàn chơi.

## Kiểm tra nhanh

```powershell
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web typecheck
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web lint
$env:PLAYWRIGHT_CHANNEL = "msedge"
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e --grep 'card studio|green (skip|reverse).*1366'
```

Các ca mới kiểm tra đủ kind/màu, tên truy cập, artwork trong khung, bộ lọc, tỷ lệ tay/bàn, không tràn mobile/tablet và trạng thái catalog. Chạy thêm hai ca Cấm/Đổi chiều Cơ bản để bảo vệ phần artwork vừa chuyển sang common. Không chạy lại bài chơi trọn ván dài hoặc backend vì bước này không đổi luật/transport.

Chưa có điều khiển chọn mục tiêu, Battle/High Five, lịch animation hoặc chơi công khai Mở rộng; đó là bước tích hợp giao diện tiếp theo.

Kết quả: 3 ca thư viện mới qua trong khoảng 16 giây; 2 ca hồi quy Cấm/Đổi chiều Cơ bản cũng qua. TypeScript và lint frontend đạt; không chạy lại toàn bộ 42 E2E hoặc mô phỏng backend ở bước này.
