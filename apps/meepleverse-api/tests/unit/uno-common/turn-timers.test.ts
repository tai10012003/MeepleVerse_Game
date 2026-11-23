import { describe, expect, it } from "vitest";
import { UnoGameService } from "../../../src/modules/games/uno/application/services/uno-game.service.js";
import { UnoExpandedGameService } from "../../../src/modules/games/uno-expanded/application/services/uno-expanded-game.service.js";
import { fixture as basicFixture, number, action, wild } from "../uno/fixtures.js";
import { fixture as expandedFixture, num, black, stock } from "../uno-expanded/fixtures.js";
import type { UnoCommand } from "@meepleverse/contracts/uno";
function setup(edition: "basic" | "expanded", mode = "normal") {
  let now = 1000;
  const base = () => basicFixture([[mode === "skip" ? action("a", "skip") : mode === "four" ? wild("a", "wild-draw-four") : number("a"), number("keep", "blue", 1), number("keep2", "green", 2)], [number("b", "yellow", 3), number("b2", "green", 4)]], Array.from({ length: 30 }, (_, i) => number("stock-"+i)));
  const service = edition === "basic" ? new UnoGameService("AB12", ids => { const game = base(); game.players.forEach((p,i) => { p.id=ids[i]!; }); return game; }, () => now)
    : new UnoExpandedGameService("AB12", ids => { const source=base(); const game=expandedFixture(source.players.map(p=>p.hand), source.drawPile, source.discardPile[0]); game.players.forEach((p,i)=>{p.id=ids[i]!;}); return game; }, () => now);
  service.add("a", "A"); service.add("b", "B");
  const start = () => service.execute("a", { type: "START_GAME", expectedRoomRevision: service.revision }); start();
  const send = (actor: string, command: UnoCommand) => service.execute(actor, { type: "GAME_COMMAND", matchId: service.matchId!, expectedRevision: service.game!.revision, command });
  return { service, send, start, setNow: (value:number)=>{now=value;} };
}
for (const edition of ["basic", "expanded"] as const) describe(`${edition} authoritative turn clock`, () => {
  it("starts at 60 seconds and passes without drawing exactly at the deadline, once", () => {
    const {service:s,setNow}=setup(edition); const before=structuredClone(s.game);
    expect(s.view("a").turnClock).toMatchObject({ playerId:"a",kind:"turn",durationMs:60000,deadline:61000 });
    setNow(60999); expect(s.advanceTime()).toBeNull(); setNow(61000); expect(s.advanceTime()).not.toBeNull();
    expect(s.game!.currentIndex).toBe(1); expect(s.game!.players).toEqual(before!.players); expect(s.game!.drawPile).toEqual(before!.drawPile);
    expect(s.game!.revision).toBe(1); expect(s.advanceTime()).toBeNull(); expect(s.nextDeadline).toBe(121000);
  });
  it("does not reset the deadline when a playable card is drawn; timeout keeps it and passes", () => {
    const {service:s,send,setNow}=setup(edition); setNow(21000); send("a",{type:"DRAW_CARD"});
    expect(s.game!.phase).toBe("drawn"); expect(s.nextDeadline).toBe(61000); const hand=structuredClone(s.game!.players[0]!.hand);
    setNow(61000); s.advanceTime(); expect(s.game!.phase).toBe("turn"); expect(s.game!.currentIndex).toBe(1); expect(s.game!.players[0]!.hand).toEqual(hand);
  });
  it("freezes once across multiple disconnected players and resumes the remaining time", () => {
    const {service:s,setNow}=setup(edition); setNow(11000); s.setConnected("b",false);
    expect(s.nextDeadline).toBeNull(); expect(s.view("a").turnClock).toMatchObject({deadline:null,remainingMs:50000});
    setNow(51000); s.setConnected("a",false); expect(s.advanceTime()).toBeNull(); s.setConnected("b",true); expect(s.nextDeadline).toBeNull();
    setNow(71000); s.setConnected("a",true); expect(s.nextDeadline).toBe(121000); expect(s.view("a").turnClock?.remainingMs).toBe(50000);
  });
  it("starts a fresh turn after Skip returns to the same player", () => {
    const {service:s,send,setNow}=setup(edition,"skip"); const id=s.view("a").turnClock!.id;
    setNow(21000); send("a",{type:"PLAY_CARD",cardId:"a"}); expect(s.game!.currentIndex).toBe(0); expect(s.nextDeadline).toBe(81000); expect(s.view("a").turnClock!.id).not.toBe(id);
  });
  it("rejects a packet after expiry even when the timer callback has not run yet", () => {
    const {service:s,send,setNow}=setup(edition); setNow(61000); const before=structuredClone(s.game);
    expect(()=>send("a",{type:"PLAY_CARD",cardId:"a"})).toThrow("STALE_REVISION"); expect(s.game).toEqual(before);
  });
  it("does not extend time on invalid actions or read-only snapshots", () => {
    const {service:s,send,setNow}=setup(edition); setNow(16000);
    expect(()=>send("b",{type:"DRAW_CARD"})).toThrow("NOT_YOUR_TURN"); s.view("a"); s.view("b"); expect(s.nextDeadline).toBe(61000);
  });
  it("accepts accumulated debt automatically instead of skipping it", () => {
    const {service:s,send,setNow}=setup(edition,"four"); send("a",{type:"PLAY_CARD",cardId:"a",...(edition==="expanded"?{chosenColor:"red" as const}:{})});
    expect(s.game!.pendingDraw).toBe(4); setNow(61000); s.advanceTime(); expect(s.game!.pendingDraw).toBe(0); expect(s.game!.players[1]!.hand).toHaveLength(6);
    if(edition==="basic") expect(s.game!.phase).toBe("penalty-color"); else expect(s.game!.currentIndex).toBe(0);
  });
  it("clears clocks on departure and starts a new match without reusing the old clock", () => {
    const {service:s,setNow}=setup(edition); const match=s.matchId; s.leave("b",false); expect(s.nextDeadline).toBeNull(); expect(s.view("a").turnClock).toBeNull();
    setNow(100000); expect(s.advanceTime()).toBeNull(); expect(s.matchId).toBe(match);
  });
});
it("Basic automatically chooses a remaining-hand color after +4's author times out",()=>{
 const {service:s,send,setNow}=setup("basic","four"); send("a",{type:"PLAY_CARD",cardId:"a"}); send("b",{type:"ACCEPT_DRAW_PENALTY"});
 expect(s.game!.phase).toBe("penalty-color"); setNow(61000); s.advanceTime(); expect(s.game!.phase).toBe("turn"); expect(s.game!.activeColor).toBe("green"); expect(s.nextDeadline).toBe(121000);
});
it("rematch has a fresh 60-second clock and does not trigger the previous deadline",()=>{
 let now=0; const s=new UnoGameService("AB12",ids=>{const g=basicFixture([[number("last")],[number("b")]]);g.players.forEach((p,i)=>{p.id=ids[i]!;});return g;},()=>now);
 s.add("a","A");s.add("b","B");s.execute("a",{type:"START_GAME",expectedRoomRevision:s.revision}); const first=s.matchId;
 s.execute("a",{type:"GAME_COMMAND",matchId:first!,expectedRevision:0,command:{type:"PLAY_CARD",cardId:"last"}});expect(s.nextDeadline).toBeNull();
 now=10000;s.execute("a",{type:"START_GAME",expectedRoomRevision:s.revision});expect(s.matchId).not.toBe(first);expect(s.nextDeadline).toBe(70000);now=60000;expect(s.advanceTime()).toBeNull();
});
it("Expanded Up gets 30 seconds, automatically answers and applies omitted UNO",()=>{
 let now=0; const s=new UnoExpandedGameService("AB12",ids=>{const g=expandedFixture([[black("up","wild-up"),num("keep","blue")],[num("reply","red",5),num("stay","green",2)],[num("third","blue",8)]],stock(20));g.players.forEach((p,i)=>{p.id=ids[i]!;});return g;},()=>now);
 for(const id of ["a","b","c"])s.add(id,id);s.execute("a",{type:"START_GAME",expectedRoomRevision:s.revision});
 s.execute("a",{type:"GAME_COMMAND",matchId:s.matchId!,expectedRevision:0,command:{type:"PLAY_CARD",cardId:"up",chosenColor:"red",declareUno:true}});
 expect(s.view("a").turnClock).toMatchObject({kind:"up",durationMs:30000,playerId:"b",deadline:30000}); now=30000;
 const transition=s.advanceTime()!;expect(transition.events.public).toContainEqual({type:"UNO_PENALTY",playerId:"b"});expect(s.game!.players[1]!.hand).toHaveLength(3);expect(s.game!.players[1]!.hand.some(card=>card.id==="reply")).toBe(false);
 expect(s.view("a").turnClock).toMatchObject({kind:"up",playerId:"c",deadline:60000});
});
