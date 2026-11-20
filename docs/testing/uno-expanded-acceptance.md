# UNO Mở rộng — tình huống nghiệm thu v1

Ngày lập: 19/11/2026. Đây là danh mục kịch bản thiết kế cho toàn bộ Mở rộng. Backend đã có test tự động đến bước 7; xem phạm vi bên dưới, không coi cả E001–E070 là đã nghiệm thu.

Đọc cùng [luật](../games/uno-expanded.md) và [quyết định](../games/uno-expanded-decisions.md). Kết quả gắn Dxx dưới đây là kỳ vọng theo đề xuất hiện tại; phải đổi nếu phương án review thay đổi.

Trừ khi nói khác, bốn ghế A→B→C→D theo chiều +1, đủ kho bốc, không ai mất mạng. Mọi ca giữ đúng 198 ID vật lý duy nhất sau mỗi giao dịch và chỉ công khai thông tin được luật cho phép.

## A. Bộ bài và bảo vệ bản Cơ bản

| ID | Tình huống | Kỳ vọng |
| --- | --- | --- |
| E001 | Tạo bộ mở rộng | 198 ID; 112 số thuần, 32 chức năng nền, 54 mở rộng; 156 có màu, 42 đen. |
| E002 | Đếm từng màu | Mỗi màu 39; số 0 một bản, số 1–9 mỗi số ba bản; từng chức năng đúng bảng. |
| E003 | Chia cho 2/3/4 người | Mỗi tay 7; còn 183/176/169 lá bốc sau khi mở một lá. |
| E004 | Đỉnh kho là High Five/Seven Change hoặc Wild | Không dùng làm mở đầu; trả các lá chức năng đã bỏ qua vào kho theo quy trình chia. |
| E005 | Chơi Mở rộng rồi tạo phòng Cơ bản | Cơ bản vẫn 108 lá, `uno-house-v3`, không có ID mở rộng; toàn bộ test cũ vẫn qua. |
| E006 | Vào phòng bằng link khác game | Client hiển thị đúng game của phòng; không cho client thay luật giữa ván. |

## B. Lượt thường và chuỗi cố định

| ID | Tình huống | Kỳ vọng |
| --- | --- | --- |
| E007 | Đánh sai lượt, lá không thuộc tay, sai màu, sai match/revision | Từ chối riêng, không sửa bài/revision; không phạt UNO từ một nước bị từ chối. |
| E008 | Bốc được lá hợp lệ nhưng chọn lá cũ | Từ chối; chỉ đánh lá mới hoặc bỏ lượt. |
| E009 | Chuỗi A +2 → B +6 → C +8 | D chịu 16; màu/lượt/tổng nhất quán trên 4 client. |
| E010 | D nhận 16 rồi muốn dùng lá vừa bốc để nối | Chuỗi đã đóng, D mất lượt; không chấp nhận nối. |
| E011 | B đánh Target +4 vào D sau A +6 | D chịu 10; nhận xong tới A, không tự tới C. |
| E012 | Target chọn chính mình/người ngoài phòng | Từ chối cả lệnh, không bỏ lá kích hoạt. |
| E013 | B Shield sau A +8 | C chịu 8; tổng không về 0; màu B chọn được áp dụng. |
| E014 | C đánh +2 ngay sau Shield | Từ chối theo D03; +4/+6/+8/Target/Shield hợp lệ vẫn được phép. |
| E015 | Dùng ×2/÷2, Skip/Reverse/Up hoặc xả để né chuỗi | Từ chối, không đổi số bài/tổng/lượt. |
| E016 | Chuỗi vượt 8, có nhiều lần chuyển mục tiêu | Không cắt tổng về 8; ghế không đổi; chỉ người đang chịu được đáp. |
| E017 | Retry cùng requestId 12 lần | Một chuyển trạng thái, một lượt bốc, một nhóm event; payload khác cùng ID bị từ chối. |

## C. Thay đổi tay bài và chiều

