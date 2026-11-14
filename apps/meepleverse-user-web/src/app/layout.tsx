import type { Metadata } from "next";
import "./globals.css";
import "@/modules/game-catalog/presentation/game-catalog.css";
export const metadata: Metadata = { title: "MeepleVerse", description: "MeepleVerse — nền tảng board game cùng bạn bè" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
