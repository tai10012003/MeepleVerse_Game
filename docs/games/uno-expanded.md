# UNO Mở rộng — đặc tả luật v2

- Ngày lập: **19/11/2026**.
- Game ID: `uno-expanded`; rules ID hiện tại: `uno-expanded-v2`.
- Bước 12: đã mở nhãn Chơi thử, tạo/vào phòng tại `/games/uno-expanded` và đăng ký API mặc định cho cả hai phiên bản; xem [luồng chơi thử](../development/uno-expanded-beta.md). Đã có [nghiệm thu local bước 10](../development/uno-expanded-full-game-acceptance.md) và hướng dẫn bước 11. Chưa triển khai server thật; kiểm thử người thật sau deploy còn riêng.
- Phạm vi đã xác nhận: **202 lá, 2–4 người, chia 7 lá; 15 mục mở rộng / 16 loại lá mới**.
- [UNO Cơ bản](uno.md) tiếp tục dùng 108 lá và `uno-house-v3`; tài liệu này không sửa luật Cơ bản.
- Các quy ước ghép bộ mang mã **Dxx** là lựa chọn riêng của MeepleVerse; trạng thái xác nhận theo từng bước nằm trong [bảng quyết định](uno-expanded-decisions.md). Không coi chúng là một luật gốc thống nhất cho mọi bộ ngoài thị trường.
- Xem [tình huống nghiệm thu](../testing/uno-expanded-acceptance.md) để triển khai và kiểm tra từng nhánh.

> Shared foundation: [UNO common modules](../development/uno-common.md). Basic now uses the shared mechanics and UI primitives; Expanded draw/defense, bulk-discard/turn-control and mini-games are implemented internally; see [step 7](../development/uno-expanded-minigames.md).

> Internal room foundation: [setup, protocol and verification](../development/uno-expanded-foundation.md). The 202-card match supports internal base turns and draw/defense rules; see [step 5](../development/uno-expanded-draw-defense.md).

## 1. Nguồn và cách sử dụng