| ID | Tình huống | Kỳ vọng |
| --- | --- | --- |
| E018 | ×2 vào người có 6 lá | Rút thêm 6 thành 12 nếu đủ, mất lượt; không nhân tổng phạt. |
| E019 | Bỏ ÷2 rồi còn 7 lá | Chọn đúng 3 để bỏ, giữ 4; ID bỏ nằm dưới kho; không lộ mặt cho đối thủ. |
| E020 | ÷2 chọn trùng ID/thiếu ID/ID đối thủ | Từ chối nguyên tử, không bỏ lá kích hoạt hoặc một phần tay. |
| E021 | Xả đỏ với lá đỏ số, +2, High Five và xả đỏ khác | Tất cả đỏ phụ đi cùng; không phát sinh +2 hoặc đập tay; lá kích hoạt ở trên cùng. |
| E022 | Xả màu tự chọn khi còn lá đen khác | Chỉ xả màu chọn; các lá đen khác vẫn ở tay. |
| E023 | Đánh lá xả khi không có lá phụ cùng màu | Hợp lệ theo D05, chỉ bỏ lá kích hoạt. |
| E024 | Seven Change L/R với bốn tay khác nhau | Mỗi người nhận đúng tay của một ghế, không nhân bản; màu giữ theo lá; chiều và người đi sau đúng D06. |
| E025 | Chuyền nhận một lá | Không phạt UNO; trạng thái UNO cũ không bám theo tay được chuyển. |
| E026 | Skip Two với 2/3/4 người | Lần lượt tới đối thủ/người đánh/ghế thứ tư theo D06. |

## D. Up và Battle

| ID | Tình huống | Kỳ vọng |
| --- | --- | --- |
| E027 | Up chọn đỏ, người kế có số đỏ | Mở bằng màu đỏ; không cho người kích hoạt tự đánh lá mở chuỗi. |
| E028 | Sau số 5 có 5 khác màu, rồi 8, 9, 9 | Theo được bằng hoặc lớn hơn; 9 đầu không tự thắng cuộc đấu. |
| E029 | High Five=5, Seven Change=7 trong Up | Chỉ đối đáp theo số, không mở chức năng phụ. |
| E030 | Có lá đáp nhưng cố chọn nhận phạt | Server phát hiện và từ chối, không cho giữ lá để tránh đánh. |
| E031 | Không đáp được số 8 | Rút 8, không lấy số lần hô làm hình phạt; kết thúc Up, mất lượt. |
| E032 | Không mở được Up / không đáp sau số 0 | Theo D07 phạt 1 / phạt 0; không kẹt phase. |
| E033 | Battle: cả hai có số cùng màu, chọn khác nhau | Khóa bí mật, không lộ số trước lúc lật; cao hơn thắng, bỏ thêm min(2,N); thấp hơn rút 2. |
| E034 | Battle: hai số bằng nhau | Chỉ bỏ lá so, không thêm thưởng/phạt; không đối đáp tiếp vô hạn. |
| E035 | Battle: một bên không có số màu chọn | Server tự xác nhận; bên có chọn một lá so và thưởng, bên không có +2. |
| E036 | Battle: cả hai không có số màu chọn | Người kích hoạt +3, đối thủ +2 theo D08; không lộ toàn bộ tay để chứng minh. |
| E037 | Battle: đổi lá sau khóa, người ngoài tham gia | Từ chối, giữ lựa chọn hợp lệ trước đó. |
| E038 | Battle: hai người khóa gần đồng thời cùng global revision | Không làm người thứ hai mất quyền chỉ vì revision người thứ nhất; effect/slot được kiểm tra độc lập. |
| E039 | Battle: timeout chọn lá/chọn thưởng | Sau 20 giây chọn phương án hợp lệ theo D15; không tự hô UNO, không kẹt ván. |

## E. Rút đặc biệt và đập tay

