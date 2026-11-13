import { schema, t, type SchemaType } from "@colyseus/schema";
export const MemberSchema = schema({
  playerId: t.string().default(""),
  nickname: t.string().default(""),
  connected: t.boolean().default(true),
  handCount: t.number().default(0),
}, "MemberSchema");
export type MemberSchema = SchemaType<typeof MemberSchema>;
// Deliberately contains no hands, stock, or challenge evidence.
export const UnoRoomSchema = schema({
  roomId: t.string().default(""),
  revision: t.number().default(0),
  status: t.string().default("LOBBY"),
  hostId: t.string().default(""),
  paused: t.boolean().default(false),
  matchId: t.string().default(""),
  currentPlayerId: t.string().default(""),
  activeColor: t.string().default(""),
  members: t.array(MemberSchema),
}, "UnoRoomSchema");
export type UnoRoomSchema = SchemaType<typeof UnoRoomSchema>;