| Mã | Tài liệu | Phạm vi tham khảo |
| --- | --- | --- |
| S1 | [H2 Rubik — UNO Storm](https://rubikonline.vn/huong-dan-cach-choi-uno-storm-ban-mo-rong-uno) | Các chức năng Storm và số lượng lá |
| S2 | [H2 Rubik — UNO Battle](https://rubikonline.vn/huong-dan-choi-uno-battle-uno-mo-rong) | Các chức năng Battle |
| S3 | [Thủ Thuật Chơi — UNO Infinity](https://thuthuatchoi.com/huong-dan-cach-choi-uno-infinity.html) | ×2, ÷2, Wild Discard và số lượng tương ứng |
| S4 | [Thủ Thuật Chơi — các lá mở rộng](https://thuthuatchoi.com/cac-quan-bai-mo-rong-trong-tro-choi-uno.html) | Mô tả chi tiết các biến thể Battle và Random |
| S5 | [H2 Rubik — sản phẩm Battle](https://rubikonline.vn/uno-battle-ban-mo-rong-uno) | Một cách giải thích Random khác bài hướng dẫn S2 |

Các tài liệu này mô tả những bộ mở rộng không chính thức và có chỗ khác nhau. Không có một tài liệu nguồn thống nhất cho đúng bộ kết hợp 202 lá. Khi nguồn mâu thuẫn, phải dùng lựa chọn có mã Dxx, không âm thầm ghép luật.

Những ý tưởng trước đây **đã được thay thế**: đấu số riêng hai người, số tăng nghiêm ngặt/9 thắng ngay; đấu màu đối đáp tới hết màu; Khiên xóa mọi phạt; ×2/÷2 nhân/chia tổng phạt. Không triển khai các ý tưởng này trong v1.

## 2. Cấu hình bộ bài đã chốt

### 2.1. Phần nền: 144 lá

| key | Loại | Mỗi màu | Tổng |
| --- | --- | ---: | ---: |
| number-0 | Số 0 | 1 | 4 |
| number-1-9 | Mỗi số 1–9 có 3 bản | 27 | 108 |
| skip | Cấm lượt | 2 | 8 |
| reverse | Đảo chiều | 2 | 8 |
| draw-two | +2 | 2 | 8 |
| wild | Đổi màu | — | 4 |
| wild-draw-four | +4 | — | 4 |
| subtotal-base | Tổng phần nền | — | 144 |

### 2.2. Phần mở rộng: 58 lá

| STT | key dự kiến | Loại | Màu / phân bố | Tổng |
| --- | --- | --- | --- | ---: |
| 1 | wild-up | Tăng tiến | Đen | 4 |
| 2 | wild-battle | Hai kiếm | Đen | 4 |
| 3 | tornado | Lốc xoáy | 1 mỗi màu | 4 |
| 4 | high-five | Đập tay | 1 mỗi màu, mang số 5 | 4 |
| 5 | seven-change-left / seven-change-right | Chuyền bài | L: đỏ, vàng; R: xanh lá, xanh dương; mang số 7 | 4 |
| 6 | wild-target-four | Chỉ định +4 | Đen | 4 |
| 7 | wild-multiply-two | Nhân đôi tay bài | Đen | 2 |
| 8 | wild-divide-two | Bỏ nửa tay bài | Đen | 4 |
| 9 | wild-shield | Khiên | Đen | 6 |
| 10 | skip-two | Cấm hai người | 1 mỗi màu | 4 |
| 11 | discard-color | Xả màu cố định | 1 mỗi màu | 4 |
| 12 | wild-discard | Xả màu tự chọn | Đen | 2 |
| 13 | wild-random | Rút ngẫu nhiên +? | Đen | 4 |
| 14a | wild-draw-six | +6 | Đen | 2 |
| 14b | wild-draw-eight | +8 | Đen | 2 |
| 15 | wild-card-swap | Đổi tay bài | Đen | 4 |
| subtotal-expanded | — | Tổng phần mở rộng | — | 58 |

Số lượng là cấu hình MeepleVerse đã chọn, không khẳng định trùng toàn bộ một bản in ngoài thị trường. Dùng các số lượng tham khảo Storm/Infinity, nhưng không nhập nguyên tất cả lá của ba gói.

### 2.3. Bất biến bộ bài

- **112 lá số thuần + 32 chức năng nền + 58 mở rộng = 202 lá**.
- High Five/Seven Change mang giá trị số nhưng đã nằm trong 58; không đếm lại thành lá số thuần.
- Mỗi màu có 39 lá vật lý: 28 số thuần + 6 chức năng nền + 5 mở rộng. Tổng 156 lá có màu và 46 lá đen.
- Mỗi lá có ID duy nhất; không dùng màu/loại/số làm ID chung cho các bản sao.
- Sau mọi chuyển trạng thái, tổng ID trong các tay bài, chồng bốc và chồng bỏ vẫn đúng 202, không trùng ID. Lá chọn bí mật trong Battle chỉ được đánh dấu giữ chỗ, không tạo thêm bản sao vật lý.
- Lá đầu ván chỉ là số thuần 0–9; không mở bằng High Five/Seven Change dù chúng có giá trị số.

### 2.4. Cấu hình đã triển khai — bước 2

- Kiểu bài dùng chung: `@meepleverse/contracts/uno-expanded`, tách khỏi `UnoCard` của Cơ bản. `UnoExpandedCard` tái sử dụng bài cơ bản và bổ sung các biến thể mới; High Five bắt buộc giá trị 5, Seven Change bắt buộc 7 và ràng buộc đúng màu L/R.
- Cấu hình: `apps/meepleverse-api/src/modules/games/uno-expanded/domain/constants/deck-config.ts`. Mỗi mục là một mặt bài và số bản sao, được đóng băng để tránh sửa cấu hình ngoài ý muốn.
- Hàm tạo bộ bài: `createExpandedDeck()` qua module `apps/meepleverse-api/src/modules/games/uno-expanded/index.ts`. Trả một mảng mới gồm 202 lá **có thứ tự, chưa xào/chia**, không áp dụng luật lá bài.
- ID có tiền tố `uno-expanded:` và ổn định giữa các lần tạo cùng cấu hình. ID duy nhất **trong một bộ/ván**, không phải UUID toàn hệ thống; khi xử lý lệnh vẫn phải gắn matchId của ván.
- Các lần gọi không chia sẻ object lá bài. Thay đổi một bộ đã tạo không ảnh hưởng cấu hình, bộ khác hoặc bộ Cơ bản.
- Seven Change là một nhóm chức năng nhưng có hai kind `seven-change-left`/`seven-change-right`. Vì vậy 15 mục tương ứng 16 loại chức năng mới về nghiệp vụ, **17 kind mới trong code**; không lấy số kind làm số lá.
- Kiểm thử: `apps/meepleverse-api/tests/unit/uno-expanded/deck.test.ts`; chạy cùng `npx.cmd --yes pnpm@10.34.9 test` hoặc lọc file qua script test của API.
- Phạm vi bước này bao gồm dữ liệu bộ bài và kiểm tra số lượng (phần tương ứng E001/E002/E005). Chưa triển khai chia bài/mở đầu/lượt/hiệu ứng, nên chưa xem các ca còn lại trong tài liệu nghiệm thu là đã đạt.

## 3. Thiết lập và lượt thường

Đề xuất kế thừa nền dự án theo **D01**:

- 2–4 ghế, không có đội/bot/đấu xếp hạng; 7 lá/người; người chia ngẫu nhiên, ghế kế tiếp đi đầu theo chiều kim đồng hồ.
- Đánh một lá cùng màu, cùng số hoặc cùng biểu tượng; lá đen được đánh trong lượt thường. Không có thách thức +4.
- High Five có giá trị 5; Seven Change có giá trị 7, dùng để đối chiếu số với lá số thuần và với nhau khi phù hợp. Khi đánh trong lượt thường, chúng vẫn kích hoạt chức năng riêng.
- Được chủ động bốc một lá. Sau đó chỉ đánh lá vừa bốc hoặc bỏ lượt; không đánh được thì tự qua lượt.
- Skip bỏ một ghế; Reverse đổi chiều, với hai người trả lượt về người đánh. Không tự cho phép Reverse/Skip chặn chuỗi phạt.
- Kết quả một ván độc lập, chủ phòng mở ván tiếp theo; chưa có giải nhiều ván tới 500 điểm.

### 3.1. Chọn màu và chọn mục tiêu — D02

Đề xuất cho bản Mở rộng: lá đen chọn màu **khi đánh**, gửi cùng ý định đánh bài; Target/Battle/Card Swap chọn thêm đối thủ. Bấm hủy trước khi gửi thì không thay đổi ván.

Đây là điểm có chủ đích khác Cơ bản: Cơ bản hiện cho người đánh +4 cuối chọn màu sau khi người nhận bốc phạt. Bản Mở rộng đề xuất chọn màu ngay để thống nhất nhiều loại Wild; phải review D02 trước khi code, không sửa Cơ bản theo quyết định này.

Mục tiêu phải là một người khác đang thuộc ván; không được tự chọn mình. Server xác định danh tính người gửi, không tin playerId do client tự nhận.

## 4. Bảng tác dụng tham khảo của 15 mục

Mô tả ngắn ở đây lấy từ S1–S4; chi tiết ghép và trường hợp thiếu nằm ở các mục sau, không xem chúng là luật gốc đã được chứng minh.

| Mục | Tác dụng tham khảo |
| --- | --- |
| 1. Up — S1 | Chuỗi cả bàn; số bằng hoặc tăng. Người không theo được bốc theo số cao nhất vừa đánh. |
| 2. Battle — S2/S4 | Chọn đối thủ, so một lá; thắng bỏ thêm 2, thua bốc 2; có hòa. Nguồn khác nhau về điều kiện màu và chọn lá. |
| 3. Tornado — S1 | Người kế bốc tới màu của lá, rồi mất lượt. |
| 4. High Five — MeepleVerse | Mọi người cùng tham gia; đủ người bấm thì người cuối +2, hết giờ thì mỗi người chưa bấm +2. |
| 5. Seven Change — S1 | Chuyền tay bài L/R; hướng tương ứng ảnh hưởng chiều đi. |
| 6. Target +4 — S2 | Chọn người bốc 4; tiếp tục sau người bị chỉ định. |
| 7. ×2 — S3 | Chọn màu; người kế bốc thêm bằng số lá đang cầm. |
| 8. ÷2 — S3 | Chọn màu; bỏ nửa tay mình, làm tròn xuống, đặt dưới chồng bốc. |
| 9. Shield — S1 | Chuyển cộng dồn, không xóa; không chặn mọi chức năng. |
| 10. Skip Two — S2 | Bỏ hai lượt kế tiếp. |
| 11. Discard Color — S1 | Xả cùng màu; nguồn tự mâu thuẫn về yêu cầu phải có thêm lá để xả. |
| 12. Wild Discard — S3 | Chọn màu để xả. |
| 13. Random — S4/S5 | Một cách giải thích: lật một lá; ra số thì bốc thêm theo số; ra chức năng không bốc thêm theo số. S2 mô tả khác và chưa đủ rõ. |
| 14. +6/+8 | Mức rút cố định do phạm vi dự án chọn; cách ghép với chuỗi xem D03. |
| 15. Card Swap — S3 | Đổi toàn bộ tay bài với một đối thủ rồi chọn màu. Quy tắc lá cuối và nhận tay một lá theo mục 6.4. |

## 5. Chuỗi rút cố định — đề xuất D03

Đây là quy ước ghép bộ, không phải khẳng định cả ba bộ có cùng quy tắc cộng dồn.

- +2 mở chuỗi theo điều kiện đánh thường; +4/+6/+8/Target +4 mở chuỗi theo điều kiện lá đen.
- Lưu tổng phạt, người đang phải đáp, và loại lá vừa dùng để chuyển phạt. Trong chuỗi chỉ có +2/+4/+6/+8/Target +4/Shield được dùng, hoặc nhận toàn bộ phạt.
- Cho nối chéo các mức cộng bất kể màu; không bắt lá sau phải lớn hơn lá trước. **Ngoại lệ sau Shield: không nối +2 ngay lên Shield** theo giới hạn tham khảo S1.
- +2/+4/+6/+8 tăng tổng và chuyển trách nhiệm sang ghế kế người đánh theo chiều hiện hành.
- Target +4 tăng tổng thêm 4 và chuyển trách nhiệm sang đối thủ được chọn, không bắt buộc ghế liền kề. Không thay đổi thứ tự ghế.
- Shield giữ nguyên tổng phạt và chuyển sang ghế kế người dùng; chọn màu theo D02. Shield ở lượt thường chỉ đổi màu, không tự sinh phạt.
- Nhận phạt: bốc đúng tổng nếu đủ bài; nếu thiếu xử lý theo mục 12; kết thúc chuỗi và mất lượt, rồi tới ghế sau người nhận. Không dùng bài vừa nhận để nối lại.
- Màu sau chuỗi là màu mà lá cuối xác lập; D02 đã chọn màu trước khi nhận phạt nên không mở lại chọn màu.
- ×2/÷2, Up, Battle, Tornado, Random, Skip/Reverse/Skip Two và các lá xả/chuyền không dùng để đáp chuỗi.
- Khiên không né được phạt quên UNO, High Five, Battle, Up, Tornado, Random hoặc ×2. Không mở cơ chế phản ứng tùy ý ngoài lượt.
- Không đặt trần tổng phạt bằng 8; 8 chỉ là mức lớn nhất trên một lá cộng cố định.

Ví dụ, chiều hiện tại A→B→C→D:

1. A +2, B +6, C +8, D nhận: tổng 16; D mất lượt, tới A.
2. A +4, B Shield: C chịu 4; C không được nối +2 ngay lên Shield, nhưng được dùng lá hợp lệ khác hoặc nhận.
3. A +6, B Target +4 chọn D: D chịu 10; nếu nhận thì tới A, C không tự được bù một lượt.

## 6. Chức năng thay đổi bài và lượt — D04 đến D06

### 6.1. ×2 và ÷2

- ×2 chỉ dùng lượt thường/lá vừa bốc hợp lệ, không cộng dồn. Server chụp số bài người kế đang cầm tại lúc xử lý; rút thêm đúng số đó rồi bỏ lượt (**D04**).
- ÷2 tính trên tay bài **sau khi bỏ lá kích hoạt**: còn N lá thì chọn đúng floor(N/2) ID thuộc tay mình. Ví dụ sau khi bỏ ÷2 còn 7, bỏ 3 và giữ 4.
- Các ID chọn để bỏ phải khác nhau, không gồm lá kích hoạt, không thuộc người khác. Đặt xuống đáy chồng bốc, giữ bí mật mặt bài với đối thủ; không kích hoạt chức năng của các lá được bỏ.
- Lá ÷2 ở chồng bỏ, màu đã chọn được giữ. Không lấy các lá vừa đặt dưới chồng bốc thành lá trên bàn.
- Client hoàn tất lựa chọn trước khi gửi; server chỉ chấp nhận khi toàn bộ payload hợp lệ (**D05**). Không cho thực hiện nửa thao tác.

### 6.2. Xả màu cố định / tự chọn

- Đề xuất D05: xả **toàn bộ** các lá có đúng màu tương ứng sau khi bỏ lá kích hoạt; gồm số và chức năng có màu, không gồm lá đen.
- Không yêu cầu phải có lá phụ để xả. Các lá đi kèm không kích hoạt tác dụng, kể cả một lá xả khác.
- Đặt các lá phụ dưới lá kích hoạt trong chồng bỏ; giữ lá kích hoạt ở trên cùng. Màu sau hành động là màu được xả.
- Không cho chọn chỉ một phần màu; thứ tự phụ được server xác lập từ thứ tự tay bài, không để client đổi lá trên cùng.
- Việc giảm từ nhiều lá xuống một lá và về đích áp dụng mục 11.

### 6.3. Seven Change và Skip Two

- Theo D06, danh sách ghế có thứ tự cố định theo chiều kim đồng hồ; không suy hướng từ avatar đang nằm trái/phải màn hình của từng client.
- L: mỗi người chuyển bài sang ghế kế trong thứ tự đó; đặt chiều +1. R: chuyển về ghế trước; đặt chiều -1. Chuyền đồng thời sau khi lá kích hoạt rời tay.
- Sau chuyền, lượt tới ghế kế người kích hoạt theo chiều mới. Không chạy lại chức năng của các lá nhận được.
- Nhận một lá do chuyền không tự bị phạt quên UNO; trạng thái UNO đã chuẩn bị trước đó hết hiệu lực.
- Với hai người: chuyền L/R đều trao đổi hai tay bài; Skip Two chỉ cấm đối thủ và trả lượt cho người đánh. Với ba người: Skip Two trả lượt cho người đánh. Với bốn người: bỏ hai đối thủ kế, tới người thứ tư.

### 6.4. Card Swap — chốt 24/11/2026

- Bốn lá đen `wild-card-swap`; dùng trong lượt thường hoặc đánh chính lá vừa bốc, không đáp cộng dồn và không chen mini-game.
- Chọn một đối thủ và màu rồi Xác nhận nguyên khối. Bỏ Swap lên bàn, đổi hai tay còn lại và tiếp tục theo màu người đánh chọn; không đổi chiều. Lượt tới ghế kế của người đánh.
- Nhận tay một lá không bị phạt UNO. Không đánh giá một lá tạm thời giữa bước bỏ Swap và chuyển tay; không tự hô UNO.
- Swap cuối thắng ngay, không đổi tay; không bắt chọn mục tiêu trong trường hợp này. Màu vẫn là phần của lệnh Wild.
- Giữ bí mật bài nhận về, công khai người đổi và số lá. Xem [giao thức, UI và kiểm tra Card Swap](../development/uno-card-swap.md).

## 7. Wild Up — D07

- Kích hoạt ở lượt thường; chọn màu mở đầu. Chỉ người kế tiếp theo chiều đang có phải mở chuỗi, không chọn một đối thủ riêng.
- Đề xuất: lá mở chuỗi phải có giá trị số và đúng màu đã chọn; các lá sau có giá trị **bằng hoặc lớn hơn** số gần nhất, không ràng buộc màu.
- High Five tính là 5, Seven Change tính là 7; trong chuỗi chỉ dùng giá trị số, không phát sinh đập tay/chuyền bài. Các chức năng khác không được dùng làm số 0.
- Mỗi lần đáp bỏ đúng một lá và chuyển người kế; có thể chạy nhiều vòng, không kết thúc vì vừa đi đủ một vòng. 9 có thể đáp bằng 9.
- Nếu có lá hợp lệ thì phải đáp; server không chấp nhận nhận phạt thay để giấu lá hợp lệ. Không được bốc một lá thử vận may hoặc dùng Shield.
- Khi không có lá hợp lệ: tự bốc N, N là số gần nhất (không phải số lượt đã hô). Nếu chưa có ai mở chuỗi được thì đề xuất N=1; nếu số gần nhất là 0 thì N=0. Người chịu phạt mất lượt; kết thúc Up, người kế tiếp trở lại lượt thường.
- Lá đáp nằm trên chồng bỏ; màu sau Up là màu lá đáp cuối. Nếu không có lá đáp thì giữ Wild Up và màu mở đầu.
- Đánh hết bài trong một lần đáp hợp lệ thắng ván; hủy phần Up còn lại. UNO áp dụng trên mỗi hành động theo mục 11.

## 8. Wild Battle — D08

Các mô tả nguồn khác nhau. Đề xuất chọn biến thể **S4 có điều kiện màu và chọn bí mật**, thay vì diễn giải rút ngẫu nhiên từ chồng bốc. Không dùng cơ chế đấu màu liên tục đã bỏ.

### 8.1. Tóm tắt nhánh tham khảo S4

- Người kích hoạt chọn màu và đối thủ. Hai bên cần lá số cùng màu đó để so.
- Chỉ một bên có: bên đó xả lá so và thêm 2; bên kia bốc 2.
- Không bên nào có: người kích hoạt bốc 3, đối thủ bốc 2.
- Cả hai có: chọn bí mật một lá số, lật đồng thời; cao hơn xả thêm 2, thấp hơn bốc 2. Bằng nhau chỉ bỏ lá so, không có thưởng/phạt thêm.

### 8.2. Quy ước triển khai đề xuất

- D08 chọn số thuần cùng màu; High Five/Seven Change cũng được dùng theo giá trị 5/7, không chạy chức năng phụ. Không dùng lá đen/chức năng khác như số 0.
- Server kiểm tra đủ điều kiện, không tin khai báo "không có bài". Nếu không có thì tự ghi nhận, không buộc gửi ID giả.
- ID đã chọn được giữ trong tay với trạng thái giữ chỗ, không được dùng vào việc khác. Đối phương chỉ thấy đã khóa/chưa khóa, không thấy ID, số hay mặt lá trước khi cùng đủ điều kiện giải quyết.
- Mỗi bên có một lần khóa, không sửa sau khi gửi. Khi giải quyết, các lá so được đưa lên chồng bỏ trong một giao dịch; không lộ một lá trước để người kia đổi lựa chọn.
- Người thắng chọn thêm min(2, số bài còn lại) lá bất kỳ để bỏ; không tự kích hoạt chức năng của các lá đó. Lá thưởng bỏ được công khai khi vào chồng bỏ.
- Nếu có nhiều bước, giữ `effectId`, lựa chọn đã khóa và người phải chọn. Không cho người ngoài cuộc đánh bài hoặc bắt đầu hiệu ứng khác.
- Màu trò chơi giữ màu Battle đã chọn; lá Battle giữ trên cùng, các lá so/thưởng đặt bên dưới. Lượt thường tiếp theo là ghế sau người kích hoạt theo chiều hiện hành.
- Phân xử về đích/UNO xem mục 11. Không lấy việc còn 0 tạm thời ở giữa giao dịch làm chiến thắng sớm.

## 9. Tornado và Wild Random — D09, D10

### 9.1. Tornado

D09 đề xuất chỉ đánh được lên lá cùng màu hoặc lá Tornado khác; trường hợp trùng biểu tượng khác màu được xem như đối chiếu biểu tượng thông thường. Bốc đến **màu cố định của lá vừa đánh**, giữ cả lá khiến dừng và bỏ lượt. Lật từng lá thực sự bốc được theo thứ tự cho cả bàn xem, gồm cả lá đúng màu làm dừng; không công khai các lá chưa bốc trong kho.

Nguồn S1 chỉ nói màu tương ứng, còn S4 cho phép lá đổi màu giúp dừng. Đề xuất v1 lấy cách hẹp: **chỉ lá có đúng màu mới dừng**, lá đen không dừng; phải review D09, không coi đây là dữ kiện thống nhất của nguồn.

Các lá bốc trong hiệu ứng giữ bí mật như bốc thường; UI của người nhận hiện mặt bài, người khác chỉ thấy lưng và số lượng. Server xử lý hữu hạn theo mục 12, không chờ người dùng bấm rút từng lá.

### 9.2. Wild Random +?

D10 chọn cách giải thích S4/S5:

1. Người kế tiếp rút đúng một lá, **công khai** cho cả bàn.
2. Số thuần N: giữ lá vừa rút và bốc thêm N. Ra 0 thì không bốc thêm.
3. Chức năng: giữ lá vừa rút, không bốc thêm theo số. High Five/Seven Change ở đây đề xuất tính là chức năng, không lấy 5/7; xem D10.
4. Không tự chạy chức năng của lá lật. Người nhận mất lượt; ghế kế tiếp đi lượt thường. Phần mất lượt là lựa chọn ghép, vì S4 còn cho phép người nhận đánh tiếp.

Chỉ lá đầu công khai; các lá bốc thêm vẫn riêng tư. Không dùng Shield để bỏ Random, không dùng bài vừa bốc để mở chuỗi phạt. Không diễn giải "+?" thành một số ngẫu nhiên do client chọn hay "bốc đến khi gặp chức năng".

## 10. High Five trên web — D11

- Tất cả người chơi, **kể cả người đánh lá**, thuộc tập phản ứng cố định lúc tạo thử thách.
- Server thông báo chuẩn bị **1 giây**, sau đó nhận đập tay trong **5 giây**. Thời gian, thứ tự nhận và kết quả do server quyết định; không tin timestamp client.
- Mỗi người chỉ được xác nhận một lần cho cùng `effectId`; gửi trùng không thay thứ tự. Bấm trước lúc mở bị từ chối, không giữ hàng đợi.
- Nếu tất cả bấm: người có xác nhận cuối bốc 2. Nếu hết giờ còn người chưa bấm: **mỗi người chưa bấm đều bốc 2**, người đã bấm không bị phạt. Không ai bấm thì tất cả cùng bốc 2.
- Bàn hai người dùng cùng luật: người đánh cũng phải bấm, không phạt đối phương tự động ngay khi đánh.
- Sau phạt, lượt trở về ghế sau người kích hoạt, không chuyển lượt bất thường tới người chậm nhất. Không có phản ứng Shield.
- Đây là quy ước thích nghi trên web, không bảo đảm độ trễ mạng công bằng tuyệt đối; không giả định có thể biết thời điểm chạm thật của từng máy.
- Mất mạng thì đóng băng thử thách cùng ván; cách tiếp tục ở mục 13. Hết ván thì hủy mọi timer/click còn chờ.

## 11. UNO, thứ tự hiệu ứng và về đích — D12, D13

### 11.1. UNO

- Đề xuất kế thừa tự phạt: một hành động chủ động làm tay người đó từ ít nhất 2 xuống đúng 1 phải có khai báo UNO; quên thì bốc 2. Không có bắt lỗi từ đối thủ hoặc hô bù sau giao dịch.
- Áp dụng cho đánh một lá, xả màu, ÷2, chọn lá so Battle và bỏ lá thưởng Battle. Trường hợp xả từ 5 xuống 1 cũng cần UNO; UI phải báo trước theo kết quả lựa chọn, không chỉ nhìn điều kiện đang có 2 lá.
- Không phạt nếu xả từ nhiều lá xuống 0; không yêu cầu UNO khi còn một lá rồi đánh lá cuối.
- Nhận một lá do chuyền không cần hô. UNO đã chuẩn bị không đi theo tay bài được chuyển, không tồn tại qua revision mới.
- Phạt UNO tách khỏi cộng dồn và mini-game; không chuyển bằng Shield. Áp dụng sau kết quả chủ động của người đó, trước khi xác định hết bài.
- Battle bí mật chỉ xét UNO lúc các lá so thực sự được bỏ, không lộ số/ID qua việc khai báo sớm. Chọn lá thưởng là hành động riêng, kiểm tra UNO riêng.

### 11.2. Kết thúc

- Server chỉ kiểm tra thắng ở ranh giới giao dịch đã hoàn tất, không theo animation.
- Nếu một người đánh hết bài bằng số/Skip/Reverse/Skip Two/Wild/Up/High Five/Seven Change/Battle: đề xuất chốt thắng ngay sau nước hợp lệ, không mở thêm cuộc đấu/đập tay/chuyền bài. Không yêu cầu chọn mục tiêu cho một hiệu ứng đã bị bỏ vì hết bài; màu Wild vẫn là phần của lệnh đánh.
- Nếu lá cuối là +2/+4/+6/+8/Target +4, tính cả tổng phạt đang có, người nhận bắt buộc bốc rồi ván kết thúc; không nối/chặn tiếp. Target vẫn phải chọn người nhận.
- Shield là lá cuối: nếu đang có chuỗi, chuyển tổng cho ghế kế và bắt buộc bốc trước khi kết thúc; không biến Shield thành xóa phạt. Nếu không có chuỗi thì chỉ đổi màu và thắng.
- Nếu lá cuối là ×2/Tornado/Random: giải quyết lượt bốc bắt buộc hữu hạn rồi tính điểm, không mở phản ứng mới.
- Xả màu/÷2 có thể thắng nếu sau giao dịch còn 0; không kích hoạt lại các lá đi kèm.
- Battle đang diễn ra: giải quyết cùng lúc việc bỏ lá so, thưởng/phạt và phạt UNO tương ứng trước khi xác định hết bài. Không cho người thua tránh bốc phạt vì vừa dùng lá so cuối.
- Nếu nhiều người cùng hết ở một giao dịch Battle: ưu tiên người thắng cuộc Battle nếu người đó hết; nếu hòa và nhiều người cùng hết, kết quả là hòa `simultaneous-finish`, không tự chọn thắng theo thứ tự xử lý packet.
- Có kết quả thì hủy hiệu ứng, timer, lựa chọn giữ chỗ và khả năng nhận lệnh ván cũ; rematch có ID ván mới và trạng thái sạch.

## 12. Hết chồng bốc, bảo toàn bài và tính điểm — D14

- Hết chồng bốc: trộn lại chồng bỏ, giữ lá trên cùng. Không lấy bài trên tay, kể cả các ID đang giữ chỗ để so Battle.
- Phạt lượng cố định: bốc tối đa số còn có thể, ghi nhận số yêu cầu và số thực nhận, không tạo thêm lá hoặc để tổng phạt treo mãi.
- Tornado: dừng khi đúng màu, hoặc không còn ID nào có thể bốc; không xào lại chính các lá đã nhận. Nếu kho hữu hạn cạn, kết thúc hiệu ứng và mất lượt, không để vòng lặp vô hạn.
- Random không còn lá để lật: không có lá công khai, thực nhận 0 và chuyển lượt theo D10.
- Đề xuất kết thúc blocked khi cả một vòng lượt thường liên tiếp không có lá đánh được và không bốc được lá nào; không kết thúc blocked ngay vì một hiệu ứng bốc thiếu. Reset bộ đếm khi có hành động thay đổi bài/màu/lượt bằng chức năng.
- Điểm đề xuất: số thuần theo số; mọi chức năng có màu (kể cả High Five/Seven Change) 20; lá đen 50. Không lấy giá trị 5/7 dùng để đối đáp làm điểm chức năng.
- Người thắng nhận tổng điểm bài còn của các đối thủ sau các lượt bốc bắt buộc. Hòa/blocked không có điểm người thắng; vẫn hiển thị điểm còn lại của từng người.

## 13. Mất kết nối, lựa chọn và thời hạn — D15

- Giữ cơ chế phòng hiện có: mất kết nối giữ ghế tối đa 30 giây, tạm dừng toàn ván. Hết thời gian hoặc rời chủ động xử lý kết thúc ván do người rời như Cơ bản; không xóa ghế rồi tiếp tục bỏ qua hiệu ứng của người đó.
- Snapshot phục hồi match/revision, tay bài, lượt, màu/chiều, chuỗi phạt, `effectId`, người phải đáp và các lựa chọn đã khóa được phép xem. Không phát lại hiệu ứng cũ hoặc chạy lại lần bốc đã hoàn tất.
- Timer hiệu ứng lưu thời gian còn lại khi tạm dừng. Sau reconnect, High Five có lại 1,5 giây chuẩn bị cho những người chưa bấm; thứ tự các xác nhận hợp lệ trước đó giữ nguyên. Gói tin của một lần thử trước không được tính lại.
- Đề xuất thời hạn lựa chọn mới (Battle khóa lá / chọn thưởng) 30 giây. Hết hạn chọn lá hợp lệ đầu tiên theo thứ tự tay bài mà server giữ; chọn thưởng dùng đủ số lượng còn có thể bỏ. Không dùng thời gian của animation làm hạn nghiệp vụ.
- Không thêm timer cho lượt thường ở bước đặc tả này. Chọn màu/mục tiêu/xả/÷2 là phần chuẩn bị chưa gửi, chưa làm ván đổi phase; hủy UI không cần rollback server.
- Auto-action có event và revision riêng khi thực sự thay đổi game; không tự hô UNO thay người dùng. Thử thách có ID chống thao tác đến muộn, retry không lặp hình phạt.
- Chưa có phục hồi ván sau server crash, lưu MongoDB, nhiều tiến trình hoặc xử lý đồng bộ giữa nhiều máy chủ.

## 14. Trạng thái và quyền riêng tư dự kiến

Đây là thiết kế khái niệm, chưa phải types/API đã tồn tại. Backend giữ luật theo module; cơ chế chung tái sử dụng có kiểm thử bảo vệ Cơ bản.

| Trạng thái | Ai được hành động | Kết thúc khi |
| --- | --- | --- |
| turn | Người tới lượt | Đánh / bốc hợp lệ |
| drawn | Người vừa bốc | Đánh lá mới / bỏ lượt |
| draw-stack | Người đang chịu phạt | Nối / chuyển / nhận |
| up | Người phải đáp số hiện tại | Đáp / tự nhận phạt / hết bài |
| battle-select | Hai người được chọn | Đủ lựa chọn hoặc hết hạn |
| battle-discard | Người thắng Battle | Chọn đủ lá thưởng hoặc hết hạn |
| high-five | Những người phải phản ứng | Đủ xác nhận hoặc hết hạn |
| ended | Không ai đánh bài | Chủ phòng mở ván mới |

Các hiệu ứng bốc hữu hạn/xả/chuyền giải quyết nguyên tử trên server; client nhận snapshot/event để diễn hoạt. Không cần biến mỗi lá bốc thành một command nghiệp vụ.

- Người gửi phải có quyền ở đúng phase/effectId. Với Battle/High Five, không thể chỉ kiểm tra `currentTurn` như lượt thường vì có nhiều người được phản hồi.
- Giao thức vẫn cần requestId, matchId và revision. Lệnh đánh/nhận phạt/chọn thưởng cần expectedRevision hiện tại. Riêng khóa lá Battle và đập tay được xét bằng effectId, lần thử, phase và slot riêng của người gửi: không từ chối chỉ vì một người khác vừa phản hồi làm global revision tăng. Server vẫn tăng revision cho chuyển trạng thái được chấp nhận; UI không tự retry mù quáng ý định trên tay bài cũ.
- Phản hồi đồng thời không được bypass kiểm tra phase, quyền sở hữu, deadline hoặc dedup. Sau timeout/resolve/rematch, mọi effectId cũ vô hiệu; không chấp nhận phản hồi muộn bằng lý do cho phép revision cũ.
- Phân biệt thông tin công khai (mục tiêu, số bài, tổng phạt, deadline, màu, chiều, thứ tự phản ứng) với private (tay bài, thứ tự kho, ID bí mật Battle, các lá ÷2 đặt dưới kho).
- Công khai lá đầu Random, từng lá bốc bởi Tornado và các lá Battle sau lúc lật theo luật; không broadcast toàn bộ state domain để tiện làm hiệu ứng.
- Retry, reload, mất mạng không sinh thêm lần bốc, thưởng hoặc ghi nhận đập tay.

## 15. Điều kiện hoàn thành bước 1

- Có đủ 15 mục, bảng 202 lá và ranh giới giữa nguồn/luật đã chốt/đề xuất.
- Mỗi chức năng xác định điều kiện đánh, người xử lý, tác động bài, màu/chiều/lượt sau, quyền riêng tư và tình huống thiếu bài/về đích.
- Có bảng quyết định để review toàn bộ khoảng trống của bộ kết hợp, cùng ca nghiệm thu để bước sau không suy luật từ UI.
- **Hoàn thành tài liệu không đồng nghĩa D01–D15 đã được duyệt.** Các bước triển khai phải giữ trạng thái phát hành Mở rộng là đang phát triển cho đến khi có luật đã duyệt và kiểm thử tương ứng.

## Step 5 implementation status (2026-11-20)

Implemented internally: number/Skip/Reverse/Wild turns; +2/+4/+6/+8 and Target +4 stacking; Shield forwarding; Tornado; Wild Random; x2; automatic UNO penalty; draw/pass; result/score; atomic commands, authoritative private hints and reconnect-safe revisions.

Not implemented: Up, Battle, High Five, Seven Change, Skip Two, discard-color, wild-discard and divide-two. Such cards remain in the 198-card deck but cannot be played or suggested yet. This is an intermediate development milestone, not a complete playable Expanded release.

Confirmed step 5 conventions: Wild color chosen on play; +2 prohibited directly after Shield; x2 isolated with a skipped turn and no Shield response; Tornado stops only on an exact colored card; Random retains its public reveal, adds N private draws only for a pure number, and always skips the recipient. Unknown/future cards revealed by Random do not activate effects. No challenge +4. Basic rules stay unchanged.

Last fixed-draw/Shield card settles the existing debt before awarding a win; last Tornado/Random/x2 likewise resolves the mandatory draw before scoring. Short stock draws are finite and do not create cards. Only fully blocked normal turns can end with no winner. Multi-card discards and mini-game endings will be reviewed in their own stages.

## Step 6 implementation status (2026-11-20)

Implemented: divide-two, fixed-color discard, Wild Discard, Seven Change L/R and Skip Two. See [step 6 protocol and behavior](../development/uno-expanded-discard-turns.md). Up, Battle and High Five remain unavailable as activations. Such colored cards may still be discarded as side cards without activating their effects.

The step 5 status section above is a historical milestone. Batch operations are now atomic, validate all supplied IDs, and keep the activation on top. Divide-two returns a chosen floor(N/2) subset of the remaining hand to the bottom of stock in canonical hand order, with no public face/ID event. Color discard removes all matching colored cards; no matching side card is also valid. Transfers are simultaneous by fixed seats, set L=+1/R=-1, and never trigger effects of received cards.

UNO is required for any active discard from at least two cards to one, including a multi-card discard. Cards received through transfers do not require UNO. A player who actively discards from two to one via Seven Change must still declare; if omitted, the actor draws two after the transfer, preventing an innocent receiver from inheriting the penalty. A last Seven Change wins before passing an empty hand.

Skip Two skips two turn opportunities: for 2/3/4 players, the next actor is respectively the opponent/the activating player/the fourth seat along the current direction. Transfers match printed seven as well as color, including ordinary seven on Seven Change. All step 6 actions are forbidden as responses to a draw stack.

## Bước 7 — trạng thái triển khai (20/11/2026)

Wild Up, Wild Battle, High Five và đồng hồ mini-game đã được triển khai trong backend. Các mục trạng thái bước 5–6 ở trên là lịch sử của từng mốc; hiện mọi loại lá trong bộ 198 đều được hỗ trợ ở domain. Xem [luật, lệnh, timer và kiểm thử bước 7](../development/uno-expanded-minigames.md).

D07/D08/D11/D15 và phần D12/D13 liên quan mini-game được áp dụng theo kế hoạch bước 7 đã được yêu cầu triển khai; chi tiết xác nhận nằm trong bảng quyết định. Timer hiện tại: High Five chuẩn bị 1 giây + phản hồi 5 giây; Battle chọn số/thưởng mỗi giai đoạn 30 giây. Fallback không tự hô UNO. Giữ bí mật lựa chọn Battle tới khi giải quyết; reconnect bảo toàn lựa chọn/thứ tự và thời gian còn lại.

Catalog vẫn Đang phát triển, phòng Mở rộng ở production chưa bật; chưa có mặt bài, bộ điều khiển và animation Mở rộng. UNO Cơ bản giữ luật hiện tại.

## Bước 8 — mặt bài SVG (20/11/2026)

Đã có renderer cho đủ 22 kind trong contracts, gồm các lá nền và 14 nhóm mở rộng. Thư viện nội bộ có 60 mẫu để duyệt biểu tượng/màu, lọc kích thước và xem cùng tỷ lệ tay/bàn. Đây là số mẫu trình bày, không thay cấu hình 198 lá. Xem [nguồn ảnh, kiến trúc và cách mở thư viện](../development/uno-expanded-card-artwork.md).

Bước này chưa nối mặt bài với bàn Mở rộng hoặc thêm điều khiển mini-game/animation. Catalog vẫn Đang phát triển; các luật backend và Cơ bản giữ nguyên.

## Bước 9A — tích hợp thao tác nền (20/11/2026)

Đã nối sảnh, mặt bài, gợi ý server, bốc/bỏ lượt, cộng dồn/Khiên, màu/mục tiêu/÷2, UNO, kết quả và rematch. Xem [cách chạy và phạm vi](../development/uno-expanded-table.md). Up/Battle/High Five chưa có điều khiển nên UI tạm không cho chọn ba lá kích hoạt đó; backend giữ đầy đủ luật. Chưa mở chơi công khai hoặc nghiệm thu toàn bộ UI Mở rộng.

## Bước 9B — giao diện Up/Battle/High Five (21/11/2026)

Ba lá kích hoạt được mở lại trong UI. Có đáp Up theo gợi ý server, Battle chọn kín/khóa/lật/thưởng, High Five chuẩn bị/đập tay/thứ tự. UNO, timeout, phản hồi đồng thời và reconnect dùng trạng thái authoritative hiện có. Xem [phạm vi UI và kiểm thử](../development/uno-expanded-minigame-ui.md). Mục 9A phía trên là lịch sử; không còn khóa ba lá mini-game. Catalog tiếp tục Đang phát triển.


## Bước 9C — kích thước và animation (21/11/2026)

Dùng chung mốc kích thước với Cơ bản; thêm hàng đợi đánh/bốc riêng của Mở rộng, phản hồi chức năng và âm thanh. Giữ riêng tư mặt bài và phản hồi mini-game trực tiếp. Xem [phạm vi và kiểm thử 9C](../development/uno-expanded-animations.md).


### Cập nhật Đập tay theo phản hồi chơi thử

Nút ✋ luôn nằm cạnh UNO, chỉ cho bấm khi server mở cửa sổ phản ứng. Có đếm ngược, âm báo và trạng thái đã bấm. Phần số 5 dùng cùng cách căn chữ của bài số; nhóm bốn thẻ của +4 thường được thu nhỏ 10% ở cả hai phiên bản. Đây là luật MeepleVerse được chốt sau mốc 9B, thay thế quy định miễn người đánh/tự phạt đối phương ở bàn hai người.


## Bước 11 — hướng dẫn chơi (21/11/2026)

Có nút `?` và hướng dẫn đầy đủ theo luật đang chạy tại trang giới thiệu, sảnh và bàn nội bộ. Trang giới thiệu phân biệt 108/198 lá; popup có minh họa 14 nhóm, thao tác màu/mục tiêu/xả/÷2, UNO, mini-game và thời hạn. Mở hướng dẫn không tạm dừng ván. Xem [phạm vi và kiểm thử](../development/uno-expanded-rules-ui.md). Catalog vẫn Đang phát triển, chưa mở chơi công khai.


## Bước 12 — mở chơi thử (21/11/2026)

Danh mục chuyển Mở rộng sang Chơi thử/Chơi ngay, trang game có form tạo/vào phòng. API mặc định đăng ký cả hai loại phòng; frontend tạo Mở rộng không còn phụ thuộc development. Cơ bản giữ room type/luật riêng. Ảnh đại diện hai phiên bản dùng mặt bài SVG gameplay, gồm số/chức năng nền và số/chức năng mở rộng tương ứng. Xem [cấu hình và kiểm tra](../development/uno-expanded-beta.md). Các mô tả chỉ nội bộ ở các mục bước 4–11 là lịch sử trước mốc này.


## Đồng hồ lượt — 22/11/2026

Áp dụng 60 giây cho lượt thường/đáp cộng dồn; Tăng tiến 30 giây mỗi lần đáp; Battle 30 giây mỗi giai đoạn; Đập tay vẫn chuẩn bị 1 giây + phản ứng 5 giây. Hết giờ thường bỏ lượt, đã bốc thì giữ lá, cộng dồn tự nhận phạt; Up tự đánh hợp lệ nhưng không tự hô UNO. Bốc/mở popup không reset, tạm dừng phòng giữ thời gian còn lại. Mục cũ về chưa có timer lượt/Up được thay bằng [quy tắc đồng hồ hiện tại](../development/uno-turn-clock.md).


## Cập nhật Skip Two, UNO và Battle — 22/11/2026

Skip Two ở bàn hai người chỉ cấm đối thủ, trả lượt cho người đánh; bàn ba/bốn người giữ bỏ hai đối thủ kế. Quy tắc này thay phần D06 cũ cho bàn hai người. Xả màu cố định làm còn một lá mở popup xác nhận/UNO; xả tự chọn và ÷2 dùng cùng nhắc tại popup. Battle có UNO cạnh bước chọn lá so và chọn thưởng, mỗi bước chuẩn bị riêng. Kết quả đã giải quyết thu gọn sau 1,5 giây; không đóng bước chọn thưởng đang chờ. Random giữ nguyên: lá đầu lật công khai vẫn vào tay người nhận. Xem [rà soát UNO và kiểm thử](../development/uno-expanded-uno-review.md).

## Card Swap — bộ 202 lá, 24/11/2026

Phiên bản hiện tại `uno-expanded-v2`: 202 lá, 15 nhóm mở rộng (thêm 4 Card Swap), 156 lá mang màu và 46 lá đen. Các mục trạng thái triển khai 198 lá bên trên là lịch sử. Đã có luật server, popup đối thủ/màu, animation đổi tay úp và hướng dẫn mục 15. Tham khảo [phạm vi và kiểm tra](../development/uno-card-swap.md).


### Cập nhật hiển thị lượt bốc công khai

Random +? lật duy nhất lá đầu cho mọi người; các lá bổ sung bay úp, chỉ người nhận thấy khi vào tay. Tornado lật từng lá đã bốc theo thứ tự, kể cả Wild và lá đúng màu cuối cùng. Server gửi bản sao các lá thực nhận qua `TORNADO_REVEALED`; không gửi phần kho chưa bốc hoặc tay bài cũ. Giao diện chỉ dựng mặt lá hiện tại, giữ bài mới ngoài tay tới khi lá tới người nhận; chế độ giảm chuyển động vẫn giữ thông tin công khai tuần tự. Mỗi lá thường có 1,2 giây; chuỗi dài rút ngắn nhịp để phần lật không vượt 20 giây. Luật rút bài, mất lượt và tính điểm giữ nguyên.
