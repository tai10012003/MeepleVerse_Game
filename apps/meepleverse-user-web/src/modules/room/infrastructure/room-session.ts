import { Client, type Room } from "@colyseus/sdk";
import type { UnoRoomView, RoomAction, RoomActionReply, RoomGameEvents } from "@meepleverse/contracts/room";
import type { UnoExpandedRoomView, UnoExpandedCommand, UnoExpandedRoomAction, UnoExpandedActionReply } from "@meepleverse/contracts/uno-expanded";
import { expandedRoomView } from "@/modules/games/uno-expanded/infrastructure/uno-expanded-room.adapter";
import type { UnoCommand } from "@meepleverse/contracts/uno";
import { clearSession, readSession, saveSession } from "./session-storage";
import { roomError } from "../model/room-errors";

import type { UnoVisualFrame } from "@/modules/games/uno";

type TransportAction = RoomAction["action"] | UnoExpandedRoomAction["action"];
type TransportReply = RoomActionReply | UnoExpandedActionReply;
type Status = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";
interface SessionState {
  status: Status; view: UnoRoomView | null; expandedView: UnoExpandedRoomView | null; error: string | null; starting: boolean; acting: boolean;
  frames: UnoVisualFrame[]; events: RoomGameEvents | null;
}
const initial: SessionState = { status: "idle", view: null, expandedView: null, error: null, starting: false, acting: false, frames: [], events: null };
class RoomSession {
  private state = initial;
  private readonly listeners = new Set<() => void>();
  private room: Room | null = null;
  private generation = 0;
  private readonly visualPairs = new Map<number, { before: UnoRoomView; after: UnoRoomView }>();
  private pending: Promise<string | null> | null = null;
  private snapshotWaiter: (() => void) | null = null;
  private actionWaiter: { id: string; finish: (reply: TransportReply | null) => void } | null = null;
  getSnapshot = () => this.state;
  getServerSnapshot = () => initial;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private patch(value: Partial<SessionState>): void {
    this.state = { ...this.state, ...value };
    this.listeners.forEach(listener => listener());
  }
  private sdk() { return new Client(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"); }
  private bind(room: Room, generation: number): void {
    this.room = room;
    const current = () => this.generation === generation && this.room === room;
    saveSession(room.roomId, room.reconnectionToken);
    room.onMessage("room_view", (view: UnoRoomView | UnoExpandedRoomView) => {
      if (!current()) return;
      if (view.gameId === "uno-expanded") {
        const expandedView = expandedRoomView(view);
        const previousExpanded = this.state.expandedView;
        const clearError = this.state.status !== "connected" || view.matchId !== previousExpanded?.matchId || view.game?.revision !== previousExpanded?.game?.revision;
        this.visualPairs.clear();
        this.patch({ view: null, expandedView, status: "connected", frames: [], events: null,
          ...(!expandedView ? { error: "INVALID_ROOM_VIEW" } : clearError ? { error: null } : {}) });
        this.snapshotWaiter?.();
        return;
      }
      if (view.gameId !== "uno-basic") return;
      const previous = this.state.view;
      const newMatch = view.matchId !== previous?.matchId;
      if (newMatch || view.paused || !view.game) this.visualPairs.clear();
      else if (previous?.game && view.game && view.game.revision === previous.game.revision + 1) {
        this.visualPairs.set(view.game.revision, { before: previous, after: view });
        if (this.visualPairs.size > 8) this.visualPairs.delete(this.visualPairs.keys().next().value!);
      }
      this.patch({ view, expandedView: null, status: "connected", ...(newMatch ? { events: null } : {}), ...((newMatch || view.paused || !view.game) ? { frames: [] } : {}) });
      this.snapshotWaiter?.();
    });
    room.onMessage("action_reply", (reply: TransportReply) => {
      if (current() && reply.requestId === this.actionWaiter?.id) this.actionWaiter.finish(reply);
    });
    room.onMessage("game_events", (batch: RoomGameEvents) => {
      if (!current() || batch.matchId !== this.state.view?.matchId) return;
      const pair = this.visualPairs.get(batch.revision);
      this.visualPairs.delete(batch.revision);
      const id = batch.matchId + ":" + batch.revision;
      const frame: UnoVisualFrame | null = pair && !this.state.view?.paused && !this.state.frames.some(frame => frame.id === id) ? {
        id, matchId: batch.matchId, revision: batch.revision, before: pair.before, after: pair.after,
        events: batch.events,
      } : null;
      this.patch({ events: batch, ...(frame ? { frames: [...this.state.frames, frame].slice(-16) } : {}) });
    });
    room.onDrop(() => {
      if (current()) { this.actionWaiter?.finish(null); this.visualPairs.clear(); this.patch({ status: "reconnecting", starting: false, acting: false, frames: [] }); }
    });
    room.onReconnect(() => {
      if (!current()) return;
      saveSession(room.roomId, room.reconnectionToken);
      this.patch({ status: "reconnecting", error: null });
      room.send("get_view");
    });
    room.onLeave(() => {
      if (!current()) return;
      this.actionWaiter?.finish(null);
      this.room = null;
      this.patch({ status: "disconnected", starting: false, acting: false, error: "Kết nối phòng đã đóng. Bạn có thể thử kết nối lại hoặc rời phòng." });
    });
    room.onError((_code, message) => { if (current()) this.patch({ error: roomError(message ?? "connection failed") }); });
  }
  private connect(connect: () => Promise<Room>): Promise<string | null> {
    if (this.pending) return this.pending;
    if (this.room) return Promise.resolve(this.room.roomId);
    const generation = ++this.generation;
    this.visualPairs.clear();
    this.patch({ status: "connecting", error: null, view: null, expandedView: null, frames: [], events: null });
    const task = (async () => {
      let joined: Room | null = null;
      try {
        joined = await connect();
        if (generation !== this.generation) { await joined.leave(); return null; }
        this.bind(joined, generation);
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => { this.snapshotWaiter = null; reject(new Error("snapshot timeout")); }, 8000);
          this.snapshotWaiter = () => { clearTimeout(timer); this.snapshotWaiter = null; resolve(); };
          joined!.send("get_view");
        });
        return generation === this.generation ? joined.roomId : null;
      } catch (error) {
        if (generation === this.generation) {
          this.room = null;
          if (joined) { joined.reconnection.enabled = false; await joined.leave().catch(() => {}); }
          clearSession();
          this.patch({ status: "idle", view: null, expandedView: null, error: roomError(error) });
        }
        return null;
      }
    })();
    this.pending = task.finally(() => { if (generation === this.generation) this.pending = null; });
    return this.pending;
  }
  create(nickname: string): Promise<string | null> { return this.connect(() => this.sdk().create("uno", { nickname })); }
  createExpanded(nickname: string): Promise<string | null> {
    if (process.env.NODE_ENV !== "development") return Promise.resolve(null);
    return this.connect(() => this.sdk().create("uno-expanded", { nickname }));
  }
  join(roomId: string, nickname: string): Promise<string | null> { return this.connect(() => this.sdk().joinById(roomId, { nickname })); }
  async restore(roomId?: string): Promise<string | null> {
    if (this.room) return this.room.roomId;
    if (this.pending) return this.pending;
    const saved = readSession();
    if (!saved || (roomId && saved.roomId !== roomId)) return null;
    return this.connect(() => this.sdk().reconnect(saved.token));
  }
  private async sendAction(action: TransportAction, kind: "start" | "game"): Promise<void> {
    const room = this.room;
    if (!room || this.state.status !== "connected" || (this.state.view ?? this.state.expandedView)?.paused || this.state.starting || this.state.acting) return;
    this.patch({ starting: kind === "start", acting: kind === "game", error: null });
    const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("");
    const reply = await new Promise<TransportReply | null>(resolve => {
      const timer = setTimeout(() => { if (this.actionWaiter?.id === requestId) this.actionWaiter.finish(null); }, 8000);
      this.actionWaiter = { id: requestId, finish: reply => { clearTimeout(timer); this.actionWaiter = null; resolve(reply); } };
      try { room.send("action", { requestId, action }); } catch { this.actionWaiter.finish(null); }
    });
    if (this.room !== room) return;
    this.patch({ starting: false, acting: false, error: reply?.ok ? null : reply?.code ? roomError(reply.code) : "Chưa nhận được xác nhận. Hãy kiểm tra trạng thái phòng trước khi thử lại." });
    if (this.state.status === "connected") room.send("get_view");
  }
  async start(): Promise<void> {
    const view = this.state.view ?? this.state.expandedView;
    if (view) await this.sendAction({ type: "START_GAME", expectedRoomRevision: view.revision }, "start");
  }
  async command(command: UnoCommand): Promise<void> {
    const view = this.state.view;
    if (!view?.game || view.status !== "PLAYING" || !view.matchId) return;
    await this.sendAction({ type: "GAME_COMMAND", matchId: view.matchId, expectedRevision: view.game.revision, command }, "game");
  }
  async expandedCommand(command: UnoExpandedCommand): Promise<void> {
    const view = this.state.expandedView;
    if (!view?.game || view.status !== "PLAYING" || !view.matchId) return;
    await this.sendAction({ type: "GAME_COMMAND", matchId: view.matchId, expectedRevision: view.game.revision, command }, "game");
  }
  async leave(): Promise<void> {
    ++this.generation;
    const room = this.room;
    this.room = null; this.pending = null;
    this.actionWaiter?.finish(null);
    this.snapshotWaiter?.();
    clearSession();
    this.visualPairs.clear();
    this.patch(initial);
    if (room) { room.reconnection.enabled = false; await room.leave().catch(() => {}); room.removeAllListeners(); }
  }
}
export const roomSession = new RoomSession();
