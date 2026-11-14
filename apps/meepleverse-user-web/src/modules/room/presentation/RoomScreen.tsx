"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/layouts/SiteHeader";
import { useRoomSession } from "../application/useRoomSession";
import { RoomEntryForm } from "./RoomEntryForm";
import { LeaveDialog } from "./LeaveDialog";
import { UnoScreen } from "@/modules/games/uno";
export function RoomScreen({ roomId }: { roomId: string }) {
  const router = useRouter();
  const state = useRoomSession(roomId);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const view = state.view;
  const validCode = /^[A-Z0-9]{4}$/.test(roomId);
  const busy = state.status === "connecting" || state.status === "reconnecting";
  async function copyInvite() {
    try { await navigator.clipboard.writeText(window.location.origin + "/room/" + roomId); setCopyState("copied"); }
    catch { setCopyState("manual"); }
  }
  async function leave() { await state.session.leave(); router.replace("/"); }
  if (!validCode) return <main className="shell empty-state"><h1>Mã phòng chưa đúng.</h1><p>Mã phòng gồm 4 chữ cái hoặc chữ số.</p><Link className="button primary" href="/">Về trang chủ</Link></main>;
  if (!view || view.roomId !== roomId) {
    return <><header className="site-header shell"><Link href="/" aria-label="MeepleVerse — trang chủ"><Brand /></Link><span className="pill">Phòng {roomId}</span></header>
      <main className="shell invite-main"><div><span className="eyebrow">Một chỗ ngồi dành cho bạn</span><h1>Hội bạn<br /><span className="accent">đang chờ.</span></h1><p>Nhập tên để vào phòng UNO cùng mọi người.</p></div>
      {busy ? <section className="entry-panel" role="status"><h2>Đang tìm lại chỗ ngồi…</h2><p>Đang kết nối với phòng {roomId}.</p></section> : <RoomEntryForm inviteCode={roomId} />}
      </main></>;
  }
  const host = view.hostId === view.selfPlayerId;
  const canStart = host && view.members.length >= 2 && !view.paused && state.status === "connected" && !state.starting;
  const playing = view.status === "PLAYING";
  if (view.status !== "LOBBY") return <UnoScreen view={view} connected={state.status === "connected"} reconnecting={state.status === "reconnecting"}
    pending={state.acting || state.starting} error={state.error} frames={state.frames} events={state.events}
    onCommand={command => void state.session.command(command)}
    onRematch={() => void state.session.start()} onLeave={() => setConfirmLeave(true)} onReconnect={() => void state.session.restore(roomId)}>
    {confirmLeave && <LeaveDialog playing={playing} onCancel={() => setConfirmLeave(false)} onLeave={() => void leave()} />}
  </UnoScreen>;
  return <div className="room-shell">
    <header className="room-header shell"><Link href="/" aria-label="MeepleVerse — trang chủ"><Brand /></Link>
      <span className={"connection-pill " + (state.status === "connected" ? "is-online" : "")}><span className="status-dot" />{state.status === "connected" ? "Đã kết nối" : state.status === "reconnecting" ? "Đang kết nối lại…" : "Mất kết nối"}</span>
      <button className="text-button" onClick={() => setConfirmLeave(true)}>Rời phòng <span aria-hidden="true">↗</span></button>
    </header>
    <main className="shell lobby-main">
      <div className="lobby-heading"><div><span className="eyebrow">Góc tụ họp của cả hội</span><h1>Đợi bạn, đủ vui.</h1>
        <p>Mời thêm bạn vào bàn. Chủ phòng sẽ bắt đầu khi mọi người sẵn sàng.</p></div>
        <div className="game-stamp"><span>UNO</span><small>CƠ BẢN · 2–4 NGƯỜI</small></div>
      </div>
      {view.paused && <div className="notice" role="status">Có người đang mất kết nối. Phòng giữ chỗ tối đa 30 giây; ván chơi tạm dừng trong lúc chờ.</div>}
      {state.error && <div className="error-message" role="alert">{state.error}</div>}
      {state.status === "disconnected" && <button className="button secondary" onClick={() => void state.session.restore(roomId)}>Thử kết nối lại</button>}
      <div className="lobby-grid">
        <section className="seating-panel" aria-label="Danh sách người chơi">
          <div className="panel-heading"><h2>Người chơi</h2><span>{view.members.length}/4 ghế</span></div>
          <div className="seats">{Array.from({ length: 4 }, (_, index) => {
            const member = view.members[index];
            return member ? <div className={"seat occupied seat-" + index} key={member.playerId}>
              <span className="avatar">{Array.from(member.nickname)[0]!.toLocaleUpperCase("vi")}</span>
              <div className="seat-name"><strong>{member.nickname}</strong><span>{member.playerId === view.selfPlayerId ? "Bạn" : member.connected ? "Đã vào phòng" : "Đang kết nối lại…"}</span></div>
              {member.playerId === view.hostId && <span className="host-tag">Chủ phòng</span>}
            </div> : <div className="seat empty-seat" key={"empty-" + index}><span className="avatar">+</span><div><strong>Chờ một người bạn</strong><span>Ghế {index + 1} còn trống</span></div></div>;
          })}</div>
          <div className="room-footnote"><span aria-hidden="true">✦</span> Một link mời là đủ để ngồi cùng bàn.</div>
        </section>
        <aside className="invite-panel">
          <span className="eyebrow">Mời bạn vào hội</span><h2>Mã phòng của bạn</h2><div className="room-code" aria-label={"Mã phòng " + roomId}>{roomId}</div>
          <button className="button secondary full" onClick={copyInvite} disabled={view.status !== "LOBBY"}>{copyState === "copied" ? "Đã sao chép link" : "Sao chép link mời"} <span aria-hidden="true">↗</span></button>
          <p className="form-note" role="status">{view.status !== "LOBBY" ? "Phòng đã bắt đầu và không nhận người mới." : copyState === "copied" ? "Gửi link này cho bạn bè nhé." : "Bạn bè cũng có thể nhập mã này ở trang UNO Cơ bản."}</p>
          {copyState === "manual" && <label className="manual-copy">Trình duyệt chưa cho phép sao chép. Hãy chọn link:<input readOnly aria-label="Link mời phòng" value={typeof window === "undefined" ? "" : window.location.origin + "/room/" + roomId} onFocus={event => event.target.select()} /></label>}
          <div className="start-section">
            {playing ? <div className="started-banner" role="status"><span aria-hidden="true">✦</span><strong>Đã bắt đầu ván UNO</strong><p>Giữ phòng mở để tiếp tục cùng nhóm.</p></div> : <>
              <button className="button primary full" disabled={!canStart} onClick={() => void state.session.start()}>{state.starting ? "Đang bắt đầu…" : host ? "Bắt đầu ván" : "Chờ chủ phòng bắt đầu"}</button>
              <p className="form-note">{!host ? "Bạn đã có chỗ. Chờ chủ phòng mở ván nhé." : view.members.length < 2 ? "Cần thêm ít nhất 1 người bạn để bắt đầu." : view.paused ? "Chờ mọi người kết nối lại." : "Đã đủ người. Bắt đầu bất cứ lúc nào!"}</p>
            </>}
          </div>
        </aside>
      </div>
    </main>
    {confirmLeave && <LeaveDialog playing={playing} onCancel={() => setConfirmLeave(false)} onLeave={() => void leave()} />}
  </div>;
}
