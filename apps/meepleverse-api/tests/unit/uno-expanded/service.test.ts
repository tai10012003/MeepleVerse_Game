import { describe, expect, it } from "vitest";
import { UnoExpandedGameService } from "../../../src/modules/games/uno-expanded/application/services/uno-expanded-game.service.js";
import { createExpandedGame } from "../../../src/modules/games/uno-expanded/index.js";
import { seeded } from "../uno/fixtures.js";
function service() {
  const service = new UnoExpandedGameService("AB12", ids => createExpandedGame(ids, seeded(8)));
  service.add("a", "A"); service.add("b", "B"); return service;
}
describe("Expanded room service", () => {
  it("guards host, room revision and connection state before preparing once", () => {
    const s = service();
    expect(() => s.execute("b", { type: "START_GAME", expectedRoomRevision: s.revision })).toThrow("HOST_ONLY");
    expect(() => s.execute("a", { type: "START_GAME", expectedRoomRevision: 0 })).toThrow("STALE_REVISION");
    s.setConnected("b", false);
    expect(() => s.execute("a", { type: "START_GAME", expectedRoomRevision: s.revision })).toThrow("ROOM_PAUSED");
    s.setConnected("b", true);
    const result = s.execute("a", { type: "START_GAME", expectedRoomRevision: s.revision });
    expect(result.events.public[0]).toMatchObject({ type: "GAME_PREPARED", playerCount: 2 });
    expect(s.view("a").gameId).toBe("uno-expanded"); expect(s.game!.phase).toBe("prepared");
    expect(() => s.execute("a", { type: "START_GAME", expectedRoomRevision: s.revision })).toThrow("INVALID_PHASE");
  });
  it("checks match and game revisions, then rejects gameplay without any state changes", () => {
    const s = service(); s.execute("a", { type: "START_GAME", expectedRoomRevision: s.revision });
    const action = { type: "GAME_COMMAND" as const, matchId: s.matchId!, expectedRevision: 0, command: { type: "DRAW_CARD" as const } };
    expect(() => s.execute("a", { ...action, matchId: "old" })).toThrow("STALE_MATCH");
    expect(() => s.execute("a", { ...action, expectedRevision: 1 })).toThrow("STALE_REVISION");
    const before = s.view("a");
    expect(() => s.execute("a", action)).toThrow("UNSUPPORTED_COMMAND"); expect(s.view("a")).toEqual(before);
  });
  it("ends on departure, transfers host, and creates a fresh match for the remaining group", () => {
    const s = service(); s.add("c", "C");
    s.execute("a", { type: "START_GAME", expectedRoomRevision: s.revision }); const old = s.matchId;
    s.leave("a", true);
    expect(s.status).toBe("ENDED"); expect(s.hostId).toBe("b"); expect(s.game).toBeNull();
    expect(s.outcome).toMatchObject({ reason: "reconnection-expired", departedPlayerId: "a" });
    s.execute("b", { type: "START_GAME", expectedRoomRevision: s.revision });
    expect(s.matchId).not.toBe(old); expect(s.game!.players).toHaveLength(2);
  });
  it("does not publish a half-started match if setup fails", () => {
    const s = new UnoExpandedGameService("AB12", () => { throw new Error("setup failed"); });
    s.add("a", "A"); s.add("b", "B"); const before = s.view("a");
    expect(() => s.execute("a", { type: "START_GAME", expectedRoomRevision: s.revision })).toThrow("setup failed");
    expect(s.view("a")).toEqual(before);
  });
});
