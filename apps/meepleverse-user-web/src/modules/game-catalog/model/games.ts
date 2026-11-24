export interface CatalogGame {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  status: "available" | "beta" | "development";
  artwork: "basic" | "expanded";
  tags: readonly string[];
}

export const catalogGames: readonly CatalogGame[] = [
  {
    id: "uno-basic", name: "UNO Cơ bản", subtitle: "Quen luật, vui cả hội.",
    description: "108 lá bài, những cú đổi chiều và màn cộng dồn đầy bất ngờ. Một khởi đầu dễ làm quen cho mọi cuộc hẹn.",
    status: "available", artwork: "basic", tags: ["2–4 người", "Dễ làm quen", "Chơi cùng bạn"],
  },
  {
    id: "uno-expanded", name: "UNO Mở rộng", subtitle: "Thêm thử thách, thêm bất ngờ.",
    description: "202 lá, 15 nhóm chức năng mới: cộng dồn tới +8, Khiên, đổi tay bài, xả màu và các mini-game. Dành cho hội đã quen UNO.",
    status: "available", artwork: "expanded", tags: ["2–4 người", "202 lá", "15 nhóm mới"],
  },
];

export function findCatalogGame(id: string) { return catalogGames.find(game => game.id === id); }

export function isGamePlayable(game: CatalogGame) { return game.status === "available" || game.status === "beta"; }
export function gameStatusLabel(game: CatalogGame) {
  return game.status === "beta" ? "Chơi thử" : game.status === "available" ? "Đang mở bàn" : "Đang phát triển";
}
