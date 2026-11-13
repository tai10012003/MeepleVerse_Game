const messages: Record<string, string> = {
  INVALID_JOIN: "Tên hiển thị cần có từ 1 đến 24 ký tự.",
  ROOM_FULL: "Phòng đã đủ 4 người. Bạn hãy tạo phòng khác nhé.",
  ROOM_NOT_JOINABLE: "Phòng đã bắt đầu ván và không nhận người mới.",
  HOST_ONLY: "Chỉ chủ phòng có thể bắt đầu ván.",
  NOT_ENOUGH_PLAYERS: "Cần ít nhất 2 người để bắt đầu.",
  ROOM_PAUSED: "Đang chờ người chơi kết nối lại.",
  STALE_REVISION: "Phòng vừa thay đổi. Kiểm tra danh sách rồi thử lại nhé.",
  STALE_MATCH: "Ván chơi đã thay đổi. Đã cập nhật trạng thái mới.",
};
export function roomError(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  for (const [code, message] of Object.entries(messages)) if (text.includes(code)) return message;
  if (/not found|not defined|invalid room|not available|locked|522|404/i.test(text)) return "Không tìm thấy phòng, phòng đã đầy hoặc ván đã bắt đầu. Kiểm tra lại mã phòng nhé.";
  return "Chưa kết nối được phòng. Hãy kiểm tra mạng và thử lại.";
}
