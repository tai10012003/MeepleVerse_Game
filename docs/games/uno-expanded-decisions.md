# UNO Mở rộng — bảng quyết định cần review

Ngày: 19/11/2026. Đi cùng [đặc tả luật](uno-expanded.md).

## 1. Những phần đã xác nhận trong trao đổi

| Mã | Nội dung đã chốt |
| --- | --- |
| C01 | Hai game riêng `uno-basic` và `uno-expanded`; không đổi luật/bộ bài Cơ bản. |
| C02 | Kết hợp các chức năng được chọn từ Storm, Battle, Infinity; không nhập nguyên mọi lá của cả ba bộ. |
| C03 | Dùng hướng dẫn tham khảo của từng bộ thay các ý tưởng tùy chỉnh về đấu tay đôi và Khiên xóa phạt đã trao đổi trước đó. |
| C04 | 14 mục / 15 loại lá mới, vì mục 14 gồm +6 và +8. |
| C05 | Bộ Mở rộng 198 lá: 112 số thuần + 32 chức năng nền + 54 mở rộng; số 0 mỗi màu 1, số 1–9 mỗi màu mỗi số 3. |
| C06 | Giữ 7 lá đầu ván, định hướng 2–4 người ở phạm vi hiện tại. |
| C07 | ×2 tác động lượng bài người kế, ÷2 giảm tay người đánh; không mặc định nhân/chia tổng phạt. |
| C08 | Shield chuyển phạt cộng dồn, không xóa mọi hình phạt. |
| C09 | Giữ tái sử dụng nền kết nối/phòng/giao diện/âm thanh, nhưng luật và cấu hình hai phiên bản phải tách rõ. |

## 2. Đề xuất cụ thể cho các khoảng trống

**Tất cả D01–D15 dưới đây đang là ĐỀ XUẤT, chưa có xác nhận của người dùng.** Việc chọn một phương án cụ thể giúp review được luật, không biến nó thành dữ kiện của bộ gốc. Khi được duyệt, ghi ngày/phiên bản quyết định; không xóa lịch sử lựa chọn.

