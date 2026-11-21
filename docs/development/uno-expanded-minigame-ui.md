# UNO Mở rộng — giao diện mini-game (9B)

Ngày: 21/11/2026. Dùng luật/commands bước 7, mặt bài bước 8 và bàn 9A. Không sửa bộ bài 198, thời hạn hoặc cách phân thắng/phạt trên backend.

## Mở thử

Tại repo chạy `npm run dev:api` và `npm run dev:user` trong hai terminal, vào http://localhost:3000/dev/uno-expanded/play. Nếu API vẫn chạy entry cũ chỉ đăng ký Cơ bản, dừng API bằng Ctrl+C rồi chạy lại dev:api. Catalog vẫn Đang phát triển; route thử chỉ có ở development và production vẫn không đăng ký phòng Mở rộng.

Ba lá Wild Up, Wild Battle, High Five đã được mở lại để đánh từ tay bài; không còn giới hạn UI 9A.

## Giao diện và quyền hành động

| Thử thách | Trình bày / điều khiển |
| --- | --- |
| Up | Chọn màu khi kích hoạt; panel nêu màu mở hoặc số cần đáp >=. Tay bài lấy playableCardIds server gửi. Nút Đáp lá bài gửi UP_PLAY, không gửi PLAY_CARD; không kích hoạt phụ của số 5/7. Bốc thường bị khóa. UNO dùng nút chính. |
| Battle chọn | Chọn màu và đối thủ khi kích hoạt (lá cuối không cần đối thủ). Hai bên chọn một số hợp lệ từ eligibleCardIds riêng rồi khóa. Đối phương chỉ thấy trạng thái sẵn sàng, không có ID/mặt bài/khai báo UNO trước lúc lật. Người ngoài chỉ theo dõi. |
| Battle thưởng | Hiện các lá đã lật, người thắng và số lá bốc thực tế từ event công khai nếu phiên đã nhận được event đó. Người thắng chọn đúng rewardCount lá rồi xác nhận bỏ; kiểm tra UNO riêng khi còn một. Người còn lại chờ. |
| High Five | Hiển thị chuẩn bị, thời gian, hiệu lệnh và thứ tự server ghi nhận. Chỉ cho bấm khi stage=active, người gửi thuộc eligiblePlayerIds và chưa có trong responseOrder. Người kích hoạt được miễn. Lệnh gửi đúng effectId/attempt; không gửi timestamp máy người chơi. |

Các panel thay phần tâm bàn khi có thử thách; giữ chỗ ngồi và tay bài, có cuộn nội bộ trên mobile. Khóa điều khiển thường trong Battle/High Five; Up dùng tay bài và nút đáp riêng. Nút UNO chính dùng cùng trạng thái với lựa chọn Battle, không cần một nút UNO trùng trong panel.

Không tự hô UNO khi khóa/chọn thưởng; cũng không tự xác nhận lựa chọn lúc đồng hồ về 0. Server tự giải quyết timeout theo luật bước 7. Đồng hồ client chỉ để hiển thị; quyền bấm theo stage/snapshot server, tránh lấy giờ client làm kết quả.

## Đồng thời, reconnect và phản hồi

- Draft Battle gắn matchId/effectId/stage và interaction epoch, không gắn global revision. Người kia khóa bài không xóa lựa chọn chưa gửi của mình.
- Khi mất mạng hoặc bất kỳ người nào làm phòng pause, epoch tăng để bỏ draft/cờ UNO chưa gửi. Lựa chọn Battle đã khóa vẫn đến từ self.battle sau reconnect; giai đoạn thưởng và bài đã lật đến từ snapshot công khai.
- High Five dùng attempt mới sau reconnect; thứ tự trước đó giữ nguyên từ responseOrder. Không lạc quan đánh dấu đã phản hồi hoặc dùng giờ máy làm thứ tự.
- RoomSession đăng ký handler game_events theo room.name cố định từ SDK, giữ các sự kiện Cơ bản và Mở rộng riêng, không cast view/commands giữa hai game.
- Phản hồi Mở rộng chỉ nhận đúng match, revision chưa xử lý và không ở tương lai so với view. Cache tối đa 8 batch kết quả, chỉ giữ dữ liệu công khai. New match, pause, drop/restore xóa cache; snapshot đầu đánh dấu revision đã có để không phát lại kết quả cũ khi reload.
- Up/High Five có kết quả số lá thực bốc. Battle có lá lật công khai, người thắng, tổng bốc thật (gồm phạt UNO nếu cùng giao dịch). Không suy ra mặt bài bốc hoặc bài còn giữ của đối thủ.
- Kết quả hiện tối đa 3,5 giây hoặc đóng bằng Tiếp tục. Snapshot Battle đang thưởng vẫn hiển thị bài đã lật khi reload; các thông báo cũ không được phát lại. Sau reload, chỉ hiển thị số phạt có trong event mới nhận, không suy đoán lịch sử đã mất.

## Cấu trúc

`useExpandedTurn` xử lý kích hoạt và đáp Up. `useBattleChoice` xử lý lựa chọn riêng, giới hạn số lá và khai báo UNO. `CardChoiceGrid` dùng chung cho ÷2 và Battle; chỉ Battle chọn số cho phép đổi lá trực tiếp trước khi khóa.

`BattlePanel`, `HighFivePanel`, `UpPanel`, `EffectCountdown`, `MiniFeedback` nằm trong presentation/minigames. `model/mini-feedback.ts` chọn event công khai và tổng hợp số phạt. Không thêm thư viện, không đổi contracts hoặc logic luật server.

## Kiểm tra nhanh đã chạy

```powershell
npm run typecheck
npm run lint
$env:PLAYWRIGHT_CHANNEL = "msedge"
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e --grep 'expanded 9B|green skip matches.*1366'
```

7 ca mini-game và 1 hồi quy Cơ bản qua trong khoảng 1,6 phút: Up/5/7/phạt/không phát lại; Battle privacy/giữ draft/khôi phục thưởng; hai lựa chọn đồng thời và UNO bỏ quên; Battle hết giờ; High Five 4 browser; High Five reload giữ thứ tự; High Five hết giờ.

Sau bổ sung số phạt công khai Battle, chạy lại đúng ca Battle liên quan, hồi quy ÷2 có UNO và ca thông báo API cũ: 3/3 qua trong 36 giây. Tổng 10 ca khác nhau đã xác minh. TypeScript và lint toàn workspace đạt. Đã xem ảnh Battle trên mobile; test High Five kiểm tra không tràn ngang. Fixture timeout ngắn chỉ nằm trong test server, không đổi timing sản phẩm.

Không chạy ván chơi trọn bộ kéo dài hoặc toàn bộ backend ở bước UI này. Animation bay/bốc, âm thanh hành động và nghiệm thu trải nghiệm tổng thể vẫn thuộc 9C; chưa công bố sẵn sàng phát hành.
