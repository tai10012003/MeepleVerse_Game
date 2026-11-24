import { describe, expect, it } from "vitest";
import { applyExpandedCommand, getExpandedPlayerView } from "../../../src/modules/games/uno-expanded/index.js";
import { UnoExpandedGameService } from "../../../src/modules/games/uno-expanded/application/services/uno-expanded-game.service.js";
import { fixture, num, black, stock, conserved, play } from "./fixtures.js";
import { seeded } from "../uno/fixtures.js";

function setup(count = 4) {
  return fixture([[black("swap", "wild-card-swap"), num("actor-a"), num("actor-b", "blue")],
    ...Array.from({length:count-1}, (_, i) => [num(`private-${i}`, "yellow", i)])], stock(10));
}
describe("Card Swap", () => {
  for (const count of [2, 3, 4]) for (const direction of [1, -1] as const) {
    it(`swaps only the chosen hands with ${count} players in direction ${direction}`, () => {
      const game = setup(count); game.direction = direction;
      const target = game.players[count - 1]!;
      const original = structuredClone(game);
      const result = play(game, "swap", {targetPlayerId:target.id, chosenColor:"green"});
      const next = result.state;
      expect(next.players[0]!.hand).toEqual(original.players[count - 1]!.hand);
      expect(next.players[count - 1]!.hand).toEqual(original.players[0]!.hand.slice(1));
      for (let i = 1; i < count - 1; i++) expect(next.players[i]).toEqual(original.players[i]);
      expect(next.activeColor).toBe("green"); expect(next.discardPile.at(-1)!.id).toBe("swap");
      expect(next.direction).toBe(direction); expect(next.currentIndex).toBe(direction === 1 ? 1 : count - 1);
      expect(next.phase).toBe("turn"); expect(next.effect).toBeNull(); expect(next.revision).toBe(1);
      expect(next.drawPile).toEqual(original.drawPile);
      expect(result.events.public).toContainEqual({type:"HANDS_SWAPPED",playerId:"p0",targetPlayerId:target.id,playerHandCount:1,targetHandCount:2});
      expect(result.events.public.some(event => event.type === "UNO_PENALTY" || event.type === "UNO_CALLED")).toBe(false);
      expect(game).toEqual(original); conserved(game,next);
      for (const recipient of next.players) {
        const view = getExpandedPlayerView(next, recipient.id);
        expect(view.self.hand).toEqual(recipient.hand);
        const serialized = JSON.stringify(view);
        for (const other of next.players.filter(player => player.id !== recipient.id)) for (const card of other.hand) expect(serialized).not.toContain(card.id);
      }
      const publicEvents = JSON.stringify(result.events.public);
      for (const card of next.players.flatMap(player => player.hand)) expect(publicEvents).not.toContain(card.id);
    });
  }
  it("does not penalize either recipient of a one-card hand, including an actor who started with two", () => {
    const game = fixture([[black("swap", "wild-card-swap"),num("one")],[num("other")]],stock(10));
    const result = play(game,"swap",{targetPlayerId:"p1",chosenColor:"yellow"});
    expect(result.state.players.map(player=>player.hand.map(card=>card.id))).toEqual([["other"],["one"]]);
    expect(result.events.public.some(event=>event.type === "UNO_PENALTY")).toBe(false); conserved(game,result.state);
  });
  it("wins immediately with a final Swap and never gives the empty hand to the opponent", () => {
    const game = fixture([[black("last","wild-card-swap")],[num("other")]],stock(10));
    const result = play(game,"last",{chosenColor:"blue"});
    expect(result.state.phase).toBe("ended"); expect(result.state.result?.winnerId).toBe("p0");
    expect(result.state.players[0]!.hand).toEqual([]); expect(result.state.players[1]!.hand).toEqual(game.players[1]!.hand);
    expect(result.events.public.some(event=>event.type === "HANDS_SWAPPED")).toBe(false); conserved(game,result.state);
  });
  it.each([{}, {targetPlayerId:"p0"}, {targetPlayerId:"unknown"}])("rejects invalid targets without changing cards: %j", target => {
    const game = setup(); const before = structuredClone(game);
    expect(()=>play(game,"swap",{chosenColor:"red",...target})).toThrow("INVALID_TARGET"); expect(game).toEqual(before);
  });
  it("rejects missing color, extra discard choices, false UNO and out-of-turn commands atomically", () => {
    const game=setup();const before=structuredClone(game);
    expect(()=>play(game,"swap",{targetPlayerId:"p1"})).toThrow("INVALID_COLOR");
    expect(()=>play(game,"swap",{targetPlayerId:"p1",chosenColor:"red",discardCardIds:[]})).toThrow("INVALID_SELECTION");
    expect(()=>play(game,"swap",{targetPlayerId:"p1",chosenColor:"red",declareUno:true})).toThrow("INVALID_UNO_CALL");
    expect(()=>applyExpandedCommand(game,"p1",{type:"PLAY_CARD",cardId:"swap",targetPlayerId:"p0",chosenColor:"blue"})).toThrow("NOT_YOUR_TURN");
    expect(game).toEqual(before);
  });
  it("cannot answer debt or interrupt a mini-game", () => {
    for (const phase of ["draw-stack","up","battle-select","battle-discard","high-five"] as const) {
      const game=setup();game.phase=phase;game.pendingDraw=phase==="draw-stack"?6:0;const before=structuredClone(game);
      expect(()=>play(game,"swap",{targetPlayerId:"p1",chosenColor:"red"})).toThrow(phase==="draw-stack"?"CARD_NOT_PLAYABLE":"INVALID_PHASE");
      expect(game).toEqual(before);expect(getExpandedPlayerView(game,"p0").self.playableCardIds).not.toContain("swap");
    }
  });
  it("can play the newly drawn Swap but cannot play an older card during a drawn-card choice", () => {
    const game=fixture([[num("old"),num("keep")],[num("other")]], [black("drawn","wild-card-swap")]);
    const drawn=applyExpandedCommand(game,"p0",{type:"DRAW_CARD"},seeded(4)).state;
    expect(drawn.phase).toBe("drawn");
    expect(()=>play(drawn,"old")).toThrow("DRAWN_CARD_ONLY");
    const result=play(drawn,"drawn",{targetPlayerId:"p1",chosenColor:"blue"});
    expect(result.state.players[0]!.hand.map(card=>card.id)).toEqual(["other"]);
    expect(result.state.drawnCardId).toBeNull();conserved(game,result.state);
  });
  it("counts a held black Swap as 50 points when another player wins", () => {
    const game=fixture([[num("last")],[black("unplayed","wild-card-swap")]]);
    const result=play(game,"last"); expect(result.state.result?.winnerScore).toBe(50);
  });
});

