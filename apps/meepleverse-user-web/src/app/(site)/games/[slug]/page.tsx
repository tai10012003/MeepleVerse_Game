import { ExpandedRulesButton } from "@/modules/games/uno-expanded/presentation/rules/ExpandedRulesButton";
import { UnoRulesButton } from "@/modules/games/uno/presentation/rules/UnoRulesButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findCatalogGame } from "@/modules/game-catalog";
import { gameStatusLabel, isGamePlayable } from "@/modules/game-catalog/model/games";
import { GameArtwork } from "@/modules/game-catalog/presentation/GameArtwork";
import { RoomEntryForm } from "@/modules/room/presentation/RoomEntryForm";

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = findCatalogGame(slug);
  if (!game) notFound();
  const available = isGamePlayable(game);
  const expanded = game.id === "uno-expanded";
  return <main className="verse-detail shell" data-game-id={game.id}>
    <Link className="verse-back-link" href="/games">← Tất cả trò chơi</Link>
    <div className="verse-detail-grid"><section className="verse-detail-copy" aria-labelledby="game-title">
      <span className={"game-status status-" + game.status}><i />{gameStatusLabel(game)}</span>
      <h1 id="game-title">{game.name}</h1><h2>{game.subtitle}</h2><p>{game.description}</p>
      <ul className="game-tags" aria-label="Đặc điểm trò chơi">{game.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
      {game.id === "uno-basic" ? <UnoRulesButton /> : game.id === "uno-expanded" ? <ExpandedRulesButton /> : null}
      <GameArtwork variant={game.artwork} />
    </section>
    {available ? <RoomEntryForm gameId={expanded ? "uno-expanded" : "uno-basic"} /> : <section className="expansion-preview"><h2>Đang phát triển</h2><p>Trò chơi đang được chuẩn bị. Hãy quay lại sau nhé.</p></section>}
    </div>
    {game.id === "uno-basic" && <section className="verse-basic-rules" aria-labelledby="basic-rules-title"><div><span className="eyebrow">TRƯỚC KHI VÀO BÀN</span><h2 id="basic-rules-title">Quen bộ bài.<br />Nhớ luật nhà.</h2></div><div><p>108 lá · 2–4 người · mỗi người 7 lá. Lá mở đầu luôn là lá số. Đánh cùng màu, số hoặc biểu tượng; hết bài trước là thắng.</p><ul><li>Cho phép cộng dồn +2 và +4 bất kỳ màu.</li><li>Nếu chuỗi kết thúc bằng +4, người đánh +4 cuối chọn màu sau khi đối phương nhận phạt.</li><li>Còn 2 lá: bấm UNO trước khi đánh xuống 1 lá. Quên hô sẽ tự bốc thêm 2 lá.</li></ul></div></section>}
    {expanded && <section className="verse-basic-rules" aria-labelledby="expanded-overview-title"><div><span className="eyebrow">UNO MỞ RỘNG</span><h2 id="expanded-overview-title">Khác Cơ bản ở đâu?</h2><Link className="verse-quiet-link" href="/games/uno-basic">Mới chơi? Chơi UNO Cơ bản ↗</Link></div><div><p>202 lá · 2–4 người · chia 7 lá. 112 lá số thuần, 32 lá chức năng nền và 58 lá mở rộng. Cùng cách đánh nền như Cơ bản, thêm 15 nhóm chức năng để xoay chuyển cuộc chơi.</p><ul><li>Cộng dồn +2/+4/+6/+8 và Chỉ định +4. Khiên chuyển phạt; ×2 nhân tay người kế, ÷2 giảm tay mình, không nhân/chia chuỗi.</li><li>Tăng tiến đáp số cả bàn, Battle chọn số bí mật, Đập tay phản ứng trong 5 giây. Thêm xả màu, chuyền tay và Lốc xoáy. Bốn lá Card Swap cho phép đổi tay bài với một đối thủ rồi chọn màu.</li><li>Chọn màu ngay khi đánh lá đen, hoàn tất mục tiêu/lựa chọn rồi Xác nhận. Hô UNO trước khi bỏ từ nhiều lá xuống một lá; nhận tay một lá do Card Swap/Chuyền bài không bị phạt.</li></ul><p>Mở hướng dẫn ? trước khi vào bàn để xem đầy đủ luật MeepleVerse. Bản Mở rộng đang mở bàn.</p></div></section>}
  </main>;
}
