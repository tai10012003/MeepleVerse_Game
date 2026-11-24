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
| E026 | Skip Two với 2/3/4 người | Lần lượt tới người đánh/người đánh/ghế thứ tư; bàn hai người chỉ cấm đối thủ (cập nhật 22/11/2026). |

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
| E039 | Battle: timeout chọn lá/chọn thưởng | Sau 30 giây chọn phương án hợp lệ theo D15; không tự hô UNO, không kẹt ván. |

## E. Rút đặc biệt và đập tay

| ID | Tình huống | Kỳ vọng |
| --- | --- | --- |
| E040 | Tornado xanh, kho lần lượt đỏ/đen/xanh | Theo D09 rút 3, giữ cả 3, Wild không dừng, mất lượt; người khác không thấy mặt. |
| E041 | Tornado dùng hết kho nhưng không ra màu | Tái sử dụng đúng chồng bỏ; dừng khi không còn ID có thể rút; không lặp vô hạn. |
| E042 | Random lật số 6 | Công khai đúng một lá, giữ lá đó và rút thêm 6 riêng tư; tổng thực nhận 7 nếu đủ; mất lượt. |
| E043 | Random lật số 0 | Giữ một lá, không rút thêm. |
| E044 | Random lật High Five/+8/Wild | Theo D10 giữ một lá, không dùng 5/8 làm số rút; không chạy chức năng vừa lật. |
| E045 | Shield trong Tornado/Random/Battle/Up/High Five | Không được dùng như phản ứng né hiệu ứng. |
| E046 | High Five đủ mọi người phản ứng | Kể cả người kích hoạt tham gia; người phản ứng cuối bốc 2; lượt thường trở về sau người kích hoạt. |
| E047 | Bấm trước 1 giây, bấm hai lần, timestamp giả | Không thay thứ tự; server quyết định theo thời gian nhận hợp lệ. |
| E048 | High Five: một/nhiều người không bấm | Mỗi người chưa bấm khi hết cửa sổ 5 giây đều bốc 2, người đã bấm không bị phạt. |
| E049 | High Five hai người | Cả hai phải bấm: đủ phản hồi thì người cuối +2; không ai bấm thì cả hai +2. |
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

## Kiểm tra UI 9A — 20/11/2026

`uno-expanded.spec.ts` thay màn notice cũ bằng 7 ca nền: 4 browser/bộ 198/reload; drawn-card-only; Khiên/cộng dồn/màu; Target +4; ÷2 có/không hô UNO; kết thúc xả màu/rematch. Thêm 2 hồi quy sảnh/Wild Cơ bản, cả 9 ca liên quan qua. Đã xem ảnh bàn mobile và kiểm tra không tràn, chỉ render mặt sau đối thủ. Typecheck/lint workspace đạt. Xem [phạm vi 9A](../development/uno-expanded-table.md).

Đây là nghiệm thu UI từng phần. Mini-game, hiệu ứng/sound cues và E067 chơi trọn ván Mở rộng bằng giao diện chờ 9B/9C; không suy ra đã sẵn sàng phát hành.

## Kiểm tra UI 9B — 21/11/2026

`uno-expanded-minigames.spec.ts`: 7 ca Up/Battle/High Five, gồm privacy trước lật, draft khi đối thủ khóa, chọn đồng thời, UNO ở hai giao dịch Battle, reload giữa thưởng, thứ tự/attempt High Five sau reload và timeout server. Chạy cùng ca Cấm xanh lá 1366px để bảo vệ queue sự kiện Cơ bản: 8/8 qua. Sau thêm số phạt Battle, kiểm lại ca liên quan cùng ÷2/UNO và thông báo API cũ: 3/3 qua. Tổng 10 ca riêng biệt được xác minh, typecheck/lint workspace đạt.

Đã gỡ giới hạn kích hoạt ba mini-game trong UI nội bộ. Chưa coi E067 chơi trọn ván bằng UI, E069 trải nghiệm hiệu ứng đầy đủ hoặc kiểm thử bốn người thật qua Internet là hoàn thành. Xem [tài liệu 9B](../development/uno-expanded-minigame-ui.md).