it("service clocks preserve unfinished choices and reject late swaps", () => {
  let now=0;
  const service=new UnoExpandedGameService("AB12",ids=>{const game=setup(2);game.players.forEach((p,i)=>{p.id=ids[i]!;});return game;},()=>now);
  service.add("a","A");service.add("b","B");service.execute("a",{type:"START_GAME",expectedRoomRevision:service.revision});
  const send=()=>service.execute("a",{type:"GAME_COMMAND",matchId:service.matchId!,expectedRevision:service.game!.revision,command:{type:"PLAY_CARD",cardId:"swap",targetPlayerId:"b",chosenColor:"blue"}});
  now=10000;service.setConnected("b",false);expect(service.nextDeadline).toBeNull();
  now=20000;service.setConnected("b",true);expect(service.nextDeadline).toBe(70000);
  now=70000;expect(send).toThrow("STALE_REVISION");expect(service.game!.discardPile.at(-1)!.id).toBe("top");
  service.advanceTime();expect(service.game!.currentIndex).toBe(1);expect(service.game!.players[0]!.hand[0]!.id).toBe("swap");
});

it("service ends on a final Swap and clears its clock", () => {
  const service=new UnoExpandedGameService("AB12",ids=>{const game=fixture([[black("last","wild-card-swap")],[num("other")]]);game.players.forEach((p,i)=>{p.id=ids[i]!;});return game;},()=>0);
  service.add("a","A");service.add("b","B");service.execute("a",{type:"START_GAME",expectedRoomRevision:service.revision});
  service.execute("a",{type:"GAME_COMMAND",matchId:service.matchId!,expectedRevision:0,command:{type:"PLAY_CARD",cardId:"last",chosenColor:"yellow"}});
  expect(service.status).toBe("ENDED");expect(service.nextDeadline).toBeNull();expect(service.view("a").turnClock).toBeNull();
  expect(service.outcome?.winnerId).toBe("a");
});
