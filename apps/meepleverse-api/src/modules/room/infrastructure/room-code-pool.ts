import { randomInt } from "node:crypto";
// Single-process allocator; reservation is synchronous, so concurrent creates cannot race.
export class RoomCodePool {
  private readonly used = new Set<string>();
  reserve(): string {
    for (let attempt = 0; attempt < 10000; attempt++) {
      const code = Array.from({ length: 4 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[randomInt(36)]).join("");
      if (!this.used.has(code)) { this.used.add(code); return code; }
    }
    throw new Error("Room code allocation exhausted");
  }
  release(code: string): void { this.used.delete(code); }
}
