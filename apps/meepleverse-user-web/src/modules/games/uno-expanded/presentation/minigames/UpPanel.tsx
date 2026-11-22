import type { UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import { colorNames } from "../../../uno-common";
export function UpPanel({ view }: { view: UnoExpandedRoomView }) {
  const effect = view.game!.effect; if (effect?.kind !== "up") return null;
  const name = view.members.find(member => member.playerId === view.game!.currentPlayerId)?.nickname ?? "Người chơi";
  return <section className="mini-panel up-panel" data-testid="up-panel" aria-label="Tăng tiến">
    <span className="eyebrow">Wild Up · Tăng tiến</span><h2>{effect.lastValue === null ? `Mở bằng số ${colorNames[effect.openingColor]}` : `Đáp số ≥ ${effect.lastValue}`}</h2>
    <strong className="up-value" aria-hidden="true">{effect.lastValue === null ? "↑" : `≥ ${effect.lastValue}`}</strong>
    <p>{view.game!.currentPlayerId === view.selfPlayerId ? "Chọn lá được gợi ý trên tay rồi đánh." : `Chờ ${name} đáp bài.`}</p><small>20 giây để đáp. Hết giờ tự chọn lá hợp lệ, không tự hô UNO. Chỉ dùng giá trị số của 5/7, không kích hoạt chức năng phụ.</small>
  </section>;
}
