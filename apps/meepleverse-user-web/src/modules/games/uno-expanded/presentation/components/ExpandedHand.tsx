import type { UnoExpandedView } from "@meepleverse/contracts/uno-expanded";
import { DrawDebt } from "../../../uno-common";
import { ExpandedCardFace, expandedCardName } from "../cards";
export function ExpandedHand({ game, enabled, selectedId, onSelect }: { game: UnoExpandedView; enabled: boolean; selectedId?: string; onSelect: (id: string) => void }) {
  return <section className="expanded-hand" aria-label="Tay bài của bạn"><div className="expanded-hand-status"><span data-testid="expanded-hand-count" aria-label={`${game.self.hand.length} lá trên tay`}>{game.self.hand.length} lá</span>{game.pendingDraw > 0 && game.currentPlayerId === game.self.playerId && <DrawDebt count={game.pendingDraw} playerId={game.self.playerId} />}</div>
    <div className="expanded-hand-scroll" tabIndex={0} aria-label="Cuộn ngang để xem tay bài"><div className="expanded-hand-list">{game.self.hand.map(card => {
      const playable = game.self.playableCardIds.includes(card.id);
      return <button type="button" key={card.id} className={`expanded-hand-card${selectedId === card.id ? " is-selected" : ""}${enabled ? playable ? " is-suggested" : " is-blocked" : ""}`}
        aria-label={expandedCardName(card)} aria-pressed={selectedId === card.id} data-card-id={card.id} data-card-kind={card.kind} data-playable={playable}
        title={expandedCardName(card)} disabled={!enabled || !playable} onClick={() => onSelect(card.id)}><ExpandedCardFace card={card} decorative /></button>;
    })}</div></div>
  </section>;
}
