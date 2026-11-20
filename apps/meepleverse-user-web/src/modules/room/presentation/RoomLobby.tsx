"use client";
import { useState, type ReactNode } from "react";
import type { RoomMemberView } from "@meepleverse/contracts/room-common";
import { RoomToolbar } from "@/layouts/RoomToolbar";
interface LobbyView {
  gameId: "uno-basic" | "uno-expanded"; roomId: string; selfPlayerId: string; hostId: string | null;
  paused: boolean; members: RoomMemberView[];
}
export function RoomLobby({ view, connected, reconnecting, pending, error, onStart, onLeave, onReconnect, children }: {
  view: LobbyView; connected: boolean; reconnecting: boolean; pending: boolean; error: string | null;
  onStart: () => void; onLeave: () => void; onReconnect: () => void; children?: ReactNode;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const host = view.hostId === view.selfPlayerId; const expanded = view.gameId === "uno-expanded";
  const canStart = host && connected && !pending && !view.paused && view.members.length >= 2;
  async function copyInvite() {
    try { await navigator.clipboard.writeText(window.location.origin + "/room/" + view.roomId); setCopyState("copied"); }
    catch { setCopyState("manual"); }
  }
  return <div className="room-shell" data-testid={expanded ? "expanded-lobby" : "basic-lobby"}>
    <RoomToolbar roomId={view.roomId} gameId={view.gameId} connected={connected} reconnecting={reconnecting} onLeave={onLeave} />
    <main className="shell lobby-main">
      <div className="lobby-heading"><div><span className="eyebrow">{expanded ? "UNO Mở rộng · Bàn thử nội bộ" : "Góc tụ họp của cả hội"}</span><h1>Đợi bạn, đủ vui.</h1><p>Mời thêm bạn vào bàn. Chủ phòng sẽ bắt đầu khi mọi người sẵn sàng.</p></div><div className="game-stamp"><span>UNO</span><small>{expanded ? "MỞ RỘNG" : "CƠ BẢN"} · 2–4 NGƯỜI</small></div></div>
      {view.paused && <div className="notice" role="status">Có người đang mất kết nối. Phòng giữ chỗ tối đa 30 giây; ván chơi tạm dừng trong lúc chờ.</div>}
      {error && <div className="error-message" role="alert">{error}</div>}
      {!connected && !reconnecting && <button className="button secondary" onClick={onReconnect}>Thử kết nối lại</button>}
      <div className="lobby-grid"><section className="seating-panel" aria-label="Danh sách người chơi">
        <div className="panel-heading"><h2>Người chơi</h2><span>{view.members.length}/4 ghế</span></div>
        <div className="seats">{Array.from({ length: 4 }, (_, index) => { const member = view.members[index]; return member ? <div className={`seat occupied seat-${index}`} key={member.playerId}>
          <span className="avatar">{Array.from(member.nickname)[0]!.toLocaleUpperCase("vi")}</span><div className="seat-name"><strong>{member.nickname}</strong><span>{member.playerId === view.selfPlayerId ? "Bạn" : member.connected ? "Đã vào phòng" : "Đang kết nối lại…"}</span></div>{member.playerId === view.hostId && <span className="host-tag">Chủ phòng</span>}
        </div> : <div className="seat empty-seat" key={index}><span className="avatar">+</span><div><strong>Chờ một người bạn</strong><span>Ghế {index + 1} còn trống</span></div></div>; })}</div>
        <div className="room-footnote"><span aria-hidden="true">✦</span> Một link mời là đủ để ngồi cùng bàn.</div>
      </section><aside className="invite-panel"><span className="eyebrow">Mời bạn vào hội</span><h2>Mã phòng của bạn</h2><div className="room-code" aria-label={`Mã phòng ${view.roomId}`}>{view.roomId}</div>
        <button className="button secondary full" onClick={() => void copyInvite()}>{copyState === "copied" ? "Đã sao chép link" : "Sao chép link mời"} <span aria-hidden="true">↗</span></button>
        <p className="form-note" role="status">{copyState === "copied" ? "Gửi link này cho bạn bè nhé." : expanded ? "Gửi link hoặc nhập mã ở bàn thử UNO Mở rộng." : "Bạn bè cũng có thể nhập mã này ở trang UNO Cơ bản."}</p>
        {copyState === "manual" && <label className="manual-copy">Hãy chọn link:<input readOnly aria-label="Link mời phòng" value={typeof window === "undefined" ? "" : window.location.origin + "/room/" + view.roomId} onFocus={event => event.target.select()} /></label>}
        <div className="start-section"><button className="button primary full" disabled={!canStart} onClick={onStart}>{pending ? "Đang bắt đầu…" : host ? "Bắt đầu ván" : "Chờ chủ phòng bắt đầu"}</button><p className="form-note">{!host ? "Bạn đã có chỗ. Chờ chủ phòng mở ván nhé." : view.members.length < 2 ? "Cần thêm ít nhất 1 người bạn để bắt đầu." : view.paused ? "Chờ mọi người kết nối lại." : "Đã đủ người. Bắt đầu bất cứ lúc nào!"}</p></div>
      </aside></div>
    </main>{children}
  </div>;
}
