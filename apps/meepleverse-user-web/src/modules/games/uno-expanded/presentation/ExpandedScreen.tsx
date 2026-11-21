"use client";
import type { ReactNode } from "react";
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
import { HighFivePanel } from "./minigames/HighFivePanel";
import { UpPanel } from "./minigames/UpPanel";
import { MiniFeedback } from "./minigames/MiniFeedback";
import "./expanded-table.css";
export function ExpandedScreen({ view, connected, reconnecting, pending, error, feedback, interactionEpoch, onCommand, onRematch, onLeave, onReconnect, children }: {
  view: UnoExpandedRoomView; connected: boolean; reconnecting: boolean; pending: boolean; error: string | null;
  feedback: MiniFeedbackFrame[]; interactionEpoch: number;
  onCommand: (command: UnoExpandedCommand) => void; onRematch: () => void; onLeave: () => void; onReconnect: () => void; children?: ReactNode;
}) {
  const turn = useExpandedTurn(view, connected, pending, onCommand); const game = view.game;
  const battle = useBattleChoice(view, connected, pending, interactionEpoch, onCommand);
  const name = view.members.find(member => member.playerId === game?.currentPlayerId)?.nickname ?? "Người chơi";
  const effect = game?.effect;
  const text = !connected ? reconnecting ? "Đang kết nối lại…" : "Mất kết nối." : view.paused ? "Tạm dừng — chờ mọi người kết nối lại." : pending ? "Đang chờ xác nhận…" : effect?.kind === "battle" ? "Battle · Chọn bí mật, lật cùng lúc." : effect?.kind === "high-five" ? "Đập tay · Chờ hiệu lệnh." : effect?.kind === "up" ? `Tăng tiến · ${game?.currentPlayerId === view.selfPlayerId ? "Bạn đáp bài." : `Chờ ${name}.`}` : game?.currentPlayerId === view.selfPlayerId ? game.phase === "draw-stack" ? `Cộng tiếp hoặc nhận ${game.pendingDraw} lá.` : game.phase === "drawn" ? "Đánh lá vừa bốc hoặc bỏ lượt." : "Đến lượt bạn." : `Đến lượt ${name}.`;
  function draw() { if (turn.active && game && !effect) onCommand({ type: game.phase === "draw-stack" ? "ACCEPT_DRAW_PENALTY" : game.phase === "drawn" ? "PASS_TURN" : "DRAW_CARD" }); }
  const uno = effect?.kind === "battle" ? battle : turn;
  const feedbackPanel = connected ? <MiniFeedback view={view} frames={feedback} /> : null;
  const miniPanel = effect?.kind === "battle" ? <BattlePanel view={view} choice={battle} connected={connected} feedback={feedback} />
    : effect?.kind === "high-five" ? <HighFivePanel view={view} connected={connected} pending={pending} onCommand={onCommand} />
    : effect?.kind === "up" ? <UpPanel view={view} /> : feedbackPanel;
  return <div className="expanded-game" data-testid="expanded-screen" data-game-id="uno-expanded" data-match-id={view.matchId ?? ""} data-revision={game?.revision ?? -1} data-self-player-id={view.selfPlayerId} data-status={view.status}>
    <RoomToolbar roomId={view.roomId} gameId="uno-expanded" connected={connected} reconnecting={reconnecting} onLeave={onLeave} />
    {error && <p className="expanded-error" role="alert">{error}</p>}{!connected && !reconnecting && <button className="button secondary" onClick={onReconnect}>Thử kết nối lại</button>}
    {view.status === "ENDED" ? <>{feedbackPanel}<ExpandedResults view={view} enabled={connected && !view.paused} pending={pending} onRematch={onRematch} onLeave={onLeave} /></> : game && <main className="expanded-board" data-testid="expanded-board" data-phase={game.phase} data-my-turn={game.currentPlayerId === view.selfPlayerId}>
      <h1 className="expanded-sr">Ván UNO Mở rộng đã bắt đầu.</h1><div className="expanded-turn-strip"><strong role="status">{text}</strong><span>{game.direction === 1 ? "↻ Thuận chiều" : "↺ Ngược chiều"}</span></div>
      <ExpandedTable view={view} active={turn.active && !effect} onDraw={draw}>{miniPanel}</ExpandedTable>
      <ExpandedHand game={game} enabled={turn.active} selectedId={turn.selected?.id} onSelect={turn.select} />
      <section className="expanded-controls" aria-label="Điều khiển lượt"><div className="expanded-actions"><button className="button secondary" disabled={!turn.active || !!effect} onClick={draw}>{game.phase === "draw-stack" ? `Nhận ${game.pendingDraw} lá` : game.phase === "drawn" ? "Bỏ lượt" : "Bốc bài"}</button><button className="button primary" disabled={!turn.active || !turn.selected} onClick={turn.play}>{effect?.kind === "up" ? "Đáp lá bài" : "Đánh lá bài"}</button></div>
        <button type="button" className={`expanded-uno${game.self.hand.length === 2 || uno.needsUno ? " is-ready" : ""}${uno.armed ? " is-armed" : ""}`} aria-label="Hô UNO" aria-pressed={uno.armed} aria-disabled={!uno.canArm} onClick={uno.toggleUno}><strong>UNO!</strong>{uno.armed && <small>Đã hô</small>}</button>
      </section><p className="expanded-development-note">Bàn thử nội bộ · UNO Mở rộng</p>
      {turn.dialogOpen && <ExpandedPlayDialog key={`${view.matchId}:${game.revision}:${view.revision}`} view={view} turn={turn} />}
    </main>}{children}
  </div>;
}
