# Kiểm thử tổng thể UNO Cơ bản — mốc chơi thử

Ngày chạy: 16/11/2026. Phiên bản luật: `uno-house-v3`; game: `uno-basic`.

## Phạm vi và môi trường

- Kiểm tra local trên Windows, Node.js 24, pnpm 10.34.9, Playwright với Microsoft Edge/Chromium.
- Backend kiểm thử sử dụng WebSocket/Colyseus thật; không mock các lệnh chơi bài hoặc đồng bộ phòng.
- E2E dùng API 5100, điều khiển fixture 5101 chỉ trên loopback và frontend 3100. Không dùng hoặc đóng các dịch vụ đang chạy trên 3000/5000/9000.
- Các ca riêng cho luật/hiệu ứng dùng fixture xác định để đi đúng nhánh. Ván đầy đủ dùng bộ 108 lá thực tế, chia 7 lá, seed khởi tạo 17; xào lại chồng bốc trong ván vẫn dùng nguồn ngẫu nhiên của server.
- Ván 4 trình duyệt dùng 4 browser context độc lập với viewport 1440×900, 1366×768, 768×1024 và 375×812. Ca này bật giảm chuyển động; các ca hiệu ứng riêng kiểm tra chuyển động đầy đủ.

## Kết quả backend

**100/100 kiểm thử qua, 8 file**.

- Bộ bài 108 lá, số lượng từng loại, mở đầu bằng lá số, chia bài cho 2–4 người.
- Đánh hợp lệ/không hợp lệ, rút bài, chỉ đánh lá vừa rút, bỏ lượt, Skip, Reverse và Wild.
- Cộng dồn +2/+4, nhận tổng phạt, quyền chọn màu của người đánh +4 cuối, về đích bằng lá cộng.
- Bấm UNO, quên UNO tự phạt, điểm kết quả, tái sử dụng chồng bỏ và bảo toàn bài.
- 100 ván mô phỏng 2–4 người và **200 ván 4 người** với màu lựa chọn, lá đánh và hành vi bốc/bỏ lượt khác nhau, gồm cả quên UNO. Mỗi nước giữ đúng 108 ID bài duy nhất.
- Các ván hoàn chỉnh 2, 3, 4 client qua WebSocket, kết thúc và mở ván mới.
- 4 client nhận trạng thái công khai giống nhau, không lộ tay đối phương qua view hoặc schema; không được đánh lá thuộc người khác.
- Ngắt kết nối giữa chuỗi cộng và lúc chờ người đánh +4 cuối chọn màu: giữ bài, lượt, revision, tổng phạt và quyền chọn màu sau reconnect.
- Chủ phòng rời ván 4 người: ván kết thúc theo hành vi hiện tại, chuyển chủ phòng, 3 người còn lại mở ván mới; lệnh ván cũ bị từ chối.
- 12 yêu cầu rút bài trùng request ID chỉ thực hiện một lần và phát một sự kiện cho mỗi client.
- Kiểm tra giới hạn phòng, chỉ chủ phòng được bắt đầu, nickname, giả mạo danh tính, sai lượt, stale match/revision, token reconnect, thời gian reconnect hết hạn và CORS.

Các ca reconnect trong integration đặt thời gian giữ chỗ 0,5 giây để kiểm tra nhanh; không mô phỏng nguyên 30 giây thời gian chờ production.

## Bản build production

TypeScript, lint và build toàn monorepo đều qua (user web, admin portal, API và các package có script kiểm tra).

Smoke test khởi động `apps/meepleverse-api/dist/index.js` trên một cổng tạm, kết nối 4 client SDK thật, kiểm tra thành công:

- HTTP health và CORS.
- Tạo/vào phòng, chặn người thứ 5, chủ phòng bắt đầu.
- Mỗi người 7 lá, lá mở đầu là số; tay bài không lộ cho đối phương.
- Rút bài đồng bộ và gửi lại cùng request ID không rút thêm.

Tiến trình smoke test tự dừng sau khi kiểm tra.

## Kiểm thử trình duyệt

**41/41 ca E2E qua, tổng thời gian khoảng 9,3 phút.**

