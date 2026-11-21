"use client";
import { useRoomAudio } from "@/shared/audio/AudioControls";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/layouts/SiteHeader";
import { useRoomSession } from "../application/useRoomSession";
import { RoomEntryForm } from "./RoomEntryForm";
import { LeaveDialog } from "./LeaveDialog";
import { RoomLobby } from "./RoomLobby";
import { ExpandedScreen } from "@/modules/games/uno-expanded/presentation/ExpandedScreen";
import { UnoScreen } from "@/modules/games/uno";
export function RoomScreen({ roomId }: { roomId: string }) {
  const router = useRouter(); const state = useRoomSession(roomId);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const view = state.view; const expanded = state.expandedView; const current = view ?? expanded;
  useRoomAudio(current?.roomId === roomId ? roomId : null);
  const connected = state.status === "connected"; const reconnecting = state.status === "reconnecting";
  async function leave() { await state.session.leave(); router.replace("/"); }
  if (!/^[A-Z0-9]{4}$/.test(roomId)) return <main className="shell empty-state"><h1>Mã phòng chưa đúng.</h1><p>Mã phòng gồm 4 chữ cái hoặc chữ số.</p><Link className="button primary" href="/">Về trang chủ</Link></main>;
  if (!current || current.roomId !== roomId) return <><header className="site-header shell"><Link href="/" aria-label="MeepleVerse — trang chủ"><Brand /></Link><span className="pill">Phòng {roomId}</span></header>
    <main className="shell invite-main"><div><span className="eyebrow">Một chỗ ngồi dành cho bạn</span><h1>Hội bạn<br /><span className="accent">đang chờ.</span></h1><p>Nhập tên để vào phòng UNO cùng mọi người.</p></div>
      {state.status === "connecting" || reconnecting ? <section className="entry-panel" role="status"><h2>Đang tìm lại chỗ ngồi…</h2><p>Đang kết nối với phòng {roomId}.</p></section> : <RoomEntryForm inviteCode={roomId} />}</main></>;
  const dialog = confirmLeave && <LeaveDialog playing={current.status === "PLAYING"} onCancel={() => setConfirmLeave(false)} onLeave={() => void leave()} />;
  const callbacks = { connected, reconnecting, pending: state.acting || state.starting, error: state.error,
    onLeave: () => setConfirmLeave(true), onReconnect: () => void state.session.restore(roomId) };
  if (current.status === "LOBBY") return <RoomLobby view={current} {...callbacks} onStart={() => void state.session.start()}>{dialog}</RoomLobby>;
  if (expanded) return <ExpandedScreen view={expanded} {...callbacks} feedback={state.expandedFrames} interactionEpoch={state.expandedInteractionEpoch} onCommand={command => void state.session.expandedCommand(command)} onRematch={() => void state.session.start()}>{dialog}</ExpandedScreen>;
  if (view) return <UnoScreen view={view} {...callbacks} frames={state.frames} events={state.events} onCommand={command => void state.session.command(command)} onRematch={() => void state.session.start()}>{dialog}</UnoScreen>;
  return null;
}
