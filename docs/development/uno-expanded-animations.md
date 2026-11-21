# UNO Mở rộng — kích thước và hiệu ứng bàn (9C)

Ngày: 21/11/2026. Giao diện nội bộ: `/dev/uno-expanded/play`.

- Hai phiên bản dùng chung `uno-sizing.css`: bài trên tay và trên bàn có cùng kích thước; chồng bốc, bài úp đối phương và nút UNO theo đúng các breakpoint của Cơ bản. Mốc laptop/desktop: bài 86 × 124 px, bài úp 64 × 92.16 px; mobile: bài 63 × 93 px, bài úp 40 × 57.6 px. Chiều cao thấp có các mốc riêng như Cơ bản.
- Sự kiện được chấp nhận đi cùng cặp snapshot trước/sau riêng của người xem. Đánh bài bay từ tay vào chồng bỏ, có vòng va chạm; bài mới chỉ nhập tay sau khi bay tới. Animation bốc giữ mặt bài khoảng 1.85 giây như Cơ bản. Người khác luôn chỉ thấy mặt sau.
- Cấm và đảo chiều có biểu tượng riêng, cùng màu lá đánh. Thông báo hành động và đến lượt kéo dài hai giây; phạt cộng không tạo thêm dòng báo bốc bài của đối thủ.
- Các lá mở rộng dùng đúng mặt bài bước 8 trong animation và tên chức năng trong thông báo. Hiệu ứng âm thanh dùng thiết lập âm lượng hiện có. Một đợt phạt chỉ hiển thị tối đa tám lá bay đồng thời; tổng số nhận vẫn giữ đúng, không đổi luật.
- Mini-game tiếp tục thao tác theo trạng thái server; animation không khóa nút đập tay hoặc chọn Battle. Phản hồi kết quả mini-game không lặp thêm dòng mô tả số bài bốc.
- Đổi kích thước, chuyển tab, mất kết nối hủy cảnh hiện tại. Kết nối lại, ván mới và phòng mới không phát lại các sự kiện cũ. Có hỗ trợ giảm chuyển động.

## Kiểm tra nhanh

```powershell
$env:PLAYWRIGHT_CHANNEL='msedge'
npx.cmd --yes pnpm@10.34.9 --filter meepleverse-user-web test:e2e --grep 'expanded 9C|four High Five clients|effects: number card flies'
```

Đo trực tiếp kích thước hai phiên bản ở 1366×650, 1366×768, 1920×1080, 820×1180, 390×844 và 844×390; kiểm tra đánh/bốc, phạt +2, tính riêng tư, reconnect không phát lại, cấm/đổi chiều và High Five bốn trình duyệt. Đây là kiểm thử phạm vi giao diện/animation; chưa thay thế nghiệm thu một ván Mở rộng đầy đủ bằng UI và nhóm người thật trên server triển khai.

Đối chiếu bổ sung: avatar và badge số bài đối thủ, badge số bài trên tay, hai nút thao tác gọn giữa bàn và tay bài đứng thẳng trong lượt gợi ý. Đo kích thước trực tiếp ở sáu viewport, có cả laptop cao 650 px để phát hiện quy tắc responsive khiến nút giãn toàn hàng.
