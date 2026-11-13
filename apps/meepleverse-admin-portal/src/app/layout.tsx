import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "MeepleVerse Admin", description: "MeepleVerse — nền tảng board game cùng bạn bè" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
