import Link from "next/link";
import { notFound } from "next/navigation";
import { findCatalogGame } from "@/modules/game-catalog";
import { GameArtwork } from "@/modules/game-catalog/presentation/GameArtwork";
import { RoomEntryForm } from "@/modules/room/presentation/RoomEntryForm";

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = findCatalogGame(slug);
  if (!game) notFound();
  const available = game.status === "available";
  return <main className="verse-detail shell" data-game-id={game.id}>
    <Link className="verse-back-link" href="/games">← Tất cả trò chơi</Link>
    <div className="verse-detail-grid"><section className="verse-detail-copy" aria-labelledby="game-title">
      <span className={"game-status status-" + game.status}><i />{available ? "Đang mở bàn" : "Đang phát triển"}</span>
      <h1 id="game-title">{game.name}</h1><h2>{game.subtitle}</h2><p>{game.description}</p>
      <ul className="game-tags" aria-label="Đặc điểm trò chơi">{game.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
      <GameArtwork variant={game.artwork} />
    </section>
    {available ? <RoomEntryForm /> : <section className="expansion-preview" aria-labelledby="expansion-title">
      <span className="eyebrow">ĐIỂM ĐẾN TIẾP THEO</span><h2 id="expansion-title">Cuộc vui mới<br />đang được chuẩn bị.</h2><p>UNO Mở rộng chưa mở chơi. Phiên bản này sẽ phát triển từ nền tảng UNO Cơ bản, với bộ bài và luật riêng.</p>
      <h3>Dự kiến có gì?</h3><ul><li><strong>+8, ×2 và ÷2</strong><span>Những cách mới để xoay chuyển chuỗi bài phạt.</span></li><li><strong>Nhiều lá chức năng hơn</strong><span>Thêm lựa chọn tấn công, phòng thủ và tương tác.</span></li><li><strong>Thêm chiều sâu chiến thuật</strong><span>Dành cho nhóm đã quen UNO và muốn thử sức.</span></li></ul>
      <p className="expansion-note">Danh sách và luật chi tiết đang được xây dựng.</p><Link className="button primary full" href="/games/uno-basic">Chơi UNO Cơ bản <span aria-hidden="true">↗</span></Link>
    </section>}
    </div>
    {available && <section className="verse-basic-rules" aria-labelledby="basic-rules-title"><div><span className="eyebrow">TRƯỚC KHI VÀO BÀN</span><h2 id="basic-rules-title">Quen bộ bài.<br />Nhớ luật nhà.</h2></div><div><p>108 lá · 2–4 người · mỗi người 7 lá. Lá mở đầu luôn là lá số. Đánh cùng màu, số hoặc biểu tượng; hết bài trước là thắng.</p><ul><li>Cho phép cộng dồn +2 và +4 bất kỳ màu.</li><li>Nếu chuỗi kết thúc bằng +4, người đánh +4 cuối chọn màu sau khi đối phương nhận phạt.</li><li>Còn 2 lá: bấm UNO trước khi đánh xuống 1 lá. Quên hô sẽ tự bốc thêm 2 lá.</li></ul></div></section>}
  </main>;
}
