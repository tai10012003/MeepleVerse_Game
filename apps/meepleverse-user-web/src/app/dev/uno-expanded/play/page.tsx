import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RoomEntryForm } from "@/modules/room/presentation/RoomEntryForm";
export const metadata: Metadata = { title: "Bàn thử UNO Mở rộng | MeepleVerse", robots: { index: false, follow: false } };
export default function ExpandedPlayPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <main className="shell invite-main"><div><Link className="brand" href="/">MeepleVerse</Link><span className="eyebrow">UNO Mở rộng · Bàn thử nội bộ</span><h1>Thêm lá mới.<br /><span className="accent">Thêm bất ngờ.</span></h1><p>Thử bàn chơi, cộng dồn và các lựa chọn đặc biệt cùng bạn bè. Ba mini-game đang chờ giao diện ở bước tiếp theo.</p><Link className="button secondary" href="/dev/uno-expanded/cards">Xem bộ bài ↗</Link></div><RoomEntryForm gameId="uno-expanded" /></main>;
}
