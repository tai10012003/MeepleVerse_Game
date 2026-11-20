import { UNO_COLORS } from "@meepleverse/contracts/uno-common";
import type { UnoExpandedCardFace } from "@meepleverse/contracts/uno-expanded";
export interface CardGalleryGroup {
  key: string; name: string; edition: "base" | "expanded"; reference: "Cơ bản" | "Storm" | "Battle" | "Infinity" | "MeepleVerse";
  note: string; faces: UnoExpandedCardFace[];
}
// Visual specimens, not a second deck configuration. Multiplicities stay on the server.
export const cardGallery: CardGalleryGroup[] = [
  { key: "numbers", name: "Lá số", edition: "base", reference: "Cơ bản", note: "Bốn màu quen thuộc. Số 6 và 9 có gạch trắng để phân biệt.", faces: UNO_COLORS.flatMap(color => [0, 1, 6, 9].map(value => ({ kind: "number" as const, color, value }))) },
  { key: "skip", name: "Cấm lượt", edition: "base", reference: "Cơ bản", note: "Giữ nguyên hình học của bộ Cơ bản.", faces: UNO_COLORS.map(color => ({ kind: "skip", color })) },
  { key: "reverse", name: "Đổi chiều", edition: "base", reference: "Cơ bản", note: "Hai mũi tên đối chiều với đuôi lồng vào nhau.", faces: UNO_COLORS.map(color => ({ kind: "reverse", color })) },
  { key: "draw-two", name: "Rút hai", edition: "base", reference: "Cơ bản", note: "Hai thẻ xếp chồng, ký hiệu +2 ở hai góc.", faces: UNO_COLORS.map(color => ({ kind: "draw-two", color })) },
  { key: "wilds", name: "Đổi màu và +4", edition: "base", reference: "Cơ bản", note: "Nền đen và bốn màu nhận diện.", faces: [{ kind: "wild", color: null }, { kind: "wild-draw-four", color: null }] },
  { key: "up", name: "Tăng tiến", edition: "expanded", reference: "Storm", note: "Bốn mũi tên màu xếp tăng dần; hai dấu hướng lên ở góc.", faces: [{ kind: "wild-up", color: null }] },
  { key: "battle", name: "Hai kiếm · Battle", edition: "expanded", reference: "Battle", note: "Elip bốn màu ở giữa; hai kiếm chéo ở góc, đúng ảnh tham khảo.", faces: [{ kind: "wild-battle", color: null }] },
  { key: "tornado", name: "Lốc xoáy", edition: "expanded", reference: "Storm", note: "Xoáy cùng màu với lá kích hoạt.", faces: UNO_COLORS.map(color => ({ kind: "tornado", color })) },
  { key: "high-five", name: "Đập tay", edition: "expanded", reference: "Battle", note: "Số 5 ở giữa và bàn tay nhỏ dưới số ở góc.", faces: UNO_COLORS.map(color => ({ kind: "high-five", color, value: 5 })) },
  { key: "seven", name: "Chuyền bài · 7 L / R", edition: "expanded", reference: "Storm", note: "L: đỏ/vàng. R: xanh lá/xanh dương. Vòng mũi tên đổi hướng theo từng loại.", faces: [
    { kind: "seven-change-left", color: "red", value: 7 }, { kind: "seven-change-left", color: "yellow", value: 7 },
    { kind: "seven-change-right", color: "green", value: 7 }, { kind: "seven-change-right", color: "blue", value: 7 }] },
  { key: "target", name: "+4 chỉ định", edition: "expanded", reference: "Battle", note: "Tâm ngắm bốn màu và +4, khác rõ với lá +4 thường.", faces: [{ kind: "wild-target-four", color: null }] },
  { key: "multiply", name: "Nhân hai", edition: "expanded", reference: "Infinity", note: "Hai nhóm thẻ màu và ×2 ở góc.", faces: [{ kind: "wild-multiply-two", color: null }] },
  { key: "divide", name: "Chia hai", edition: "expanded", reference: "Infinity", note: "Nhóm bài được phân đôi, góc mang ký hiệu ÷2.", faces: [{ kind: "wild-divide-two", color: null }] },
  { key: "shield", name: "Khiên", edition: "expanded", reference: "Storm", note: "Khiên chia bốn màu, lặp lại ở góc.", faces: [{ kind: "wild-shield", color: null }] },
  { key: "skip-two", name: "Cấm hai người", edition: "expanded", reference: "Battle", note: "Biểu tượng cấm và ×2 ở góc để phân biệt với Cấm lượt.", faces: UNO_COLORS.map(color => ({ kind: "skip-two", color })) },
  { key: "discard", name: "Xả màu cố định", edition: "expanded", reference: "Storm", note: "Chồng bài cùng màu với dấu × trắng.", faces: UNO_COLORS.map(color => ({ kind: "discard-color", color })) },
  { key: "wild-discard", name: "Xả màu tự chọn", edition: "expanded", reference: "Infinity", note: "Chồng bài có dấu × trên nền elip bốn màu.", faces: [{ kind: "wild-discard", color: null }] },
  { key: "random", name: "Rút ngẫu nhiên", edition: "expanded", reference: "Battle", note: "Elip bốn màu và +? ở hai góc.", faces: [{ kind: "wild-random", color: null }] },
  { key: "draw-more", name: "Rút sáu / rút tám", edition: "expanded", reference: "MeepleVerse", note: "Phát triển từ cách thể hiện của +4; +6/+8 rõ ở hai góc bài.", faces: [{ kind: "wild-draw-six", color: null }, { kind: "wild-draw-eight", color: null }] },
];
