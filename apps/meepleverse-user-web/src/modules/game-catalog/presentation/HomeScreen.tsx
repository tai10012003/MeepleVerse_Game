import Link from "next/link";
import { GameCatalog } from "./GameCatalog";
import { UniverseScene } from "./UniverseScene";

export function HomeScreen() {
  return <main className="verse-home shell">
    <section className="verse-hero" aria-labelledby="universe-title">
      <div className="verse-hero-copy">
        <span className="verse-eyebrow"><i /> VŨ TRỤ BOARD GAME CỦA HỘI BẠN</span>
        <h1 id="universe-title">Chọn một game.<br />Mở cả <span>vũ trụ vui.</span></h1>
        <p>Mỗi trò chơi là một cuộc phiêu lưu. Tìm chiếc bàn của bạn, rủ những gương mặt quen và để cuộc vui bắt đầu.</p>
        <div className="verse-hero-actions"><Link className="button primary" href="#games">Khám phá trò chơi <span aria-hidden="true">↗</span></Link><Link className="verse-quiet-link" href="/games/uno-basic#play">Có mã phòng? Vào đây <span aria-hidden="true">→</span></Link></div>
        <div className="verse-hero-notes"><span><i /> Chơi ngay trên trình duyệt</span><span><i /> Cùng bạn, dù ở đâu</span></div>
      </div>
      <UniverseScene />
    </section>
    <section className="verse-discover" id="games" aria-labelledby="discover-title">
      <div className="verse-section-heading"><div><span className="eyebrow">CHỌN ĐIỂM ĐẾN TIẾP THEO</span><h2 id="discover-title">Hôm nay, hội mình chơi gì?</h2></div><span className="catalog-note">Bắt đầu với UNO. Còn nhiều điều phía trước. <span aria-hidden="true">✦</span></span></div>
      <GameCatalog />
    </section>
    <section className="verse-how" id="how-to" aria-labelledby="how-title">
      <div><span className="eyebrow">TỪ MỘT LỜI RỦ</span><h2 id="how-title">Đến một bàn <br />đầy tiếng cười.</h2><p>Không cần tải ứng dụng. <br />Chọn game và hẹn nhau tại MeepleVerse.</p></div>
      <ol><li><span>01</span><div><h3>Chọn cuộc vui</h3><p>Tìm trò chơi phù hợp với cả nhóm, xem luật rồi vào bàn.</p></div></li><li><span>02</span><div><h3>Mở bàn, rủ bạn</h3><p>Nhập tên, tạo phòng và gửi link mời hoặc mã phòng.</p></div></li><li><span>03</span><div><h3>Đủ hội, bắt đầu</h3><p>Khi mọi người sẵn sàng, chủ phòng mở ván. Phần còn lại là cuộc vui.</p></div></li></ol>
    </section>
    <div className="verse-signoff"><span aria-hidden="true">✳</span><p>Một vũ trụ đang lớn lên.<br /><strong>Và luôn có chỗ cho hội bạn.</strong></p><Link href="/games">Khám phá danh mục <span aria-hidden="true">↗</span></Link></div>
  </main>;
}
