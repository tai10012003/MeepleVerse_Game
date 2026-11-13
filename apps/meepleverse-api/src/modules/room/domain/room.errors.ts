import type { RoomErrorCode } from "@meepleverse/contracts/room";
export class RoomRuleError extends Error {
  constructor(public readonly code: RoomErrorCode) { super(code); this.name = "RoomRuleError"; }
}
export function requireRoom(condition: unknown, code: RoomErrorCode): asserts condition {
  if (!condition) throw new RoomRuleError(code);
}
