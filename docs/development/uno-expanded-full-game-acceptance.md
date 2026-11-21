# UNO Mở rộng — nghiệm thu trọn ván (bước 10)

Ngày kiểm tra: **21/11/2026**. Phạm vi: bản nội bộ tại `/dev/uno-expanded/play`, bộ bài 198 lá và luật `uno-expanded-v1` hiện đã chốt. Không thay luật và không mở game trên trang chính trong bước này.

## Cách kiểm tra

Hai ván dùng `createExpandedGame` với seed 17 và 21, đủ 198 lá thật, bốn phiên trình duyệt độc lập. Mỗi người thao tác qua giao diện: chọn bài, hô UNO, chọn màu/mục tiêu, xác nhận, bốc hoặc nhận phạt. Bộ điều khiển kiểm thử chỉ đọc tay bài của chính phiên đang thao tác và trạng thái công khai; không gửi lệnh game trực tiếp hay đọc tay đối thủ để quyết định nước đi.

Mỗi ván đi từ sảnh đến kết quả rồi chơi ván mới. Giữa ván, một người rời trang và quay lại: phòng tạm dừng, phục hồi cùng danh tính/ván/tay bài rồi tiếp tục. Sau từng thao tác, kiểm tra revision, lượt, màu, chiều, tổng phạt, số bài đối thủ và kết quả đồng nhất. Tổng bài trên các tay + chồng bốc + chồng bỏ luôn bằng 198, kể cả ở màn kết quả; không có ID trùng giữa các tay đang hiển thị hoặc mặt bài đối thủ bị render.

Bốn viewport trong các ván này: 1440×900, 1366×768, 768×1024 và 375×812. Dùng giảm chuyển động cho hai ván trọn để kiểm tra nghiệp vụ nhanh; các ca tình huống và mini-game dùng animation thông thường. Đây là các viewport mô phỏng bằng Edge, không phải bốn loại thiết bị vật lý hay bốn đường truyền Internet.

## Các nhánh được kiểm tra riêng

| Phạm vi | Kiểm tra qua UI |
| --- | --- |
| Cộng dồn và Khiên | +2 → +4 → +6 → +8 thành 20; Khiên chuyển phạt; không nối +2 ngay sau Khiên; nhận đủ 20 và chuyển lượt đúng |
| Chỉ định +4 | Chọn người không ngồi kế, chọn màu, đúng người nhận phạt |
| Tornado | Bốc qua nhiều màu/Wild, dừng ở màu yêu cầu, mất lượt |
| Random | Lật lá số rồi bốc thêm tương ứng; lật chức năng không kích hoạt chức năng đó; cả bàn thấy thông tin lá lật |
| ×2 / ÷2 | Số bài nhận/hoàn kho đúng; chọn đủ bài; UNO khi giảm còn một lá |
| Xả màu cố định / tự chọn | Xả đúng màu; lá chức năng xả kèm không tự kích hoạt; lá kích hoạt vẫn là lá trên cùng |
| Chuyền tay L/R | Chuyển đúng toàn bộ ID lá giữa bốn người và đúng chiều/lượt tiếp theo |
| Cấm / Đổi chiều / Cấm hai | Đúng người tiếp theo và chiều sau khi đánh |
| UNO / thao tác nhanh / lá cuối | Quên UNO tự phạt hai; xác nhận hai lần không đánh hai lá; lá +6 cuối giải quyết phạt và kết thúc đúng |
| Up | Gợi ý hợp lệ 5/7; phạt và kết thúc; reload không phát lại phản hồi |
| Battle | Chọn bí mật, draft không mất khi đối thủ chọn; chọn đồng thời; thưởng/phạt/UNO; timeout và reload |
| High Five | Bốn người phản hồi; reload tạo attempt mới; người không phản hồi; hai người với cả hai thứ tự; không ai bấm trong cửa sổ thật 5 giây |