## Kiểm tra UI 9C — 21/11/2026

Đã qua 7 ca liên quan: so kích thước trực tiếp với Cơ bản trên năm viewport, bốc chậm/riêng tư/reload, +2/không báo trùng, cấm, đảo chiều, High Five bốn client và hồi quy đánh lá số Cơ bản. Đã xem ảnh bàn Mở rộng ở desktop và mobile. Typecheck/lint workspace đạt. Kiểm thử thông báo Cơ bản đo timeline opacity thực thay vì chờ thêm 1.2 giây sau nhiều assertion vốn đã tiêu thụ thời gian hiển thị.

Xem [phạm vi animation](../development/uno-expanded-animations.md). Các ca này chưa xác nhận E067 (chơi trọn ván Mở rộng bằng UI), toàn bộ tiêu chí E069 hoặc thử người thật qua Internet.


## Cập nhật artwork và luật Đập tay — 21/11/2026

Đã qua 357 kiểm thử backend (30 file), gồm clock/concurrency/reconnect qua WebSocket và bảo toàn bộ bài. Tám ca giao diện liên quan đạt sau khi kiểm tra/cố định nút chỉ nhấp nháy ánh sáng: artwork 60 mẫu, bố cục sáu viewport, bốn người phản hồi, reconnect, timeout nhiều người, hai thứ tự ở bàn hai người và cả hai không bấm trong cửa sổ thật 5 giây. TypeScript frontend/backend và lint đạt. Đã xem ảnh nút trên mobile cùng ảnh +4/High Five phóng lớn.

+4 thường dùng artwork chung thu nhỏ riêng nhóm bốn thẻ 10%, giữ nguyên elip. High Five dùng cách căn số chung với Cơ bản. Không thay các luật còn lại, không mở phát hành công khai hoặc suy ra đã nghiệm thu trọn ván trên môi trường triển khai.


## Nghiệm thu trọn ván bước 10 — 21/11/2026

Đã qua 29 ca UI riêng biệt trên Edge qua các lượt chạy tập trung: hai ván đầy đủ 198 lá với bốn phiên độc lập (seed 17/21), 17 tình huống chức năng và 10 ca mini-game. Mỗi ván đầy đủ có rời trang/kết nối lại và rematch; đối chiếu đồng bộ, tính riêng tư, tổng bài và kết quả sau từng thao tác. Các viewport là desktop, laptop, tablet và mobile mô phỏng; hai ván đầy đủ dùng giảm chuyển động, các ca chức năng dùng animation thường.

E067 đã có bằng chứng qua UI local. E068 được bổ sung phạm vi bốn viewport, chưa xác nhận mọi tổ hợp hiển thị; E069 chưa nghiệm thu đầy đủ. Không suy ra đã kiểm tra nhóm người thật qua Internet hoặc sẵn sàng phát hành. Mọi đoạn “chưa chơi trọn ván UI” ở các mục lịch sử phía trên là trạng thái trước bước 10.

Đã sửa thông báo Random để nêu lá lật công khai trong cùng thông báo. Đã sửa hai fixture Xả màu thiếu lá và thứ tự assertion của thông báo Up; các ca liên quan chạy lại đạt. Toàn bộ 357 kiểm thử backend (30 file), TypeScript và lint workspace đạt. Xem [phạm vi, kết quả và lệnh chạy lại bước 10](../development/uno-expanded-full-game-acceptance.md).


## Hướng dẫn chơi bước 11 — 21/11/2026

