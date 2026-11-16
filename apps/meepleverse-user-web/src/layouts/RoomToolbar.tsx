import { AudioControls } from "@/shared/audio/AudioControls";
import Link from "next/link";
import { Brand } from "./SiteHeader";
export function RoomToolbar({ connected, reconnecting, onLeave, roomId }: {
  connected: boolean; reconnecting: boolean; onLeave: () => void; roomId?: string;
}) {
  return <header className="room-header shell"><Link href="/" aria-label="MeepleVerse — trang chủ"><Brand /></Link>
    {roomId && <span className="toolbar-code">#{roomId}</span>}
    <span className={"connection-pill " + (connected ? "is-online" : "")}><span className="status-dot" /><span className="connection-label">{connected ? "Đã kết nối" : reconnecting ? "Đang kết nối lại…" : "Mất kết nối"}</span></span><AudioControls />
    <button className="text-button" onClick={onLeave}>Rời phòng <span aria-hidden="true">↗</span></button>
  </header>;
}
