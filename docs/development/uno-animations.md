# Hiệu ứng UNO

Motion được dùng cho lớp hiệu ứng riêng, dựa trên các event đã được server xác nhận.

## Hành vi
- Đánh thường: lá bài bay từ tay người đánh vào chồng bỏ, xoay nhẹ, nảy khi chạm bàn và có vòng sáng.
- Skip: dấu cấm xuất hiện trên ghế người kế tiếp theo chiều đang chơi.
- Reverse: biểu tượng SVG hai mũi tên đối hướng riêng, dùng cùng hình trên thẻ và hiệu ứng. Không hiện dấu cấm. Ván hai người hiện thông báo người đánh được chơi tiếp, giữ nguyên luật server.
- Wild: hiệu ứng đổi màu.
- +2: hiện nhãn trên người chịu phạt và hai lá bay từ chồng bốc về tay.
- +4: hiện chỉ định chờ phản hồi; chỉ bay bài sau chấp nhận hoặc kết quả thách thức.
- Thách thức +4: bốc 4 hay 6 theo CARDS_DRAWN thực tế, không suy đoán từ lá đã đánh.
- Mọi CARDS_DRAWN dùng chung nhịp trên mọi góc nhìn: 1,85 giây mỗi lá, lệch nhịp 0,12 giây. Bốc thường, +2, +4 và phạt 6 lá đều đi qua cùng DrawSequence.
- Lá bốc bay ra giữa màn hình, dừng khoảng 0,9 giây rồi về tay; nhiều lá xòe thành quạt trong viewport. Người nhận thấy mặt và tên lá đơn, người khác chỉ thấy lưng và số lượng. Thời lượng không phụ thuộc việc client có mặt bài hay không.
- Trong lúc bốc, các lá đang bay chưa có trong tay. Từng lá được thêm vào tay và số lượng của đối thủ tăng khi lá đó đến đích; sau đó tay bài cuộn tới lá mới và đánh dấu Vừa bốc. Resize, tab ẩn hoặc reduced motion đưa giao diện về snapshot chuẩn, không thay đổi luật server.
- Chồng bỏ giữ tối đa 8 lá gần nhất, xếp lệch và xoay theo ID ổn định. Dữ liệu lấy từ discardCards của server, giữ sau reload và tự thu lại khi bộ bài được tái chế.
- Trong 0,48 giây lá đang bay, chồng bỏ vẫn hiển thị snapshot trước nước đánh. Chỉ hiện lá mới khi chạm bàn; không còn bản sao impact-card.
- Người nhận được thấy mặt lá mới của chính mình; các client còn lại chỉ thấy lưng bài.
- Sau chuỗi hiệu ứng có thông báo lượt kế, ghế hiện hành được nhấn sáng.
- Các hành động tới nhanh chạy theo hàng đợi; backlog được giới hạn và chạy nhanh hơn khi cần bắt kịp.

## Bố cục và thông báo người chơi
- OpponentHand chỉ nhận handCount: mỗi lá úp tương ứng một lá thật, không truyền ID, màu hay mặt bài đối phương. Quạt xếp ngang ở trên, nghiêng ở trái/phải, tự nén theo số lượng và giới hạn bề ngang; avatar có huy hiệu số.
- Tiến độ bốc bài cập nhật đồng thời tay bài úp và số lượng sau khi từng lá tới đích. Điểm bay đo từ quạt bài; thông báo dùng điểm neo riêng cạnh avatar.
- Đánh thường, chức năng, bốc và UNO có thông báo tạm ở người thực hiện/nhận tác động. Đổi màu hiện màu đã chọn cạnh người đánh Wild. Không dùng hàng lịch sử cố định dưới bàn.
- Bỏ số lá đã đánh, nhãn màu cố định và tiêu đề tay bài; số bài của mình thành huy hiệu nhỏ. Turn strip giữ trạng thái lượt/kết nối. Screen reader vẫn có vùng aria-live ẩn cho hành động.
- table-seating.css đặt mặt bàn và lớp căn giữa cùng inset. Tâm mặt bàn, quỹ đạo và điểm neo chồng bỏ khớp nhau; không phụ thuộc chiều cao nickname/trạng thái kết nối.
- Mỗi ghế là một hàng avatar + quạt bài. Ghế phải đảo thứ tự để avatar sát vành. Lưng bài desktop 52px (trước 34px), mobile 36px (trước 25px); quạt tự chồng khi nhiều lá. Màn hình hẹp xếp các ghế thành dải trên để chừa tâm bàn; màn hình ngang dùng hàng ghế gọn.
- Thuộc tính translate của quạt bài dùng initial để reset rõ quy tắc cũ qua bước tối ưu CSS. Điểm neo thông báo đo từ opponent-identity, điểm bay đo từ quạt bài.

