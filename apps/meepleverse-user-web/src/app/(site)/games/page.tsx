import { GameCatalog } from "@/modules/game-catalog";
export const metadata = { title: "Khám phá trò chơi | MeepleVerse" };
export default function GamesPage() {
  return <main className="verse-games-page shell"><span className="verse-eyebrow">KHÁM PHÁ MEEPLEVERSE</span><h1>Một hội bạn.<br /><span className="accent">Nhiều cuộc vui.</span></h1><p className="verse-page-intro">Dễ làm quen hay nhiều thử thách? Chọn phiên bản phù hợp rồi hẹn nhau vào bàn.</p><GameCatalog /></main>;
}
