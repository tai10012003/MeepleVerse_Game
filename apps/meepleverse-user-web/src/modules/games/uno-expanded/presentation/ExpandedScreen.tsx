"use client";
import { TurnCountdown } from "@/shared/ui/TurnCountdown";
import { useState, type ReactNode } from "react";
import type { UnoExpandedCommand, UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import { RoomToolbar } from "@/layouts/RoomToolbar";
import { useExpandedTurn } from "../application/useExpandedTurn";
import { useBattleChoice } from "../application/useBattleChoice";
import type { MiniFeedbackFrame } from "../model/mini-feedback";
import { ExpandedHand } from "./components/ExpandedHand";
import { ExpandedTable } from "./components/ExpandedTable";
import { ExpandedPlayDialog } from "./components/ExpandedPlayDialog";
import { ExpandedResults } from "./components/ExpandedResults";
import { BattlePanel } from "./minigames/BattlePanel";
import { HighFivePanel, HighFiveButton } from "./minigames/HighFivePanel";
import { UpPanel } from "./minigames/UpPanel";
import { MiniFeedback } from "./minigames/MiniFeedback";
import { ExpandedEffects } from "./animations/ExpandedEffects";
import type { ExpandedVisualFrame, ExpandedPresentation } from "../model/expanded-effects";
import "./expanded-table.css";
import "@/modules/games/uno-common/presentation/side-seating.css";
export function ExpandedScreen({ view, connected, reconnecting, pending, error, frames, feedback, interactionEpoch, onCommand, onRematch, onLeave, onReconnect, children }: {
  view: UnoExpandedRoomView; connected: boolean; reconnecting: boolean; pending: boolean; error: string | null;
  frames: ExpandedVisualFrame[]; feedback: MiniFeedbackFrame[]; interactionEpoch: number;
  onCommand: (command: UnoExpandedCommand) => void; onRematch: () => void; onLeave: () => void; onReconnect: () => void; children?: ReactNode;
}) {
  const game = view.game;
  const [completedFrameId, setCompletedFrameId] = useState<string | null>(() => frames.at(-1)?.id ?? null);
  const [presentation, setPresentation] = useState<ExpandedPresentation | null>(null);
  const newestFrame = frames.at(-1);
  const animating = connected && !view.paused && !!newestFrame && newestFrame.matchId === view.matchId && newestFrame.id !== completedFrameId;
  // Timed mini-games always use live state and remain interactive during visual effects.
  const visualFrame = animating ? (presentation?.frame.matchId === view.matchId ? presentation.frame : newestFrame) : undefined;
  const currentVisual = visualFrame?.revision === game?.revision;
  const displaySource = !game?.effect && visualFrame ? visualFrame.after.game ?? game : game;
  const drawing = visualFrame && (!game?.effect || currentVisual) ? visualFrame?.events.filter(event => event.type === "CARDS_DRAWN") ?? [] : [];
  const remaining = (id: string) => Math.max(0, drawing.filter(event => event.playerId === id).reduce((sum,event) => sum + event.count,0) - (presentation?.frame.id === visualFrame?.id ? presentation?.arrived[id] ?? 0 : 0));
  const oldIds = new Set(visualFrame?.before.game?.self.hand.map(card => card.id));
  const arriving = displaySource?.self.hand.filter(card => !oldIds.has(card.id)) ?? [];
  const hidden = new Set(remaining(view.selfPlayerId) ? arriving.slice(-remaining(view.selfPlayerId)).map(card => card.id) : []);
  let displayGame = displaySource ? { ...displaySource, self: { ...displaySource.self, hand: displaySource.self.hand.filter(card => !hidden.has(card.id)) },
    players: displaySource.players.map(player => ({ ...player, handCount: Math.max(0,player.handCount - remaining(player.playerId)) })),
    drawPileCount: displaySource.drawPileCount + displaySource.players.reduce((sum,player) => sum + remaining(player.playerId),0) } : game;
  const swap = visualFrame && (!game?.effect || currentVisual) ? visualFrame.events.find(event => event.type === "HANDS_SWAPPED") : undefined;
  const swapStage = presentation && presentation.frame.id === visualFrame?.id ? presentation.swapStage : "waiting";
  const swappingPlayers = swap ? [swap.playerId, swap.targetPlayerId] : [];
  const flyingHands = swapStage === "flying" ? swappingPlayers : [];
  if (swap && swapStage !== "arrived" && displayGame && visualFrame?.before.game) {
    const previous = visualFrame.before.game;
    const playedId = visualFrame.events.find(event => event.type === "CARD_PLAYED")?.card.id;
    displayGame = { ...displayGame,
      self: { ...displayGame.self, hand: swappingPlayers.includes(view.selfPlayerId) ? previous.self.hand.filter(card => card.id !== playedId) : displayGame.self.hand },
      players: displayGame.players.map(player => {
        if (!swappingPlayers.includes(player.playerId)) return player;
        const oldCount = previous.players.find(old => old.playerId === player.playerId)!.handCount;
        return {...player, handCount:oldCount - (player.playerId === swap.playerId ? 1 : 0)};
      }),
    };
  }
  const played = visualFrame?.events.some(event => event.type === "CARD_PLAYED");
  const landed = presentation?.frame.id === visualFrame?.id && presentation?.landed;
  const pileGame = visualFrame && (!game?.effect || currentVisual) ? played && !landed ? visualFrame.before.game : visualFrame.after.game : game;
  const displayView = displayGame ? { ...view, game: displayGame } : view;
  const busy = pending || (animating && !game?.effect);
  const turn = useExpandedTurn(view, connected, busy, onCommand);
  const battle = useBattleChoice(view, connected, pending, interactionEpoch, onCommand);
  const name = view.members.find(member => member.playerId === game?.currentPlayerId)?.nickname ?? "Người chơi";
  const effect = game?.effect;
  const text = !connected ? reconnecting ? "Đang kết nối lại…" : "Mất kết nối." : view.paused ? "Tạm dừng — chờ mọi người kết nối lại." : animating && !effect ? "Đang diễn biến…" : pending ? "Đang chờ xác nhận…" : effect?.kind === "battle" ? "Battle · Chọn bí mật, lật cùng lúc." : effect?.kind === "high-five" ? effect.stage === "preparing" ? "Đập tay · Chờ hiệu lệnh." : "Đập tay · Bấm ✋ trong 5 giây." : effect?.kind === "up" ? `Tăng tiến · ${game?.currentPlayerId === view.selfPlayerId ? "Bạn đáp bài." : `Chờ ${name}.`}` : game?.currentPlayerId === view.selfPlayerId ? game.phase === "draw-stack" ? `Cộng tiếp hoặc nhận ${game.pendingDraw} lá.` : game.phase === "drawn" ? "Đánh lá vừa bốc hoặc bỏ lượt." : "Đến lượt bạn." : `Đến lượt ${name}.`;
  function draw() { if (turn.active && game && !effect) onCommand({ type: game.phase === "draw-stack" ? "ACCEPT_DRAW_PENALTY" : game.phase === "drawn" ? "PASS_TURN" : "DRAW_CARD" }); }
  const uno = effect?.kind === "battle" ? battle : turn;
  const feedbackPanel = connected && view.status === "PLAYING" ? <MiniFeedback view={view} frames={feedback} /> : null;
  const miniPanel = effect?.kind === "battle" ? <BattlePanel view={view} choice={battle} connected={connected} feedback={feedback} />
    : effect?.kind === "high-five" ? <HighFivePanel view={view} connected={connected} />
    : effect?.kind === "up" ? <UpPanel view={view} /> : feedbackPanel;
  return <div className="expanded-game" data-testid="expanded-screen" data-game-id="uno-expanded" data-match-id={view.matchId ?? ""} data-revision={game?.revision ?? -1} data-self-player-id={view.selfPlayerId} data-status={view.status} data-animating={animating} data-swap-stage={swap ? swapStage : "none"} data-phase={game?.phase} data-current-player-id={game?.currentPlayerId ?? ""} data-stock-count={game?.drawPileCount} data-discard-count={game?.discardPileCount} data-hand-count={game?.self.hand.length} data-pending-draw={game?.pendingDraw} data-active-color={game?.activeColor} data-direction={game?.direction}>
    <RoomToolbar roomId={view.roomId} gameId="uno-expanded" connected={connected} reconnecting={reconnecting} onLeave={onLeave} />
    {error && <p className="expanded-error" role="alert">{error}</p>}{!connected && !reconnecting && <button className="button secondary" onClick={onReconnect}>Thử kết nối lại</button>}
    {view.status === "ENDED" && !animating ? <ExpandedResults view={view} enabled={connected && !view.paused} pending={pending} onRematch={onRematch} onLeave={onLeave} /> : game && <main className="expanded-board" data-testid="expanded-board" data-phase={game.phase} data-my-turn={game.currentPlayerId === view.selfPlayerId}>
      <h1 className="expanded-sr">Ván UNO Mở rộng đã bắt đầu.</h1><div className="expanded-turn-strip"><strong role="status">{text}{view.turnClock?.playerId === view.selfPlayerId && <span className="self-turn-clock"><span className="clock-avatar" aria-hidden="true">{Array.from(view.members.find(member => member.playerId === view.selfPlayerId)?.nickname ?? "?")[0]}</span><TurnCountdown clock={view.turnClock} matchId={view.matchId} audible /></span>}</strong><span>{game.direction === 1 ? "↻ Thuận chiều" : "↺ Ngược chiều"}</span></div>
      <ExpandedTable hiddenHandIds={flyingHands} view={displayView} pileGame={pileGame ?? game} active={turn.active && !effect} onDraw={draw}>{miniPanel}</ExpandedTable>
      <ExpandedHand transferring={flyingHands.includes(view.selfPlayerId)} newCardIds={newestFrame?.matchId === view.matchId && newestFrame.events.some(event => event.type === "CARDS_DRAWN" && event.playerId === view.selfPlayerId) ? game.self.hand.filter(card => !newestFrame.before.game?.self.hand.some(old => old.id === card.id)).map(card => card.id) : []} game={displayGame!} enabled={turn.active} selectedId={turn.selected?.id} onSelect={turn.select} />
      <section className="expanded-controls" aria-label="Điều khiển lượt">{turn.needsUno && !turn.dialogOpen && <p className="expanded-uno-reminder">{turn.armed ? "Đã hô UNO." : turn.selected?.kind.startsWith("seven-change") ? "Hô UNO trước khi chuyển tay bài vừa giảm xuống 1 lá." : "Nước này còn 1 lá: bấm UNO trước khi đánh."}</p>}<div className="expanded-actions"><button className="button secondary" disabled={!turn.active || !!effect} onClick={draw}>{game.phase === "draw-stack" ? `Nhận ${game.pendingDraw} lá` : game.phase === "drawn" ? "Bỏ lượt" : "Bốc bài"}</button><button className="button primary" disabled={!turn.active || !turn.selected} onClick={turn.play}>{effect?.kind === "up" ? "Đáp lá bài" : "Đánh lá bài"}</button></div>
        <div className="expanded-quick-actions"><HighFiveButton view={view} connected={connected} pending={pending} onCommand={onCommand} /><button type="button" className={`expanded-uno${(game.self.hand.length === 2 && turn.selected?.kind !== "wild-card-swap") || uno.needsUno ? " is-ready" : ""}${uno.armed ? " is-armed" : ""}`} aria-label="Hô UNO" aria-pressed={uno.armed} aria-disabled={!uno.canArm} onClick={uno.toggleUno}><strong>UNO!</strong>{uno.armed && <small>Đã hô</small>}</button></div>
      </section><p className="expanded-development-note">Đang mở bàn · UNO Mở rộng</p>
      {turn.dialogOpen && <ExpandedPlayDialog key={`${view.matchId}:${game.revision}:${view.revision}`} view={view} turn={turn} />}
    </main>}
    {game && connected && !view.paused && <ExpandedEffects key={`${view.matchId}:${interactionEpoch}`} frames={frames} view={view} onComplete={setCompletedFrameId} onPresent={setPresentation} />}
    {children}
  </div>;
}