| Mã | Vấn đề | Phương án đề xuất v1 | Điểm cần hiểu trước khi duyệt |
| --- | --- | --- | --- |
| D01 | Kế thừa luật nền nào? | Lá mở đầu số thuần; bốc 1 rồi chỉ đánh lá mới hoặc bỏ; không challenge +4; tự phạt quên UNO như Cơ bản. | Đây là kế thừa MeepleVerse, không phải toàn bộ luật Mattel hay mọi bản mở rộng vật lý. |
| D02 | Lá đen chọn màu lúc nào? | Chọn màu ngay khi đánh; Target/Battle chọn mục tiêu cùng lệnh. | Khác +4 của Cơ bản hiện chọn màu sau khi người nhận bốc. Làm màu đã xác định trong suốt các hiệu ứng. |
| D03 | Ghép chuỗi phạt? | +2/+4/+6/+8/Target +4 nối chéo bất kể màu/mức; Shield chỉ chuyển tổng. Không +2 ngay sau Shield. Nhận xong mất lượt, tới ghế sau người nhận. | Tổng có thể vượt 8. Target đổi người chịu, không đổi ghế. ×2/÷2 và các mini-game không nằm trong chuỗi. |
| D04 | ×2 có mất lượt, có chặn được không? | Chụp số bài lúc xử lý, rút thêm đúng số đó rồi mất lượt; không Shield/cộng tiếp. | Tác dụng tham khảo lên tay bài giữ nguyên; mất lượt và phạm vi phản ứng cần quy ước khi ghép. |
| D05 | Xả màu và ÷2 chọn bài/UNO thế nào? | Xả hết màu, cho đánh khi không có lá phụ; giữ lá kích hoạt trên cùng. ÷2 bỏ floor(N/2) sau khi bỏ lá kích hoạt. Chuẩn bị lựa chọn trước, gửi một giao dịch đầy đủ. | Nguồn xả màu có chỗ tự mâu thuẫn; không để client tùy đổi lá trên cùng. Xả xuống một lá cũng phải hô UNO. |
| D06 | R/L và Skip Two với ít người? | R/L chuyền đồng thời, đặt chiều R=-1, L=+1 theo thứ tự ghế đã định. Skip Two bỏ hai cơ hội lượt theo vòng, kể cả gặp lại chính người đánh. | Hai người: Skip Two tới đối thủ; ba người: tới người đánh. Cần xem đây có đúng trải nghiệm mong muốn không. |
| D07 | Up mở đầu/đáp màu nào, phạt bao nhiêu? | Người kế mở bằng số màu đã chọn; sau đó bất kỳ màu, số >= gần nhất. Dùng được High Five=5, Seven Change=7 nhưng không chạy phụ. Không mở được: phạt 1; sau lá 0: phạt 0. | Không phải đối đáp hai người, không phạt bằng số lần hô. Không giới hạn một vòng; 9 vẫn đáp 9 được. |
| D08 | Battle theo nguồn nào? | Chọn biến thể S4: so lá số theo màu chọn; chọn bí mật từ tay, không bốc ngẫu nhiên. Một bên không có số màu đó thì tự thua; cả hai không có: người kích hoạt +3, đối thủ +2. So bằng nhau chỉ bỏ lá so. | S2 mô tả đơn giản khác. Không tự gắn luật "đấu màu tới hết" hoặc "thua nhặt hết bài đã đấu". Cho phép High Five/Seven Change theo giá trị. |
| D09 | Tornado gặp Wild có dừng không? | Chỉ dừng ở đúng màu in trên Tornado; Wild không dừng. Bài bốc riêng tư. | S4 cho lá đổi màu giúp dừng, còn S1 không nêu; đây là một lựa chọn rõ ràng cần duyệt. |
| D10 | Random hoạt động theo biến thể nào? | Lật một lá công khai và giữ trên tay; số thuần N thì bốc thêm N; chức năng không bốc thêm, không kích hoạt; mất lượt. | S2 không giải thích rõ số trên +?; S4/S5 hỗ trợ cách lật. S4 còn cho đánh tiếp sau nhận, và một số nguồn cho trả lá lật xuống chồng bỏ: v1 đang chọn giữ + mất lượt. |
| D11 | Đập tay trên web? | Chuẩn bị 1,5 giây, cửa sổ 8 giây, server lấy thứ tự nhận; chỉ phạt một người cuối/không bấm. Nhiều người không bấm phân xử theo ghế; hai người tự phạt đối thủ. | Không suy thời điểm chạm thật từ timestamp máy người chơi; không hứa công bằng độ trễ tuyệt đối. |
| D12 | Hô UNO khi thay đổi nhiều lá? | Bất kỳ hành động bỏ chủ động từ >=2 xuống 1 cần khai báo; quên +2. Chuyền cho nhau không phạt. Battle kiểm tra ở lúc thật sự bỏ, không lúc giữ chỗ. | Nút UNO cần hỗ trợ kết quả xả/chia/so, không chỉ sáng khi tay hiện có đúng hai lá. |
| D13 | Thắng khi còn hiệu ứng chưa xong? | Kiểm tra ở ranh giới giao dịch. Lá cuối hiệu ứng không rút thì thắng, bỏ hiệu ứng còn lại; lá cuối bắt rút hoặc Shield cuối đang chuyển chuỗi thì hoàn tất phần rút bắt buộc rồi tính điểm. Battle đang chạy giải quyết thưởng/phạt rồi mới xét hết bài. | Không chuyền tay rỗng để thắng hộ người khác. Nếu cùng hết trong Battle: ưu tiên người thắng Battle; nếu hòa và cùng hết thì hòa ván. |
| D14 | Thiếu bài/tính điểm? | Bốc tối đa hữu hạn, không tạo lá. Blocked chỉ xét vòng lượt thường bị kẹt. Số thuần theo số, chức năng màu 20, đen 50. | High Five/Seven Change có giá trị 5/7 để đáp số nhưng tính 20 điểm chức năng. |
| D15 | Reconnect/timer/phản hồi đồng thời? | Giữ 30 giây; đóng băng timer. Battle chọn/nhận thưởng hạn 20 giây với fallback hợp lệ. Phản hồi High Five/Battle không bị loại chỉ vì người khác vừa phản hồi tăng revision. | Cần effectId + trạng thái từng người + dedup request; không dùng strict global revision đơn thuần cho phản hồi đồng thời. Lượt thường giữ kiểm tra revision hiện tại. |

## 3. Bảng tương tác đề xuất

| Đang xử lý | Được dùng để phản hồi | Không được dùng |
| --- | --- | --- |
| Chuỗi phạt cố định | +2/+4/+6/+8/Target +4/Shield, hoặc nhận; trừ +2 ngay sau Shield | ×2, ÷2, Up, Battle, Tornado, Random, Skip/Reverse, xả/chuyền |
| Up | Số hợp lệ, High Five=5, Seven Change=7 | Shield, lá đen, bốc thử, hiệu ứng phụ của số 5/7 |
| Battle chọn lá | Số màu phù hợp, High Five=5/Seven Change=7 cùng màu; chọn bí mật | Người ngoài cuộc, đổi lựa chọn sau khóa, Shield |
| Battle thưởng | Chọn đủ min(2, N) lá bất kỳ của mình | Chọn bài đối phương hoặc chạy chức năng của lá bỏ |
| High Five | Chỉ một lần đập tay đúng effectId trong cửa sổ | Chơi bài, chọn mục tiêu khác, Shield, timestamp giả |
| Tornado/Random/×2 đang giải quyết | Không có cửa sổ chặn; server xử lý một giao dịch hữu hạn | Cộng dồn, dùng bài vừa bốc giữa giao dịch |
| Xả màu/÷2/chuyền | Thay đổi bài nguyên tử | Chạy chức năng của các lá di chuyển |
| Bốc phạt UNO | Chỉ nhận; phạt không nhập tổng chuỗi | Shield hoặc gán phạt cho người khác |

## 4. Ranh giới bước tiếp theo

Bước 1 chỉ tạo đặc tả và ca nghiệm thu. Chưa thêm package, types runtime, room mới, mặt bài, UI tạo phòng, luật thật hay phát hành game.

Bước 2 có thể kiểm tra độc lập cấu hình 198 lá theo C05. Các bước triển khai luật phải bám phiên bản Dxx được duyệt; nếu đổi một quyết định, cập nhật các ca nghiệm thu liên quan trước, không sửa hành vi Cơ bản theo.