Các nhánh trên kết hợp với hai ván đầy đủ bao phủ 14 nhóm chức năng. Không có nghĩa mọi tổ hợp giữa tất cả lá đã được duyệt bằng trình duyệt; các kiểm thử domain/realtime tiếp tục kiểm tra thêm nhánh luật, rollback, clock và bảo toàn 198 ID.

## Mã kiểm thử và thay đổi

- `tests/e2e/uno-expanded-full-game.spec.ts`: hai ván đầy đủ, kết nối lại, kết quả và rematch; đính kèm số bước/hành động và ảnh bắt đầu/kết quả.
- `tests/e2e/uno-expanded-acceptance.spec.ts`: 17 tình huống chuẩn bị sẵn; đính kèm dữ liệu trước/sau.
- `tests/e2e/helpers/expanded-acceptance.ts`: thao tác và đối chiếu các phiên UI.
- `apps/meepleverse-api/tests/browser/expanded-acceptance-fixtures.ts`: sắp bài từ bộ thật và kiểm tra đủ 198 ID duy nhất trước khi chạy. Chỉ được dùng bởi test server loopback.
- `tests/e2e/uno-expanded-minigames.spec.ts`: các ca mini-game hiện có; đọc thông báo Up trước khi chờ đủ bảy lá bay vào tay, tránh kiểm tra sau khi thông báo tạm đã đóng.

Các đường dẫn `tests/e2e` ở trên nằm trong `apps/meepleverse-user-web`.

Lỗi giao diện phát hiện và sửa: sự kiện Random có gửi lá lật công khai từ server nhưng thông báo chưa nêu rõ lá đó. Đã bổ sung tên lá lật và số bài nhận vào cùng thông báo hiện có, không tạo thêm popup và không lộ những lá bốc còn lại. Hai fixture Xả màu ban đầu thiếu một lá do sắp tay; đã sửa và chạy lại. Không sửa bộ luật để làm test vượt qua.

## Chạy lại

Tại thư mục gốc repo:

```powershell
npm run test
npm run typecheck
npm run lint

$env:PLAYWRIGHT_CHANNEL='msedge'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e --grep 'expanded acceptance:|expanded 9B:|expanded High Five:'
```

Lệnh trình duyệt gom 29 ca riêng biệt: 2 ván đầy đủ + 17 tình huống + 10 ca mini-game. Test tự chạy web 3100, API 5100 và điều khiển fixture 5101; không dùng các phiên dev 3000/5000. Ảnh, attachment và trace lỗi theo cấu hình Playwright nằm trong `apps/meepleverse-user-web/test-results`; thư mục này có thể bị thay thế ở lần chạy tiếp theo.

## Kết quả ngày 21/11/2026

- **29 ca UI riêng biệt đạt** qua các lượt chạy tập trung: 2 ván trọn, 17 tình huống, 10 ca mini-game. Các ca lỗi do fixture/thứ tự assertion đã được sửa và chạy lại thành công; không dùng retry để bỏ qua lỗi.
- **357/357 kiểm thử backend, 30 file đạt**, gồm Cơ bản/Mở rộng và realtime.
- `npm run typecheck` và `npm run lint` toàn workspace đạt.
- Catalog vẫn ở trạng thái đang phát triển; chưa mở tạo phòng Mở rộng công khai.

## Giới hạn nghiệm thu

E067 (chơi trọn ván qua bốn phiên trình duyệt và rematch) được kiểm tra trong môi trường local. E068 có thêm bằng chứng chơi ở bốn viewport; chưa hoàn tất mọi tổ hợp popup/thiết bị/ngang. E069 chưa được nghiệm thu đầy đủ chỉ từ hai ván dùng giảm chuyển động. Chưa chạy nghiệm thu trên production build, tải đồng thời nhiều phòng, trình duyệt Safari/iOS thật hoặc nhóm bốn người qua Internet. Các phần đó và hướng dẫn chơi/phát hành nằm ở bước tiếp theo.
