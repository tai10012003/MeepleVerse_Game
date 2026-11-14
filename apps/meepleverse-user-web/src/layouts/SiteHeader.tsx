import Link from "next/link";
export function Brand() {
  return <span className="brand"><svg width="30" height="32" viewBox="0 0 30 32" aria-hidden="true"><path d="M15 2a5 5 0 1 1 0 10c4 0 7 3 10 5l-3 5-4-2 3 10h-6l-1-7-1 7H7l3-10-4 2-3-5c3-2 6-5 10-5A5 5 0 0 1 15 2Z" fill="currentColor"/></svg><span>Meeple<span className="brand-accent">Verse</span></span></span>;
}
export function SiteHeader() {
  return <header className="site-header shell verse-header"><Link href="/" aria-label="MeepleVerse — trang chủ"><Brand /></Link><nav className="verse-nav" aria-label="Điều hướng chính"><Link href="/games">Khám phá game</Link><Link href="/#how-to">Cách bắt đầu</Link></nav><Link className="header-link verse-room-link" href="/games/uno-basic#play">Vào phòng <span aria-hidden="true">↗</span></Link></header>;
}
