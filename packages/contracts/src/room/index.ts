import { z } from "zod";
import { unoCommandSchema, type UnoView, type UnoErrorCode } from "../games/uno/index.js";
export { roomJoinSchema } from "./common.js";
export const roomActionSchema = z.strictObject({
  requestId: z.string().min(1).max(64),
  action: z.discriminatedUnion("type", [
    z.strictObject({ type: z.literal("START_GAME"), expectedRoomRevision: z.number().int().nonnegative() }),
    z.strictObject({ type: z.literal("GAME_COMMAND"), matchId: z.string().min(1).max(64),
      expectedRevision: z.number().int().nonnegative(), command: unoCommandSchema }),
  ]),
});
export type RoomAction = z.infer<typeof roomActionSchema>;
import type { RoomStatus, RoomMemberView, MatchOutcome, CommonRoomErrorCode } from "./common.js";
export type { RoomStatus, RoomMemberView, MatchOutcome, CommonRoomErrorCode, ActionReply } from "./common.js";
export interface UnoRoomView {
  gameId: "uno-basic";
  roomId: string; revision: number; status: RoomStatus; hostId: string | null;
  paused: boolean; members: RoomMemberView[]; selfPlayerId: string;
  matchId: string | null; game: UnoView | null; outcome: MatchOutcome | null;
}
export type RoomErrorCode = UnoErrorCode | CommonRoomErrorCode;
export interface RoomActionReply {
  requestId: string | null; ok: boolean; code?: RoomErrorCode;
  roomRevision: number; matchId: string | null; gameRevision: number | null;
}

export interface RoomGameEvents { matchId: string; revision: number; events: Array<import("../games/uno/events.js").UnoEvent> }
