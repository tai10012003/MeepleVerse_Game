import { SiteHeader } from "@/layouts/SiteHeader";
import { SiteFooter } from "@/layouts/SiteFooter";
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <><SiteHeader />{children}<SiteFooter /></>;
}
