"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useRoomSession } from "../application/useRoomSession";
export function RoomEntryForm({ inviteCode }: { inviteCode?: string }) {
  const router = useRouter();
  const state = useRoomSession(inviteCode);
  const [mode, setMode] = useState<"create" | "join">(inviteCode ? "join" : "create");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState(inviteCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const busy = state.status === "connecting" || state.status === "reconnecting";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    if (!nickname.trim() || nickname.trim().length > 24) { setError("Nhập tên hiển thị từ 1 đến 24 ký tự nhé."); return; }
    if (mode === "join" && !/^[A-Z0-9]{4}$/.test(code)) { setError("Mã phòng gồm đúng 4 chữ cái hoặc chữ số."); return; }
    const roomId = mode === "create" ? await state.session.create(nickname.trim()) : await state.session.join(code, nickname.trim());
    if (roomId) router.push("/room/" + roomId);
  }
  const currentRoom = state.view ?? state.expandedView;
  if (currentRoom && state.status !== "idle") {
    return <section className="entry-panel" id="play" aria-label="Phòng hiện tại"><span className="eyebrow">Cuộc hẹn đang chờ</span><h2>Bạn đã có phòng.</h2>
      <p>Quay lại phòng <strong>{currentRoom.roomId}</strong> để tiếp tục cùng mọi người.</p>
      <Link className="button primary full" href={"/room/" + currentRoom.roomId}>Trở lại phòng <span aria-hidden="true">↗</span></Link>
    </section>;
  }
  return <section className="entry-panel" id="play" aria-label="Tạo hoặc vào phòng">
    <span className="eyebrow">{inviteCode ? "Bạn được mời vào phòng " + inviteCode : "Sẵn sàng tụ họp?"}</span>
    <h2>{inviteCode ? "Vào hội thôi." : "Bắt đầu cuộc vui."}</h2>
    {!inviteCode && <div className="mode-tabs" role="group" aria-label="Chọn cách vào chơi">
      <button type="button" aria-pressed={mode === "create"} disabled={busy} onClick={() => { setMode("create"); setError(null); }}>Tạo phòng</button>
      <button type="button" aria-pressed={mode === "join"} disabled={busy} onClick={() => { setMode("join"); setError(null); }}>Vào bằng mã</button>
    </div>}
    <form onSubmit={submit} aria-busy={busy}>
      <label htmlFor="nickname">Mọi người gọi bạn là gì?</label>
      <input id="nickname" name="nickname" autoComplete="nickname" maxLength={24} required placeholder="Tên của bạn" value={nickname} disabled={busy} onChange={event => setNickname(event.target.value)} />
      {mode === "join" && <><label htmlFor="room-code">Mã phòng</label><input id="room-code" name="roomCode" className="code-input" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={4} minLength={4} pattern="[A-Z0-9]{4}" required placeholder="A1B2" value={code} disabled={busy} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} /></>}
      {(error || state.error) && <p className="error-message" role="alert">{error ?? state.error}</p>}
      <button className="button primary full" type="submit" disabled={busy}>{busy ? "Đang kết nối…" : mode === "create" ? "Tạo phòng UNO" : "Vào phòng"} <span aria-hidden="true">↗</span></button>
      <p className="form-note">Không cần tài khoản. Chỉ cần một cái tên.</p>
    </form>
  </section>;
}
