import { z } from "zod";
import { unoCommandSchema, type UnoView, type UnoErrorCode } from "../games/uno/index.js";
export const roomJoinSchema = z.strictObject({ nickname: z.string().trim().min(1).max(24) });
export const roomActionSchema = z.strictObject({
  requestId: z.string().min(1).max(64),
  action: z.discriminatedUnion("type", [
    z.strictObject({ type: z.literal("START_GAME"), expectedRoomRevision: z.number().int().nonnegative() }),
    z.strictObject({ type: z.literal("GAME_COMMAND"), matchId: z.string().min(1).max(64),
      expectedRevision: z.number().int().nonnegative(), command: unoCommandSchema }),
  ]),
});
export type RoomAction = z.infer<typeof roomActionSchema>;
export type RoomStatus = "LOBBY" | "PLAYING" | "ENDED";
export interface RoomMemberView { playerId: string; nickname: string; connected: boolean }
export interface MatchOutcome {
  reason: "completed" | "player-left" | "reconnection-expired" | "blocked";
  winnerId: string | null;
  departedPlayerId?: string;
}
export interface UnoRoomView {
  roomId: string; revision: number; status: RoomStatus; hostId: string | null;
  paused: boolean; members: RoomMemberView[]; selfPlayerId: string;
  matchId: string | null; game: UnoView | null; outcome: MatchOutcome | null;
}
export type RoomErrorCode = UnoErrorCode | "INVALID_JOIN" | "ROOM_FULL" | "ROOM_NOT_JOINABLE" |
  "HOST_ONLY" | "NOT_ENOUGH_PLAYERS" | "ROOM_PAUSED" | "NO_ACTIVE_GAME" |
  "STALE_REVISION" | "STALE_MATCH" | "INVALID_ACTION" | "REQUEST_ID_CONFLICT" | "INTERNAL_ERROR";
export interface RoomActionReply {
  requestId: string | null; ok: boolean; code?: RoomErrorCode;
  roomRevision: number; matchId: string | null; gameRevision: number | null;
}

export interface RoomGameEvents { matchId: string; revision: number; events: Array<import("../games/uno/events.js").UnoEvent | import("../games/uno/events.js").PrivateUnoEvent> }