| ID | Tình huống | Kỳ vọng |
| --- | --- | --- |
| E040 | Tornado xanh, kho lần lượt đỏ/đen/xanh | Theo D09 rút 3, giữ cả 3, Wild không dừng, mất lượt; người khác không thấy mặt. |
| E041 | Tornado dùng hết kho nhưng không ra màu | Tái sử dụng đúng chồng bỏ; dừng khi không còn ID có thể rút; không lặp vô hạn. |
| E042 | Random lật số 6 | Công khai đúng một lá, giữ lá đó và rút thêm 6 riêng tư; tổng thực nhận 7 nếu đủ; mất lượt. |
| E043 | Random lật số 0 | Giữ một lá, không rút thêm. |
| E044 | Random lật High Five/+8/Wild | Theo D10 giữ một lá, không dùng 5/8 làm số rút; không chạy chức năng vừa lật. |
| E045 | Shield trong Tornado/Random/Battle/Up/High Five | Không được dùng như phản ứng né hiệu ứng. |
| E046 | High Five đủ ba người phản ứng | Chỉ người kích hoạt được miễn, người phản ứng cuối bốc 2; lượt thường trở về sau người kích hoạt. |
| E047 | Bấm trước 1,5 giây, bấm hai lần, timestamp giả | Không thay thứ tự; server quyết định theo thời gian nhận hợp lệ. |
| E048 | High Five: một/nhiều người không bấm | Theo D11 phạt đúng một người; trường hợp nhiều người dùng thứ tự ghế đã định. |
| E049 | High Five hai người | Tự phạt đối thủ duy nhất 2, không chờ vô ích. |
| E050 | Hai người gửi đập tay cùng revision gần đồng thời | Cả hai có thể được ghi nhận, không loại một người do global revision tăng; server vẫn phân thứ tự nhận. |

## F. UNO và kết thúc

| ID | Tình huống | Kỳ vọng |
| --- | --- | --- |
| E051 | Xả hoặc ÷2 từ nhiều lá xuống một | Có khai báo UNO thì không phạt; không khai báo thì tự +2; không cần người khác bắt. |
| E052 | Battle bỏ lá so xuống một / thưởng xuống một | Kiểm tra UNO ở giao dịch bỏ tương ứng, không khi chỉ giữ chỗ; thiếu khai báo tự +2. |
| E053 | Xả từ nhiều xuống không | Thắng, không phạt vì đã đi qua số lượng một ở giữa animation. |
| E054 | Đánh Seven Change/High Five/Up/Battle làm lá cuối | Theo D13 thắng mà không mở thử thách/chuyền tay rỗng; không yêu cầu thêm chọn mục tiêu. |
| E055 | Lá cuối +6/+8/Target hoặc Shield đang chuyển chuỗi | Người nhận tự bốc tổng, không Shield/nối thêm; tính điểm sau bốc. Shield không tự xóa phạt vì tay đã hết. |
| E056 | Lá cuối ×2/Tornado/Random | Hoàn tất phần bốc hữu hạn rồi tính điểm; không mở lượt phản ứng. |
| E057 | Thua Battle nhưng dùng hết tay ở lá so | Rút phạt trước xét thắng, không thoát hình phạt bằng trạng thái rỗng tạm. |
| E058 | Battle hòa và hai bên cùng hết | Hòa ván `simultaneous-finish`; không chọn thắng vì packet đến trước. |
| E059 | Có kết quả rồi còn timer/gói đập tay cũ | Không sửa kết quả, không bốc thêm; rematch ID mới không nhận lệnh cũ. |
| E060 | Điểm chức năng có giá trị 5/7 | Tính 20, số thuần theo số, lá đen 50; mọi client thấy cùng kết quả. |

## G. Realtime, riêng tư và giao diện