## Gợi ý tay bài
- Khi chờ lượt, tay bài giữ màu và vị trí bình thường.
- Khi người chơi có thể đánh (phase turn/drawn), mọi lá hợp lệ nhô lên nhưng không có viền; chỉ lá được bấm chọn mới có viền vàng. Mặt các lá không hợp lệ giảm brightness còn 0,38. Khi gợi ý, tay bài bỏ overlap, chừa gap 10px trên desktop và 8px trên mobile để thấy đủ các lá tối; chờ lượt trở về bố cục xếp chồng. Gợi ý không tự chọn hoặc gửi nước đánh.
- Phase drawn chỉ gợi ý drawnCardId; sau đổi lượt hoặc trong modal phản hồi +4/chọn màu không làm tối cả tay. Giao diện cuộn tới lá mới hoặc lá hợp lệ đầu tiên khi cần.

## Mặt bài và màu
- Mặt bài dùng đỏ #ed1c24, vàng #f4c20d, xanh lá #35aa36, xanh dương #007ac1. Các lá chưa đánh được vẫn giữ màu bão hòa.
- Số lớn và ký hiệu dùng viền đen mảnh; gạch chân 6/9 màu trắng, có khoảng hở dưới số. Nhóm +2/+4 được căn theo tâm (50,70) của viewBox; Cấm dùng vòng tròn gạch chéo SVG, Đảo chiều dùng hai mũi tên chéo ngược hướng với thân uốn cong và đầu tam giác, viền mảnh; dùng chung trên mặt bài, góc bài và hiệu ứng. Artwork dùng chung cho tay bài, chồng bỏ và lớp bay.
- Hiệu ứng chức năng và vòng va chạm lấy màu lá đánh; Wild lấy màu được chọn.
- Chồng rút đặt riêng ở mép trên trái bàn, có số lượng và hiệu ứng độ dày; vị trí thu gọn riêng cho mobile/landscape. Lớp bay đo nguồn từ DOM tại vị trí mới.
- Giữa bàn chỉ có chồng bỏ: tối đa 8 lá, vị trí và góc lấy từ hash ID ổn định (x ±30% bề ngang lá, y ±7% chiều cao, góc ±25°). Lá mới bay tới đúng vị trí và góc đó; các lá cũ không xê dịch khi cập nhật lượt hoặc reload.
- Hai cung mũi tên quay liên tục quanh chồng bỏ bằng SVG/CSS, chu kỳ 12 giây. ActiveColor đổi màu và direction đổi cả hướng đầu mũi tên lẫn chiều quay; nhãn màu/số lượng nằm ngoài vùng quay. Reduced motion tắt chuyển động quay.

## Đồng bộ và vòng đời
RoomSession ghép snapshot trước/sau theo matchId và revision, lưu tối đa 16 frame gần nhất.
Chỉ public events đi vào frame hiệu ứng; bằng chứng +4 vẫn dùng luồng riêng của người thách thức.
Frame không thay đổi state server, không quyết định luật hoặc kết quả.
Snapshot server vẫn là dữ liệu chuẩn. UnoPresentation giữ tiến độ hạ bài và số lá đã đến đích để dựng tay bài/số lượng hiển thị trong lúc chạy hiệu ứng. Các timer tiến độ được hủy cùng scene; hoàn tất hoặc bỏ qua hiệu ứng trả ngay về snapshot hiện hành.

