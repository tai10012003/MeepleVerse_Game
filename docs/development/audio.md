# Âm thanh trên web người chơi

- Howler.js quản lý nhạc nền và hiệu ứng, chỉ phát sau tương tác người dùng.
- Nút loa trên header phòng chờ và bàn chơi mở cài đặt nhạc nền/hiệu ứng riêng.
- Mặc định nhạc 25%, hiệu ứng 65%; bật/tắt và mức âm lượng lưu trong `meepleverse.audio.v1` của localStorage. Không gửi lên API.
- Nhạc phát khi có phòng đang mở, tạm dừng khi ẩn tab hoặc rời phòng. Trở lại tab tiếp tục nhạc; không phát lại các hiệu ứng bỏ lỡ.
- `shared/audio/audio.ts` là bộ điều khiển dùng chung; React chỉ đăng ký trạng thái và vòng đời. Có thể dùng lại cho game khác.
- `uno-audio.ts` lên lịch tiếng theo frame action đã được server chấp nhận, dùng cùng nhịp với animation. Hủy lịch khi scene hủy; không phát lại snapshot ban đầu hoặc khi tải lại trang.
- Tiếng đặt bài ở lúc đáp xuống; Skip/Reverse/Wild/phạt/UNO có tiếng riêng; báo lượt chỉ cho người tới lượt; thắng/thua có nhạc hiệu ngắn.
- Tối đa 8 tiếng rút trong một đợt phạt; chế độ giảm chuyển động chỉ phát một tiếng rút. Không xếp hàng hiệu ứng chưa tải xong.
- Asset gốc sinh bằng Python tại `scripts/generate-audio.py`; thông tin nguồn ở `public/audio/README.md`. Thay file cùng tên để dùng bộ âm khác.

Kiểm tra: `pnpm --filter meepleverse-user-web test:e2e audio.spec.ts`.
Kiểm thử trình duyệt quan sát Web Audio thực: một nguồn nhạc hoạt động, tiếng đúng client, lưu âm lượng, ẩn/hiện tab, rời phòng và mobile. Cần nghe thử thủ công trên thiết bị thật để điều chỉnh cảm nhận nhạc và âm lượng.

## Nhạc party và thanh âm lượng

- Nhạc nền `board-party-v2.wav`: 16 ô nhịp ở 124 BPM, khoảng 31 giây; synth, bass và trống. Tên file mới tránh phát nhầm bản chill cũ từ cache.
- Master nhạc bằng mức RMS và soft limiter: RMS khoảng -11.9 dBFS, peak khoảng -1.2 dBFS; bản cũ RMS -23.7 dBFS. Thanh âm lượng vẫn ánh xạ tuyến tính 0–100%, không thay đổi các tùy chọn người dùng đã lưu.
- Thanh range bỏ padding/border của input dùng chung, vẽ track theo đúng phần trăm trên Chromium và Firefox. Có focus bàn phím, Home/End, phím mũi tên.

- Hiệu ứng cũng được master cùng mục tiêu RMS với nhạc nền, có soft limiter để giữ peak dưới 0 dBFS. URL hiệu ứng có phiên bản để tránh cache bản nhỏ tiếng.
- Khi hiệu ứng phát, nhạc giảm còn 42% mức đang chọn trong 35 ms; hết hiệu ứng cộng 120 ms nhạc trở lại mức người dùng chọn trong 200 ms. Các hiệu ứng nối tiếp/đồng thời kéo dài khoảng giảm nhạc đến tiếng cuối cùng; không sửa mức âm lượng đã lưu. Tắt hiệu ứng, rời phòng hoặc ẩn tab sẽ hủy việc giảm nhạc.
