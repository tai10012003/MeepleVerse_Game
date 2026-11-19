"use client";
import type { UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
export function ExpandedRoomNotice({ view, connected, onLeave, onReconnect }: {
  view: UnoExpandedRoomView; connected: boolean; onLeave: () => void; onReconnect: () => void;
}) {
  return <main className="shell empty-state" data-testid="expanded-room-notice" data-game-id={view.gameId} data-phase={view.game?.phase ?? "lobby"}>
    <span className="eyebrow">UNO Mở rộng · Đang phát triển</span>
    <h1>Bàn chơi đang được chuẩn bị.</h1>
    <p>Phiên bản Mở rộng chưa sẵn sàng để chơi. Bạn có thể quay về và chơi UNO Cơ bản cùng bạn bè.</p>
    <p>Phòng {view.roomId} · {view.members.length}/4 người</p>
    {view.paused && <p role="status">Đang chờ người chơi kết nối lại.</p>}
    {!connected && <button className="button secondary" onClick={onReconnect}>Thử kết nối lại</button>}
    <button className="button primary" onClick={onLeave}>Rời phòng</button>
  </main>;
}