UI khóa thao tác chơi trong thời gian hiệu ứng của frame chưa kết thúc.
Timeout/lỗi từ server không tự tạo hiệu ứng thành công.
Frame được xử lý một lần theo ID; snapshot lặp lại không phát lại nước đánh.
Reload/đổi ván/ngắt kết nối/tạm dừng xóa hoặc bỏ qua lịch sử cũ.
Resize/tab ẩn hủy chuyển động đang chạy để không để lại bóng bài hoặc khóa điều khiển.
Mọi animation và timer được dọn khi lớp hiệu ứng unmount.
Neo vị trí được đo từ DOM; tay bài cuộn vẫn có điểm đích trong vùng màn hình.

## Trợ năng
Tôn trọng prefers-reduced-motion: bỏ bài bay/nhịp nảy, giữ nhãn và thông báo nhẹ.
Các lớp bay không nhận click và được ẩn khỏi cây accessibility.
Thông báo text và trạng thái lượt có sẵn cho screen reader.
Nhãn chức năng được giữ trong viewport mobile, biểu tượng vẫn gắn với vị trí người chịu tác động.

## Kiểm tra local
```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e
```
Có các test đánh/đặt bài, Skip, bốc 2/4/6 lá, mặt bài riêng tư,
Reverse hai người, không replay sau reload, reduced motion và chơi trọn ván.
Test chạy ở cổng riêng như mô tả trong uno-table.md.

Âm thanh và animation chia bài đầu ván chưa nằm trong bước này.

## Kích thước và thời gian đọc thông báo
- Bài đã đánh tăng theo chiều cao mặt bàn: desktop tối đa 162px, mobile 124px; khung ngang thấp dùng kích thước gọn hơn. Quỹ đạo tăng tương ứng và vẫn chung tâm.
- Khoảng cách avatar/quạt bài: desktop 30px, mobile 20px, màn hình ngang thấp 14px.
- NOTICE_DURATION = 2 giây; fade vào/ra 0,15 giây mỗi đầu, giữ rõ 1,7 giây. Áp dụng cả thông báo hành động và lượt chơi, kể cả reduced motion/catch-up. Timer của scene tính cả thời gian đọc, tránh gỡ thông báo trước khi animation xong.
- Thông báo lượt bắt đầu sau chuyển động bài, có vị trí riêng để tránh đè thông báo hành động.

## Giảm thông báo trùng
- CARDS_DRAWN chỉ dùng một caption trong DrawSequence, bỏ badge bốc bài cạnh người nhận. Reduced motion giữ caption và bỏ các lá bay.
- +2 viết ngắn theo màu + ký hiệu, ví dụ Đỏ +2. +4 gộp người đánh, màu đã chọn và người cần phản hồi vào một badge.
- Đánh bài + hô UNO cùng hành động được gộp; Skip gộp lá đánh, người mất lượt và UNO nếu có. Kết quả thách thức/phạt quên UNO đưa vào caption bốc, không tạo thêm ô báo.
- Báo lượt sau khi caption bốc và thông báo hành động đã xong; không lặp toast cho phase drawn/draw-four hoặc Reverse hai người đã có câu được chơi tiếp. Trạng thái lượt và avatar sáng luôn còn trên bàn.

- Caption “vừa bốc” chỉ hiển thị cho người nhận bài. Người đánh/quan sát chỉ thấy lưng bài bay và số lượng cập nhật, không hiện thêm tên người khác vừa bốc. Nếu có ngữ cảnh quan trọng như kết quả thách thức, người quan sát chỉ nhận phần kết quả, không lặp câu bốc bài.