| ID | Tình huống | Kỳ vọng |
| --- | --- | --- |
| E061 | Reload khi chờ nhận tổng phạt / giữa Battle / Up | Giữ ID người chơi, tay bài, phase, lượt, lựa chọn được phép xem; không chạy lại phần đã giải quyết. |
| E062 | Mất kết nối khi đang đập tay | Ván/timer dừng; reconnect giữ thứ tự cũ, mở lại chuẩn bị cho người chưa bấm; chống gói cũ bằng effectId/lần thử. |
| E063 | Người giữ quyền chọn rời ván/hết 30 giây | Theo hành vi kết thúc do rời phòng; không để người khác kẹt ở popup của người đã đi. |
| E064 | 4 client nhận lựa chọn bí mật Battle / ÷2 | View/schema/event không lộ ID hoặc mặt chưa được công khai; Random chỉ lộ lá đầu. |
| E065 | Hai phiên bản cùng hoạt động | Một phòng không nhận commands/types/config của game kia. |
| E066 | Mô phỏng nhiều seed và tác vụ timeout | Mỗi ván kết thúc hoặc có điều kiện tiến triển xác định; bảo toàn 198 ID sau mỗi thao tác, retry không nhân hiệu ứng. |
| E067 | 4 phiên trình duyệt chơi trọn ván rồi rematch | Mỗi bên cùng lượt, màu/chiều, tổng phạt, mục tiêu, số bài, kết quả; không lộ bài, không kẹt lựa chọn. |
| E068 | Desktop/laptop/tablet/mobile/ngang | Mặt bài mới, lựa chọn mục tiêu/xả, bộ đếm, nút UNO/đập tay và popup luật đều nhìn được, không tràn ngang. |
| E069 | Tắt âm thanh / giảm chuyển động / ẩn tab | Không đổi kết quả nghiệp vụ; hiệu ứng không tự phát lại khi quay lại/reload. |
| E070 | Chạy lại toàn bộ kiểm thử Cơ bản | Bộ 108 lá và các hành vi hiện tại không đổi. |

## Cách dùng tài liệu ở bước triển khai

- Chuyển từng ca thành unit/integration/E2E đúng lớp, không bắt mọi tổ hợp luật chạy bằng trình duyệt.
- Đối chiếu Dxx đã duyệt trước khi viết assertion; không dùng assertion để âm thầm quyết định một luật còn mở.
- Với các ca mạng, thêm kiểm tra lệnh sai/stale không sửa state, nhiều phản hồi đồng thời không làm kẹt mini-game, timer đã hủy không xử lý lại.
- Chưa báo bất kỳ E001–E070 là "passed" trước khi có code và kết quả chạy thực tế.

## Phạm vi tự động hóa đến bước 5 — 20/11/2026

| Phạm vi | Test tương ứng |
| --- | --- |
| Bộ 198 lá, mở đầu số, bảo mật góc nhìn | `deck.test.ts`, `setup.test.ts`, `privacy-and-commands.test.ts` |
| Lượt nền, UNO, gợi ý, lỗi không đổi state | `turns.test.ts`, `service.test.ts` |
| +2/+4/+6/+8/Target/Shield và nhận phạt | `stacking.test.ts`, `uno-expanded-room.test.ts` |
| Tornado, Random, ×2 và thiếu bài | `draw-effects.test.ts`, `results-and-privacy.test.ts` |
| Lá cuối, tính điểm, bế tắc, RNG lỗi/rollback | `results-and-privacy.test.ts` |
| Mô phỏng 2–4 người giữ đủ 198 ID | `simulation.test.ts` — luật từng phần, tối đa 500 lệnh mỗi lượt chạy |
| Reconnect giữa chuỗi chuyển mục tiêu, dedup nhận phạt, rematch | `uno-expanded-room.test.ts` |
| Catalog chưa mở Mở rộng, link mời nội bộ, sảnh Cơ bản | Playwright `catalog.spec.ts`, `uno-expanded.spec.ts`, `lobby.spec.ts` |

Các file unit nằm trong `apps/meepleverse-api/tests/unit/uno-expanded`; test realtime nằm trong `tests/integration/realtime`. Đây là ánh xạ phạm vi, không khẳng định mọi biến thể của từng E-ID đã có test độc lập.

Up, Battle, High Five, chuyền tay, Skip Two, ÷2, xả màu, UNO khi bỏ nhiều lá và timer mini-game vẫn chờ các bước sau. Mặt bài mới, bộ điều khiển và animation Mở rộng chưa được nghiệm thu ở bước này.

## Phạm vi tự động hóa bổ sung ở bước 6 — 20/11/2026

