export function GameArtwork({ variant }: { variant: "basic" | "expanded" }) {
  return <div className={"game-artwork artwork-" + variant} aria-hidden="true">
    <div className="artwork-orbit" /><div className="artwork-orbit orbit-offset" />
    <span className="artwork-star star-a">✦</span><span className="artwork-star star-b">✧</span>
    <span className="artwork-token token-a" /><span className="artwork-token token-b" />
    <div className="catalog-card card-back-one"><span>{variant === "basic" ? "7" : "+8"}</span><strong>{variant === "basic" ? "7" : "+8"}</strong></div>
    <div className="catalog-card card-back-two"><span>{variant === "basic" ? "2" : "÷2"}</span><strong>{variant === "basic" ? "2" : "÷2"}</strong></div>
    <div className="catalog-card card-front"><span>{variant === "basic" ? "+2" : "×2"}</span><strong>{variant === "basic" ? "+2" : "×2"}</strong></div>
    <span className="artwork-wordmark">{variant === "basic" ? "VÀO BÀN THÔI" : "THỬ THÁCH MỚI"}</span>
  </div>;
}
