import { z } from "zod";
import type { RoomStatus, RoomMemberView, MatchOutcome, CommonRoomErrorCode, ActionReply } from "../../room/common.js";
import type { UnoExpandedView } from "./state.js";
import type { UnoExpandedEvent } from "./events.js";
import { unoExpandedCommandSchema } from "./commands.js";
export const unoExpandedRoomActionSchema = z.strictObject({
  requestId: z.string().min(1).max(64),
  action: z.discriminatedUnion("type", [
    z.strictObject({ type: z.literal("START_GAME"), expectedRoomRevision: z.number().int().nonnegative() }),
    z.strictObject({ type: z.literal("GAME_COMMAND"), matchId: z.string().min(1).max(64),
      expectedRevision: z.number().int().nonnegative(), command: unoExpandedCommandSchema }),
  ]),
});
export type UnoExpandedRoomAction = z.infer<typeof unoExpandedRoomActionSchema>;
export interface UnoExpandedRoomView {
  gameId: "uno-expanded";
  roomId: string; revision: number; status: RoomStatus; hostId: string | null;
  paused: boolean; members: RoomMemberView[]; selfPlayerId: string;
  matchId: string | null; game: UnoExpandedView | null; outcome: MatchOutcome | null;
}
export type UnoExpandedErrorCode = CommonRoomErrorCode | "INVALID_SETUP" | "INVALID_RANDOM" | "UNKNOWN_PLAYER" | "INVALID_PHASE" | "UNSUPPORTED_COMMAND";
export type UnoExpandedActionReply = ActionReply<UnoExpandedErrorCode>;
export interface UnoExpandedGameEvents { matchId: string; revision: number; events: UnoExpandedEvent[] }