| Nhóm | Kết quả |
| --- | --- |
| Trang chủ, danh mục, UNO Cơ bản/Mở rộng, trang không tồn tại | Qua |
| Tạo/vào phòng, link mời, mã phòng, chuyển chủ phòng, rời phòng, lỗi mạng | Qua |
| Âm thanh, lưu mức âm lượng, ẩn/hiện tab, giảm nhạc khi có hiệu ứng | Qua |
| Popup luật: mở từ thẻ game, trang vào phòng, sảnh và bàn chơi; đóng và trả focus | Qua |
| Đánh/rút bài, Skip, Reverse, +2, +4, màu biểu tượng, gợi ý lá hợp lệ | Qua |
| Hiệu ứng rút chậm, mặt bài riêng cho người nhận, giảm chuyển động, không phát lại khi reload | Qua |
| Ván đầy đủ 2 người và 4 người, kết quả đồng bộ, chơi lại | Qua |
| Chuỗi +2/+4/+4 nhận 10 lá, reload người đang chịu phạt, reload người phải chọn màu | Qua |
| +4 rồi +2 xanh kết thúc chuỗi bằng màu xanh và không mở chọn màu | Qua |
| Hô UNO, quên hô tự nhận 2 lá, giữ bài sau reload | Qua |
| Bàn 4 người, desktop/laptop/tablet/mobile, màn hình ngang, tạm dừng khi mất kết nối | Qua |

Ván mới bổ sung dùng 4 phiên trình duyệt độc lập: sau mỗi hành động kiểm tra revision, match ID, màu, chiều, lá trên bàn, chồng bốc, tổng phạt, người nhận phạt và số bài đối phương so với tay thật của họ. Chỉ có một người được tới lượt. Tải lại một người giữa ván phải giữ ID người chơi, bài, match và revision.

Kết quả quan sát trong lần chạy này: **Mai thắng 62 điểm** (Tai còn 11, Linh 24, Mai 0, Lan 27). Cả 4 bên thống nhất bảng điểm. Sau đó mở ván mới thành công, match ID mới, revision 0, mỗi người lại 7 lá. Không ghi nhận JavaScript page error trong ca ván 4 người.

Các kiểm thử đồ họa còn bao gồm kích thước 1920×1080, 1366×768, 375×812 và các bố cục khác trong từng ca; đây là viewport mô phỏng, không phải danh sách thiết bị thật đã kiểm tra.

## Đánh giá sau kiểm thử

Không phát hiện lỗi sản phẩm cần sửa trong các tình huống đã chạy. Có điều chỉnh dữ liệu fixture mới để chồng bốc có đủ 10 lá phạt; đây là sửa dữ liệu kiểm thử, không thay đổi luật game. Các thay đổi trong đợt này bổ sung 5 ca backend (gồm ca mô phỏng 200 ván), 1 ca E2E ván 4 người và bước reload trong chuỗi cộng dồn.

Bản hiện tại đạt kiểm tra chức năng local cho mốc UNO Cơ bản chơi thử. Chưa kết luận sẵn sàng vận hành thương mại hoặc chịu tải production.

## Cách chạy lại

Từ thư mục gốc repo:

```powershell
npx.cmd --yes pnpm@10.34.9 test
npx.cmd --yes pnpm@10.34.9 typecheck
npx.cmd --yes pnpm@10.34.9 lint
npx.cmd --yes pnpm@10.34.9 build
$env:PLAYWRIGHT_CHANNEL='msedge'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e
```

Chỉ chạy ván 4 trình duyệt:

```powershell
$env:PLAYWRIGHT_CHANNEL='msedge'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e uno-four-player.spec.ts
```

Ảnh, trace khi thất bại và thống kê ván 4 người nằm trong `apps/meepleverse-user-web/test-results/` (không commit). Ca ván 4 người đính kèm JSON số lượt, loại hành động, kết nối lại và kết quả mở ván mới vào kết quả Playwright. Để xem attachment này trong báo cáo HTML, chạy thêm tùy chọn `--reporter=list,html`, rồi dùng `pnpm --filter meepleverse-user-web exec playwright show-report`.

## Giới hạn đánh giá

- Đây là kiểm thử chức năng trên local, chưa đo tải nhiều phòng đồng thời hoặc hành vi mạng Internet thực tế.
- Viewport tablet/mobile trên Chromium không thay thế thiết bị thật, đặc biệt iOS/Safari, thao tác cảm ứng và cảm nhận âm thanh.
- Chưa có lưu/khôi phục ván khi tiến trình server chết; reconnect chỉ áp dụng khi server vẫn còn trạng thái phòng.
- Luồng admin hiện mới được kiểm tra type/lint/build; không coi đây là kiểm thử nghiệp vụ quản trị.
- Không tự gắn tag, phát hành, commit hoặc deploy trong đợt kiểm thử này.
