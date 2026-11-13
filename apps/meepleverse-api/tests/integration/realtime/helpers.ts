import { randomUUID } from "node:crypto";
import { Client, type Room } from "@colyseus/sdk";
import type { UnoRoomView, RoomAction, RoomActionReply } from "@meepleverse/contracts/room";
export interface Guest {
  room: Room; view: UnoRoomView | null;
  replies: RoomActionReply[]; events: Array<{ matchId: string; revision: number; events: unknown[] }>;
}
export async function waitFor<T>(read: () => T | undefined | null | false, timeout = 5000): Promise<T> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = read();
    if (result) return result;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error("Timed out waiting for realtime state");
}
export async function attach(room: Room): Promise<Guest> {
  const guest: Guest = { room, view: null, replies: [], events: [] };
  room.reconnection.enabled = false;
  room.onError(() => {});
  room.onMessage("room_view", (view: UnoRoomView) => { guest.view = view; });
  room.onMessage("action_reply", (reply: RoomActionReply) => guest.replies.push(reply));
  room.onMessage("game_events", (event: Guest["events"][number]) => guest.events.push(event));
  room.send("get_view");
  await waitFor(() => guest.view);
  return guest;
}
export async function createGuest(endpoint: string, nickname = "Host"): Promise<Guest> {
  return attach(await new Client(endpoint).create("uno", { nickname }));
}
export async function joinGuest(endpoint: string, code: string, nickname = "Guest"): Promise<Guest> {
  return attach(await new Client(endpoint).joinById(code, { nickname }));
}
export async function send(guest: Guest, action: RoomAction["action"], requestId: string = randomUUID()): Promise<RoomActionReply> {
  const old = guest.replies.length;
  guest.room.send("action", { requestId, action });
  return waitFor(() => guest.replies.slice(old).find(reply => reply.requestId === requestId));
}
export async function start(guest: Guest): Promise<RoomActionReply> {
  return send(guest, { type: "START_GAME", expectedRoomRevision: guest.view!.revision });
}
export async function fresh(guest: Guest): Promise<UnoRoomView> {
  const old = guest.view;
  guest.room.send("get_view");
  return waitFor(() => guest.view && guest.view !== old ? guest.view : null);
}
