"use client";
import { useState, type ReactNode, type CSSProperties } from "react";
import type { UnoCard, UnoCommand } from "@meepleverse/contracts/uno";
import type { RoomGameEvents, UnoRoomView } from "@meepleverse/contracts/room";
import { RoomToolbar } from "@/layouts/RoomToolbar";
import { cardName, isPlayable } from "../model/uno-view-state";
import { discardPlacement } from "../model/discard-layout";
import { CardFace } from "./components/Card";
import { CardBack } from "./components/CardBack";
import { DrawDebt } from "./components/DrawDebt";
import { OpponentHand } from "./components/OpponentHand";
import { DirectionRing } from "./components/DirectionRing";
import { Hand } from "./components/Hand";
import { ColorPicker } from "./components/ColorPicker";
import { Results } from "./components/Results";
import { UnoEffects } from "./animations/UnoEffects";
import { planEffects, type UnoVisualFrame, type UnoPresentation } from "../model/uno-effects";
import "./uno.css";
import "./table-seating.css";

interface Props {
  view: UnoRoomView; connected: boolean; reconnecting: boolean; pending: boolean; error: string | null;
  frames: UnoVisualFrame[]; events: RoomGameEvents | null; onCommand: (command: UnoCommand) => void; onRematch: () => void;
  onLeave: () => void; onReconnect: () => void; children?: ReactNode;
}
export function UnoScreen(props: Props) {
  const { view, connected, reconnecting, pending, onCommand } = props;
  const game = view.game;
  const [selection, setSelection] = useState<{ id: string; revision: number; matchId: string } | null>(null);
  const [picker, setPicker] = useState<{ cardId: string; revision: number; matchId: string } | null>(null);
  const [unoArmed, setUnoArmed] = useState<{ matchId: string; revision: number } | null>(null);
  const declareUno = !!game && unoArmed?.matchId === view.matchId && unoArmed.revision === game.revision;
  const [completedFrameId, setCompletedFrameId] = useState<string | null>(() => props.frames.at(-1)?.id ?? null);
  const [presentation, setPresentation] = useState<UnoPresentation | null>(null);
  const newestFrame = props.frames.at(-1);
  const animating = !!game && !!newestFrame && newestFrame.matchId === view.matchId && newestFrame.id !== completedFrameId;
  const visualFrame = animating ? (presentation?.frame.matchId === view.matchId && !presentation.frame.id.startsWith("intro:") ? presentation.frame : newestFrame) : undefined;
  const pileGame = visualFrame
    ? (presentation?.frame.id === visualFrame.id && presentation.landed ? visualFrame.after.game : visualFrame.before.game) ?? game
    : game;
  const displaySource = visualFrame?.after.game ?? game;
  const drawing = visualFrame?.events.filter(event => event.type === "CARDS_DRAWN") ?? [];
  const remaining = (id: string) => drawing.filter(event => event.playerId === id).reduce((sum, event) => sum + event.count, 0) - (presentation?.frame.id === visualFrame?.id ? presentation?.arrived[id] ?? 0 : 0);
  const oldHand = new Set(visualFrame?.before.game?.self.hand.map(card => card.id));
  const arrivingHand = displaySource?.self.hand.filter(card => !oldHand.has(card.id)) ?? [];
  const hiddenIds = new Set(remaining(view.selfPlayerId) > 0 ? arrivingHand.slice(-remaining(view.selfPlayerId)).map(card => card.id) : []);
  const displayGame = displaySource ? { ...displaySource,
    self: { ...displaySource.self, hand: displaySource.self.hand.filter(card => !hiddenIds.has(card.id)) },
    players: displaySource.players.map(player => ({ ...player, handCount: player.handCount - Math.max(0, remaining(player.playerId)) })),
    drawPileCount: displaySource.drawPileCount + displaySource.players.reduce((sum, player) => sum + Math.max(0, remaining(player.playerId)), 0),
  } : game;
  const drawnIds = newestFrame?.matchId === view.matchId && newestFrame.events.some(event => event.type === "CARDS_DRAWN" && event.playerId === view.selfPlayerId)
    ? game?.self.hand.filter(card => !newestFrame.before.game?.self.hand.some(old => old.id === card.id)).map(card => card.id) ?? [] : [];
  const active = connected && !view.paused && !pending && !animating && view.status === "PLAYING";
  const turn = game?.currentPlayerId === view.selfPlayerId;
  const selected: UnoCard | undefined = game && selection?.revision === game.revision && selection.matchId === view.matchId ? game.self.hand.find(card => card.id === selection.id) : undefined;
  const wildSelection = game && picker?.revision === game.revision && picker.matchId === view.matchId ? game.self.hand.find(card => card.id === picker.cardId) : undefined;
  const debtTargetId = game?.phase === "draw-stack" && game.pendingDraw > 0 ? game.currentPlayerId : null;
  const choosingColor = (game?.phase === "choose-color" || game?.phase === "penalty-color") && turn;
  function playSelected() {
    if (!selected || !game || !active || !turn) return;
    if (selected.kind === "wild") setPicker({ cardId: selected.id, revision: game.revision, matchId: view.matchId! });
    else onCommand({ type: "PLAY_CARD", cardId: selected.id, declareUno: game.self.hand.length === 2 && declareUno });
  }
  const nameOf = (id: string | null | undefined) => view.members.find(member => member.playerId === id)?.nickname ?? "Người chơi";
  const selfIndex = game?.players.findIndex(player => player.playerId === view.selfPlayerId) ?? 0;
  const opponents = displayGame ? [...displayGame.players.slice(selfIndex + 1), ...displayGame.players.slice(0, selfIndex)] : [];
  const turnText = animating ? "Đang diễn biến…" : !connected ? reconnecting ? "Đang kết nối lại…" : "Kết nối đã đóng." : view.paused ? "Tạm dừng — chờ mọi người kết nối lại." : pending ? "Đang chờ xác nhận…" : game?.phase === "penalty-color" ? turn ? "Bạn chọn màu tiếp theo." : "Chờ " + nameOf(game.currentPlayerId) + " chọn màu." : game?.phase === "draw-stack" ? turn ? "Cộng tiếp hoặc nhận " + game.pendingDraw + " lá." : nameOf(game.currentPlayerId) + " đang chịu +" + game.pendingDraw + "." : turn ? choosingColor ? "Bạn chọn màu tiếp theo." : game?.phase === "drawn" ? "Đánh lá vừa bốc hoặc bỏ lượt." : "Đến lượt bạn." : "Đến lượt " + nameOf(game?.currentPlayerId) + ".";
  return <div className="uno-page" data-testid="uno-screen" data-match-id={view.matchId ?? ""} data-revision={game?.revision ?? -1} data-status={view.status} data-animating={animating ? "true" : "false"} data-self-player-id={view.selfPlayerId}>
    <RoomToolbar roomId={view.roomId} connected={connected} reconnecting={reconnecting} onLeave={props.onLeave} />
    {view.status === "ENDED" && !animating ? <main className="uno-result-main">
      {props.error && <p role="alert" className="error-message">{props.error}</p>}
      {!connected && <button className="button secondary" onClick={props.onReconnect}>Thử kết nối lại</button>}
      <Results view={view} enabled={connected && !view.paused} pending={pending} onRematch={props.onRematch} onLeave={props.onLeave} />
    </main> : game && <main className="uno-board" data-testid="uno-board" data-match-id={view.matchId!} data-revision={game.revision} data-my-turn={turn ? "true" : "false"} data-phase={game.phase}>
      <h1 className="sr-only">Ván chơi đã bắt đầu.</h1>
      <div className="uno-turn-strip"><span className="turn-message" role="status">{turnText}</span><span className="direction-label">{game.direction === 1 ? "↻" : "↺"} <span>{game.direction === 1 ? "Thuận chiều" : "Ngược chiều"}</span></span></div>
      {props.error && <p role="alert" className="board-error">{props.error}</p>}
      {!connected && !reconnecting && <button className="button secondary reconnect-button" onClick={props.onReconnect}>Thử kết nối lại</button>}
      <section className="uno-table" data-opponents={opponents.length} aria-label="Bàn UNO">
        <div className="table-ring" aria-hidden="true" />
        {opponents.map((opponent, index) => <div className={"opponent opponent-" + (opponents.length === 1 ? "top" : opponents.length === 2 ? index === 0 ? "left" : "right" : ["left", "top", "right"][index]) + (game.currentPlayerId === opponent.playerId ? " current" : "")} key={opponent.playerId} data-player-id={opponent.playerId}>
          <div className="opponent-identity"><span className="opponent-avatar">{Array.from(nameOf(opponent.playerId))[0]}</span>
          <strong>{nameOf(opponent.playerId)}</strong><span className="opponent-count" aria-label={opponent.handCount + " lá"}>{opponent.handCount}</span>{!view.members.find(member => member.playerId === opponent.playerId)?.connected && <span className="opponent-offline">Mất mạng</span>}
          </div><div className="opponent-cards"><OpponentHand count={opponent.handCount} />{debtTargetId === opponent.playerId && <DrawDebt count={game.pendingDraw} playerId={opponent.playerId} />}</div>
        </div>)}
        <div className="draw-dock" data-testid="draw-dock"><button type="button" className="draw-pile" aria-label={game.phase === "draw-stack" ? "Bốc chồng bài phạt " + game.pendingDraw + " lá" : "Bốc một lá"} disabled={!active || !turn || (game.phase !== "turn" && game.phase !== "draw-stack")} onClick={() => onCommand({ type: game.phase === "draw-stack" ? "ACCEPT_DRAW_PENALTY" : "DRAW_CARD" })}><CardBack /></button><small>{displayGame!.drawPileCount} lá bốc</small></div>
        <div className="table-center"><div className="table-title">MEEPLEVERSE <span>UNO</span></div>
          <div className="pile-area"><DirectionRing color={pileGame!.activeColor} direction={pileGame!.direction} /><div className="piles">
            <div className="discard-pile" aria-label={"Lá trên bàn: " + cardName(pileGame!.topCard)}>
              <div className="discard-stack" data-testid="discard-stack">{(pileGame!.discardCards ?? [pileGame!.topCard]).map((card, index) => {
                const placement = discardPlacement(card.id);
                return <div className="discard-layer" key={card.id} data-discard-card-id={card.id} style={{ "--pile-x": placement.x + "%", "--pile-y": placement.y + "%", "--pile-angle": placement.angle + "deg", zIndex: index } as CSSProperties}><CardFace card={card} /></div>;
              })}</div></div></div></div>
        </div>
      </section>
      <p className="sr-only" aria-live="polite">{newestFrame?.matchId === view.matchId ? [...planEffects(newestFrame).badges.map(badge => badge.label), ...planEffects(newestFrame).draws.map(draw => (draw.context ? draw.context + " · " : "") + nameOf(draw.playerId) + " bốc " + draw.count + " lá")].join(". ") : ""}</p>
      <Hand pendingDraw={debtTargetId === view.selfPlayerId ? game.pendingDraw : 0} newCardIds={drawnIds} game={displayGame!} enabled={active && turn} selectedId={selected?.id ?? null} onSelect={id => setSelection({ id, revision: game.revision, matchId: view.matchId! })} />
      <section className="uno-controls" aria-label="Điều khiển lượt">
        <div className="action-row"><button className="button secondary" disabled={!active || !turn || (game.phase !== "turn" && game.phase !== "drawn" && game.phase !== "draw-stack")} onClick={() => onCommand({ type: game.phase === "draw-stack" ? "ACCEPT_DRAW_PENALTY" : game.phase === "drawn" ? "PASS_TURN" : "DRAW_CARD" })}>{game.phase === "draw-stack" ? "Nhận " + game.pendingDraw + " lá" : game.phase === "drawn" ? "Bỏ lượt" : "Bốc bài"}</button>
          <button className="button primary" disabled={!active || !turn || !selected || !isPlayable(selected, game)} onClick={playSelected}>Đánh lá bài</button></div>
        <button type="button" className={"uno-button" + (game.self.hand.length === 2 ? " is-ready" : "") + (declareUno ? " is-armed" : "")} aria-label="Hô UNO" aria-pressed={declareUno}
          aria-disabled={!active || !turn || game.self.hand.length !== 2 || (game.phase !== "turn" && game.phase !== "drawn" && game.phase !== "draw-stack")}
          title={declareUno ? "Đã hô UNO cho nước đánh này" : "Bấm UNO trước khi đánh từ 2 lá xuống 1 lá"}
          onClick={() => { if (active && turn && game.self.hand.length === 2 && (game.phase === "turn" || game.phase === "drawn" || game.phase === "draw-stack")) setUnoArmed({ matchId: view.matchId!, revision: game.revision }); }}>
          <strong>UNO!</strong>{declareUno && <span>Đã hô</span>}
        </button>
      </section>
      {(choosingColor || wildSelection) && connected && !view.paused && (game.phase !== "penalty-color" || !animating) && <ColorPicker key={view.matchId! + game.revision} disabled={!active}
        onCancel={choosingColor ? undefined : () => setPicker(null)}
        onChoose={color => choosingColor ? onCommand({ type: "CHOOSE_COLOR", color }) : wildSelection && onCommand({
          type: "PLAY_CARD", cardId: wildSelection.id, chosenColor: color, declareUno: game.self.hand.length === 2 && declareUno,
        })} />}
    </main>}
    {connected && !view.paused && view.game && <UnoEffects key={view.matchId} frames={props.frames} view={view} onComplete={setCompletedFrameId} onPresent={setPresentation} />}
    {props.children}
  </div>;
}
