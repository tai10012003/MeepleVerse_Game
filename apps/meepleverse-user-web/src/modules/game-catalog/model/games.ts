export interface CatalogGame {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  status: "available" | "development";
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
    description: "Một phiên bản dành cho hội đã quen tay, với nhiều lá chức năng và những cách xoay chuyển cuộc chơi mới.",
    status: "development", artwork: "expanded", tags: ["Luật mở rộng", "Nhiều chiến thuật"],
  },
];

export function findCatalogGame(id: string) { return catalogGames.find(game => game.id === id); }
