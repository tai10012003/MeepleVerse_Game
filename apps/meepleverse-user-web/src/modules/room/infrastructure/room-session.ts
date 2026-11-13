import { Client, type Room } from "@colyseus/sdk";
import type { UnoRoomView, RoomActionReply } from "@meepleverse/contracts/room";
import { clearSession, readSession, saveSession } from "./session-storage";
import { roomError } from "../model/room-errors";

type Status = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";
interface SessionState { status: Status; view: UnoRoomView | null; error: string | null; starting: boolean }
const initial: SessionState = { status: "idle", view: null, error: null, starting: false };
class RoomSession {
  private state = initial;
  private readonly listeners = new Set<() => void>();
  private room: Room | null = null;
  private generation = 0;
  private pending: Promise<string | null> | null = null;
  private snapshotWaiter: (() => void) | null = null;
  private startWaiter: { id: string; finish: (reply: RoomActionReply | null) => void } | null = null;
  getSnapshot = () => this.state;
  getServerSnapshot = () => initial;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private patch(value: Partial<SessionState>): void {
    this.state = { ...this.state, ...value };
    this.listeners.forEach(listener => listener());
  }
  private sdk() {
    const endpoint = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
    return new Client(endpoint);
  }
  private bind(room: Room, generation: number): void {
    this.room = room;
    const current = () => this.generation === generation && this.room === room;
    saveSession(room.roomId, room.reconnectionToken);
    room.onMessage("room_view", (view: UnoRoomView) => {
      if (!current()) return;
      this.patch({ view, status: "connected" });
      this.snapshotWaiter?.();
    });
    room.onMessage("action_reply", (reply: RoomActionReply) => {
      if (current() && reply.requestId === this.startWaiter?.id) this.startWaiter.finish(reply);
    });
    room.onMessage("game_events", () => { /* Board animations are a later milestone. */ });
    room.onDrop(() => { if (current()) { this.startWaiter?.finish(null); this.patch({ status: "reconnecting", starting: false }); } });
    room.onReconnect(() => {
      if (!current()) return;
      saveSession(room.roomId, room.reconnectionToken);
      this.patch({ status: "reconnecting", error: null });
      room.send("get_view");
    });
    room.onLeave(() => {
      if (!current()) return;
      this.startWaiter?.finish(null);
      this.room = null;
      this.patch({ status: "disconnected", starting: false, error: "Kết nối phòng đã đóng. Bạn có thể thử kết nối lại hoặc rời phòng." });
    });
    room.onError((_code, message) => { if (current()) this.patch({ error: roomError(message ?? "connection failed") }); });
  }
  private connect(connect: () => Promise<Room>): Promise<string | null> {
    if (this.pending) return this.pending;
    if (this.room) return Promise.resolve(this.room.roomId);
    const generation = ++this.generation;
    this.patch({ status: "connecting", error: null, view: null });
    this.pending = (async () => {
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
        return joined.roomId;
      } catch (error) {
        if (generation === this.generation) {
          this.room = null;
          if (joined) { joined.reconnection.enabled = false; await joined.leave().catch(() => {}); }
          clearSession();
          this.patch({ status: "idle", view: null, error: roomError(error) });
        }
        return null;
      } finally {
        if (generation === this.generation) this.pending = null;
      }
    })();
    return this.pending;
  }
  create(nickname: string): Promise<string | null> { return this.connect(() => this.sdk().create("uno", { nickname })); }
  join(roomId: string, nickname: string): Promise<string | null> {
    return this.connect(() => this.sdk().joinById(roomId, { nickname }));
  }
  async restore(roomId?: string): Promise<string | null> {
    if (this.room) return this.room.roomId;
    if (this.pending) return this.pending;
    const saved = readSession();
    if (!saved || (roomId && saved.roomId !== roomId)) return null;
    return this.connect(() => this.sdk().reconnect(saved.token));
  }
  async start(): Promise<void> {
    const room = this.room;
    const view = this.state.view;
    if (!room || !view || this.state.status !== "connected" || this.state.starting) return;
    this.patch({ starting: true, error: null });
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const requestId = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    const reply = await new Promise<RoomActionReply | null>(resolve => {
      const timer = setTimeout(() => this.startWaiter?.finish(null), 8000);
      this.startWaiter = { id: requestId, finish: reply => {
        clearTimeout(timer); this.startWaiter = null; resolve(reply);
      } };
      room.send("action", { requestId, action: { type: "START_GAME", expectedRoomRevision: view.revision } });
    });
    if (this.room !== room) return;
    this.patch({ starting: false, error: reply?.ok ? null : reply?.code ? roomError(reply.code) : "Chưa nhận được xác nhận. Hãy kiểm tra trạng thái phòng trước khi thử lại." });
    if (this.state.status === "connected") room.send("get_view");
  }
  async leave(): Promise<void> {
    ++this.generation;
    const room = this.room;
    this.room = null; this.pending = null;
    this.startWaiter?.finish(null);
    clearSession();
    this.patch(initial);
    if (room) { room.reconnection.enabled = false; await room.leave().catch(() => {}); room.removeAllListeners(); }
  }
}
export const roomSession = new RoomSession();