| Phạm vi | Test |
| --- | --- |
| ÷2 chọn đủ số lá, bảo mật đáy kho, thứ tự server và UNO nhiều-xuống-một | `divide-hand.test.ts` |
| Hai loại xả màu, không chạy hiệu ứng phụ, giữ lá kích hoạt và thắng khi xả hết | `discard-colors.test.ts` |
| L/R đồng thời với 2–4 người, hai chiều cũ, tay nhận một lá và phạt đúng người | `hand-transfers.test.ts` |
| Skip Two 2–4 người/hai chiều; so số 7; lá vừa bốc; không né chuỗi; rollback | `bulk-and-turn-interactions.test.ts` |
| Bảo toàn 198 ID sau mỗi lệnh, bao gồm lựa chọn nhiều lá và chuyền tay | `simulation.test.ts` |
| Lựa chọn sai/duplicate; ÷2 → xả → chuyền; giữ kín tay mới và reconnect; kết thúc xả | `uno-expanded-room.test.ts` |

Bảng bước 5 phía trên là lịch sử phạm vi của mốc đó. Hiện ÷2, xả màu, chuyền tay, Skip Two và UNO cho các thao tác trên đã được triển khai; Up/Battle/High Five cùng timer/kết quả mini-game và giao diện mới vẫn chờ các bước sau. Ánh xạ phạm vi không đồng nghĩa mọi tổ hợp E001–E070 đã có test riêng.

## Phạm vi tự động hóa bổ sung ở bước 7 — 20/11/2026

| Phạm vi | Test |
| --- | --- |
| Up mở màu, đáp >=, 5/7 không chạy phụ, tự phạt 1/0/số gần nhất, UNO và lá đáp cuối | `wild-up.test.ts` |
| Battle khóa bí mật, một/cả hai không có, so số, thưởng, UNO, timeout và hòa cùng hết | `wild-battle.test.ts` |
| High Five chuẩn bị/cửa sổ, thứ tự, trùng/ngoài cuộc, hai chiều, timeout, hai người | `high-five.test.ts` |
| Lá kích hoạt cuối Up/Battle/High Five không mở thử thách | `mini-endings.test.ts` |
| Cùng revision, freeze nhiều người, giữ khóa/thưởng, attempt mới, timeout/rematch | `effect-service.test.ts` |
| Bốn SDK client qua WebSocket thật: privacy/schema/event, đồng thời, retry, timer, reconnect, lệnh ván cũ | `uno-expanded-minigames.test.ts` |
| Chơi trọn 60 ván có seed cho 2/3/4 người, bảo toàn 198 ID sau lệnh và timer | `simulation.test.ts` |

Các bảng bước 5–6 là lịch sử. Hiện mọi loại lá có luật backend; mặt bài/bộ điều khiển/animation Mở rộng và bốn người thật sau deploy vẫn chưa được nghiệm thu. E067/E068/E069 không được coi hoàn thành chỉ từ test SDK/domain. Danh sách là ánh xạ phạm vi; không khẳng định mọi tổ hợp E001–E070 có test độc lập.

## Kiểm tra hiển thị bước 8 — 20/11/2026

Playwright `uno-expanded-cards.spec.ts` có 3 ca: đủ 22 kind/60 mẫu, nhãn truy cập và khung SVG; bộ lọc/kích thước/mobile-tablet/tỷ lệ tay-bàn; catalog chưa mở chơi. Cả 3 qua trên Edge. Chạy thêm 2 ca Cấm/Đổi chiều xanh lá ở 1366px trong `uno-effects.spec.ts`, đều qua sau khi chuyển vector nền sang common. TypeScript và lint frontend đạt. Không chạy lại bài chơi dài vì không đổi luật hoặc transport.

Đã duyệt ảnh chụp mặt bài ở thư viện nội bộ; chưa xem đây là nghiệm thu E068 trên bàn chơi Mở rộng. Điều khiển, animation và chơi đủ ván bằng UI Mở rộng vẫn chờ bước tích hợp.
