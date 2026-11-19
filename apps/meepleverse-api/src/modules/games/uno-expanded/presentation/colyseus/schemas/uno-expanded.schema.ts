import { schema, t, type SchemaType } from "@colyseus/schema";
const ExpandedMemberSchema = schema({
  playerId: t.string().default(""), nickname: t.string().default(""),
  connected: t.boolean().default(true), handCount: t.number().default(0),
}, "ExpandedMemberSchema");
// Public metadata only: no hand arrays, stock IDs or private choices.
export const UnoExpandedRoomSchema = schema({
  gameId: t.string().default("uno-expanded"), roomId: t.string().default(""),
  revision: t.number().default(0), status: t.string().default("LOBBY"), hostId: t.string().default(""),
  paused: t.boolean().default(false), matchId: t.string().default(""),
  phase: t.string().default(""), activeColor: t.string().default(""),
  members: t.array(ExpandedMemberSchema),
}, "UnoExpandedRoomSchema");
export type UnoExpandedRoomSchema = SchemaType<typeof UnoExpandedRoomSchema>;
export { ExpandedMemberSchema };
