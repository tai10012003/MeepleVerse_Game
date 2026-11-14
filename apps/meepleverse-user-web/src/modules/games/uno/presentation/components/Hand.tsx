import { useEffect, useRef } from "react";
import type { UnoView } from "@meepleverse/contracts/uno";
import { isPlayable } from "../../model/uno-view-state";
import { Card } from "./Card";
export function Hand({ game, selectedId, enabled, onSelect, newCardIds }: {
  newCardIds: string[]; game: UnoView; selectedId: string | null; enabled: boolean; onSelect: (id: string) => void;
}) {
  const handRef = useRef<HTMLDivElement>(null);
  const suggesting = enabled && (game.phase === "turn" || game.phase === "drawn" || game.phase === "draw-stack");
  const newest = newCardIds.filter(id => game.self.hand.some(card => card.id === id)).at(-1) ?? (suggesting ? game.self.hand.find(card => isPlayable(card, game))?.id : undefined);
  useEffect(() => {
    const card = Array.from(handRef.current?.querySelectorAll<HTMLElement>("[data-card-id]") ?? []).find(element => element.dataset.cardId === newest);
    card?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }, [newest]);
  return <section data-suggesting={suggesting ? "true" : "false"} className="uno-hand" aria-label="Tay bài của bạn">
    <span className="hand-count" data-testid="my-hand-count" aria-label={game.self.hand.length + " lá trên tay"}>{game.self.hand.length}<span className="sr-only"> lá</span></span>
    <div ref={handRef} className="hand-scroll" tabIndex={0} aria-label="Cuộn ngang để xem tay bài">
      <div className="hand-list">{game.self.hand.map((card, index) => <Card key={card.id} card={card} index={index} count={game.self.hand.length}
        suggested={suggesting && isPlayable(card, game)} blocked={suggesting && !isPlayable(card, game)} isNew={newCardIds.includes(card.id)} selected={selectedId === card.id} disabled={!enabled || !isPlayable(card, game)} onSelect={() => onSelect(card.id)} />)}</div>
    </div>
  </section>;
}
