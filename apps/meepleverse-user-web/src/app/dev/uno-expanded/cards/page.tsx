import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardGallery } from "@/modules/games/uno-expanded/presentation/preview/CardGallery";
export const metadata: Metadata = { title: "Xưởng bài UNO Mở rộng | MeepleVerse", robots: { index: false, follow: false } };
export default function ExpandedCardsPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <CardGallery />;
}