Đã có popup bộ 198 lá và 14 nhóm chức năng ở danh mục/giới thiệu, trang vào bàn nội bộ, sảnh và bàn. Tám ca UI liên quan trên Edge đều đạt, gồm bốn ca mới laptop/mobile, hai ca hướng dẫn Cơ bản và hai ca catalog; TypeScript/lint workspace đạt. Xác minh phòng vẫn nhận người/nước đánh khi đang đọc hướng dẫn và không tràn ngang. Đây là bằng chứng bổ sung cho phần hướng dẫn của E068, không đánh dấu toàn bộ E068/E069 hoàn tất. Xem [phạm vi và cách chạy bước 11](../development/uno-expanded-rules-ui.md).


## Mở chơi thử bước 12 — 21/11/2026

Đã qua 12 ca UI riêng biệt: catalog hai game chơi được, artwork gameplay, mobile/404/quay lại phòng, thư viện tách khỏi luồng chơi, hướng dẫn laptop/mobile, Cơ bản và hai ván Mở rộng đủ 198 lá. Hai ván xuất phát từ trang chủ, có người vào bằng mã và người vào link mời, reconnect và rematch. Một selector catalog cũ được sửa cho hai nút Chơi ngay và chạy lại đạt. 358 test backend (30 file), TypeScript/lint workspace đạt. Xem [mở chơi thử và giới hạn](../development/uno-expanded-beta.md). Chưa triển khai hoặc nghiệm thu qua Internet.


## Đồng hồ lượt — 22/11/2026

Có deadline server 60 giây cho lượt thường/cộng dồn và 30 giây cho mỗi đáp Up; Battle và Đập tay giữ thời hạn đã chốt. Kiểm thử bổ sung gồm timeout/UNO, snapshot không đổi ngoài thời gian trôi, packet trễ, pause nhiều người, nhận phạt, rematch và UI laptop/mobile. Xem [cách chạy và phạm vi đồng hồ](../development/uno-turn-clock.md). Không thay đổi xác suất hay tác dụng Tornado trong thay đổi này.


## Rà soát UNO, Skip Two và Battle — 22/11/2026

Bổ sung năm ca UI xả cố định/tự chọn với hô hoặc cố tình không hô và Skip Two hai người. Chạy cùng các ca ÷2, xả hết về đích, Up, Battle khóa bí mật/chọn thưởng/bỏ qua UNO; xác minh kết quả thu gọn sau 1,5 giây nhưng bước thưởng chưa xong không đóng. Cập nhật unit/WebSocket Skip Two cho cả 2/3/4 người và hai chiều. Xem [bảng rà soát các đường giảm bài](../development/uno-expanded-uno-review.md).


## Kết thúc ván không phát lại popup mini-game — 22/11/2026

MiniFeedback chỉ tồn tại khi ván còn PLAYING; xóa buffer phản hồi và bỏ qua phản hồi mini-game khi đã ENDED, giữ animation đánh/bốc cuối. Kiểm tra thắng bằng lá số sau Battle/Đập tay, lá Đập tay cuối, Battle tự kết thúc bằng timeout, reload/rematch và tình huống Battle còn chờ thưởng. Xem [nguyên nhân và ca tái hiện](../development/uno-expanded-uno-review.md).

## Nghiệm thu Card Swap / bộ 202 lá — 24/11/2026

Bản hiện tại là `uno-expanded-v2`, gồm 202 lá và 15 nhóm mở rộng. Các kết quả 198 lá bên trên là lịch sử. Đã cập nhật fixtures và phép đối chiếu tổng bài của các kiểm tra UI sang 202; phần Cơ bản vẫn 108 lá.

Đạt 404 test backend và 10 ca UI tập trung: Card Swap với đủ 202 lá, thư viện 61 mẫu, hướng dẫn/sảnh/bàn laptop/mobile và hai ván bốn client seed 17/21 tới kết quả, reconnect, rematch. Hướng dẫn mục 15 nêu rõ 4 lá đang chơi, chọn màu/mục tiêu, lá cuối thắng không đổi và nhận tay một lá không phạt UNO. Các ca hiệu ứng thường ở bước 2 tiếp tục là bằng chứng cho animation; hai ván dài dùng giảm chuyển động. Xem [phạm vi và lệnh nghiệm thu](../development/uno-card-swap.md).
