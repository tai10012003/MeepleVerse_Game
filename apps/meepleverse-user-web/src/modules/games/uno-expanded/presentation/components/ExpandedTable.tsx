import type { CSSProperties, ReactNode } from "react";
import type { UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import { CardBack, OpponentHand, DirectionRing, DrawDebt } from "../../../uno-common";
import { discardPlacement } from "../../../uno-common/model/discard-layout";
import { ExpandedCardFace, expandedCardName } from "../cards";
export function ExpandedTable({ view, active, onDraw, children }: { view: UnoExpandedRoomView; active: boolean; onDraw: () => void; children?: ReactNode }) {
  const game = view.game!; const selfIndex = game.players.findIndex(player => player.playerId === view.selfPlayerId);
  const opponents = [...game.players.slice(selfIndex + 1), ...game.players.slice(0, selfIndex)];
  return <section className="expanded-table" aria-label="Bàn UNO Mở rộng" data-opponents={opponents.length}>
    <div className="expanded-felt" aria-hidden="true" />
    <div className="expanded-opponents">{opponents.map(opponent => {
      const member = view.members.find(member => member.playerId === opponent.playerId)!;
      return <div className={`expanded-opponent${opponent.playerId === game.currentPlayerId ? " is-current" : ""}`} key={opponent.playerId} data-player-id={opponent.playerId}>
        <div className="expanded-identity"><span>{Array.from(member.nickname)[0]?.toLocaleUpperCase("vi")}</span><strong>{member.nickname}</strong><small>{opponent.handCount} lá</small>{!member.connected && <small>Mất mạng</small>}</div>
        <div className="expanded-opponent-cards"><OpponentHand count={opponent.handCount} />{game.pendingDraw > 0 && game.currentPlayerId === opponent.playerId && <DrawDebt count={game.pendingDraw} playerId={opponent.playerId} />}</div>
      </div>;
    })}</div>
    <div className="expanded-draw"><button type="button" aria-label={game.phase === "draw-stack" ? `Bốc chồng bài phạt ${game.pendingDraw} lá` : "Bốc một lá"} disabled={!active || game.phase === "drawn"} onClick={onDraw}><CardBack /></button><small>{game.drawPileCount} lá bốc</small></div>
    <div className="expanded-center"><DirectionRing color={game.activeColor} direction={game.direction} /><div className="expanded-discard" aria-label={`Lá trên bàn: ${expandedCardName(game.topCard)}`}>
      {game.discardCards.map((card, index) => { const placement = discardPlacement(card.id); return <div key={card.id} data-discard-card-id={card.id} style={{ transform: `translate(${placement.x / 3}%,${placement.y}%) rotate(${placement.angle}deg)`, zIndex: index } as CSSProperties}><ExpandedCardFace card={card} decorative /></div>; })}
    </div></div><div className="expanded-minigame-slot">{children}</div>
  </section>;
}
