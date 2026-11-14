import Link from "next/link";
export function SiteFooter() {
  return <footer className="site-footer shell verse-footer"><div><strong>MeepleVerse<span aria-hidden="true">✦</span></strong><p>Chơi cùng nhau, vui hơn.</p></div><nav aria-label="Liên kết cuối trang"><Link href="/games">Trò chơi</Link><Link href="/#how-to">Cách bắt đầu</Link></nav><span>Một chiếc bàn. Cả hội bạn.</span></footer>;
}
