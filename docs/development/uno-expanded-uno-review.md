# Rà soát UNO và phản hồi bàn Mở rộng

Ngày: 22/11/2026.

## Thay đổi đã chốt

- Skip Two: bàn hai người chỉ cấm đối thủ, người đánh tiếp tục với lượt mới đủ 30 giây. Bàn ba người trả lượt cho người đánh; bàn bốn người tới ghế thứ tư. Cả hai chiều đều áp dụng.
- Random +?: không đổi. Người nhận giữ lá lật đầu, số N thì bốc thêm N, chức năng không tự chạy; chỉ lá đầu công khai.
- Battle hoàn tất: hiện kết quả đầy đủ 1,5 giây, thu thành thông báo nhỏ thêm tối đa 4 giây rồi ẩn. Khi thu gọn, bàn và các lá đánh hiện lại; không tiếp tục che giữa bàn. Nút Tiếp tục có thể đóng sớm. Thời hạn/phần chọn lá thưởng chưa xong giữ nguyên.

## Các đường giảm bài xuống một lá

| Thao tác | Rà soát và hỗ trợ UNO |
| --- | --- |
| Cơ bản: đánh thường, lá vừa bốc, đáp cộng | Nút UNO cạnh thao tác đánh sáng khi cầm hai lá; gửi cùng lệnh đánh, không tự khai báo |
| Mở rộng: đánh thường, lá vừa bốc, đáp cộng | Dự báo theo lá chọn, nhắc khi còn một lá; nút UNO cạnh nút đánh |
| Up đáp số, gồm 5/7 đặc biệt | Giảm một lá, nhắc và nút UNO như đánh thường; timeout vẫn không tự hô |
| Xả màu cố định | Nếu kết quả còn một lá thì mở bước xác nhận có dự báo và UNO tại chỗ; không đánh ngay |
| Xả màu tự chọn | Đổi màu lựa chọn cập nhật số còn lại; chỉ hiện nhắc/nút UNO khi còn một lá |
| ÷2 | Tính sau khi bỏ lá kích hoạt và trả đủ floor(N/2); dự báo trước xác nhận, UNO trong popup |
| Battle chọn lá so | Nút UNO ngay trong panel nếu lần bỏ lá làm còn một; khai báo giữ cùng lựa chọn bí mật, không mất khi người kia khóa |
| Battle bỏ thưởng | Có nhắc/nút UNO riêng theo số lá phải bỏ; không dùng lại cờ UNO của bước so bài |
| Seven Change chủ động từ hai xuống một | Hô trước khi chuyền, dù sau đó người đánh nhận tay khác. Nhắc rõ thời điểm trước chuyền |
| Nhận đúng một lá do chuyền | Không tự phạt UNO, không bắt người nhận khai báo |
| Đánh/xả/bỏ từ nhiều xuống không lá | Không yêu cầu UNO; xét về đích theo luật hiện có |

Dự báo là số còn sau phần bỏ chủ động, trước các lượt bốc phạt/thưởng phát sinh sau đó; ví dụ khi chọn số Battle chưa biết kết quả thắng/thua. Nhắc này không tự bật UNO. Nếu người chơi được cung cấp thao tác nhưng bỏ qua, giữ tự phạt +2 như đã chốt; không thay luật server để miễn phạt cho mọi trường hợp.

Dùng chung `UnoChoicePrompt` cho popup đánh và hai giai đoạn Battle; phần xác nhận xả/chia dùng `remainingAfterPlay`, phần Battle dùng lượng bỏ hợp lệ của server. Luật server tiếp tục xác minh độc lập, không tin dự báo UI.

## Kiểm tra

```powershell
npm run test
npm run typecheck
npm run lint
$env:PLAYWRIGHT_CHANNEL='msedge'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e --grep 'expanded UNO prompt:|divide selection is exact|Battle keeps choices secret|simultaneous Battle|color discard finishes|Up suggests'
```

Các ca UI mới dùng fixture đủ 198 lá, kiểm tra không lộ bài và không mất lá. Bộ kiểm thử domain hiện có còn bao phủ xả/chia nhiều kích thước tay bài, UNO khi chuyển tay, Battle ở hai giao dịch, lá cuối và fallback không tự khai báo. Các kỳ vọng Skip Two cũ cho bàn hai người đã cập nhật theo luật mới, không dùng retry để bỏ qua lỗi.


Kết quả: **383/383 test backend (32 file), 11 ca UI riêng biệt đạt**, TypeScript và lint workspace đạt. Ca xả màu tự chọn có hô UNO được chạy bổ sung ở 375×812, kiểm tra nút hô/xác nhận nằm trong màn hình và popup không tràn ngang; đã xem ảnh desktop/mobile. Giữ nguyên phạt khi cố tình không hô, không lộ bài đối thủ và bảo toàn 198 lá trong các fixture xả màu. Chưa commit hoặc deploy.


## Sửa popup mini-game xuất hiện lại khi hết ván

`MiniFeedback` trước đây nằm trong bàn khi chơi, rồi được gắn lại bên ngoài bàn ở màn kết quả. Component mới mất trạng thái đã đóng, trong khi session vẫn giữ frame Battle/Đập tay cũ nên popup xuất hiện lại dù ván đã kết thúc.

Đã bỏ MiniFeedback khỏi màn kết quả và chỉ render phản hồi khi status PLAYING. Component cũng tự chặn status/phase kết thúc. Session xóa bộ đệm phản hồi mini-game khi nhận ENDED và không đưa sự kiện mini-game cuối ván vào lại bộ đệm. Cặp snapshot và animation đánh/bốc của giao dịch cuối vẫn được giữ để không mất hiệu ứng lá cuối. Màn kết quả vẫn lấy winner/điểm sau các phần thưởng/phạt mà server đã giải quyết.

Kiểm tra bằng `uno-expanded-ending-feedback.spec.ts`: thắng lá số sau Battle/Đập tay đã đóng kết quả; theo dõi DOM suốt chuyển cảnh để bắt popup xuất hiện thoáng qua; kiểm tra cả hai client, reload và rematch. Có thêm trường hợp lá Đập tay cuối không mở thử thách. Kiểm thử timeout Battle được cập nhật để yêu cầu chỉ hiện kết quả ván khi mini-game kết thúc bằng chiến thắng; ca Battle chưa kết thúc vẫn kiểm tra panel/thưởng và thu gọn bình thường.

```powershell
$env:PLAYWRIGHT_CHANNEL='msedge'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e --grep 'expanded ending:|Battle timeout is resolved|Battle keeps choices secret'
```


Kết quả sửa popup cuối ván: **5 ca UI riêng biệt đạt** qua lượt chạy tập trung và chạy lại ca Battle sau khi sửa dữ liệu nước đi cho đúng màu. TypeScript/lint workspace đạt. Không thay luật backend; các sửa Skip Two/UNO/Battle trước đó được giữ nguyên trong working tree. Chưa commit.
