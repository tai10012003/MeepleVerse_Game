import { z } from "zod";
export const roomJoinSchema = z.strictObject({ nickname: z.string().trim().min(1).max(24) });
export type RoomStatus = "LOBBY" | "PLAYING" | "ENDED";
export interface RoomMemberView { playerId: string; nickname: string; connected: boolean }
export interface MatchOutcome {
  reason: "completed" | "player-left" | "reconnection-expired" | "blocked";
  winnerId: string | null;
  departedPlayerId?: string;
}
export type CommonRoomErrorCode = "INVALID_JOIN" | "ROOM_FULL" | "ROOM_NOT_JOINABLE" |
  "HOST_ONLY" | "NOT_ENOUGH_PLAYERS" | "ROOM_PAUSED" | "NO_ACTIVE_GAME" |
  "STALE_REVISION" | "STALE_MATCH" | "INVALID_ACTION" | "REQUEST_ID_CONFLICT" | "INTERNAL_ERROR";
export interface ActionReply<Code extends string = string> {
  requestId: string | null; ok: boolean; code?: Code;
  roomRevision: number; matchId: string | null; gameRevision: number | null;
}
