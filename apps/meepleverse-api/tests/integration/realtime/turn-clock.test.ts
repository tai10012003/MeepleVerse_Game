import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { Client, type Room } from "@colyseus/sdk";
import type { UnoRoomView, RoomActionReply } from "@meepleverse/contracts/room";
import type { UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import { createRealtimeServer } from "../../../src/bootstrap/create-realtime-server.js";
import { fixture, number, action } from "../../unit/uno/fixtures.js";
import { fixture as expandedFixture } from "../../unit/uno-expanded/fixtures.js";
import { waitFor } from "./helpers.js";
type View = UnoRoomView | UnoExpandedRoomView;
for (const name of ["uno", "uno-expanded"]) describe(`${name} WebSocket deadlines`, () => {
  it.each(["pass", "debt", "pause"])("publishes server-driven %s transitions consistently to both clients", async mode => {
    const make = () => fixture([[action("two","draw-two"),number("a"),number("a2")],[number("b"),number("b2")]],Array.from({length:20},(_,i)=>number("stock-"+i)));
    const runtime = createRealtimeServer({ turnTiming:{turnMs:600,upMs:400}, reconnectSeconds:2,
      gameFactory:ids=>{const g=make();g.players.forEach((p,i)=>{p.id=ids[i]!;});return g;},
      expandedGameFactory:ids=>{const source=make();const g=expandedFixture(source.players.map(p=>p.hand),source.drawPile);g.players.forEach((p,i)=>{p.id=ids[i]!;});return g;} });
    const rooms:Room[]=[];
    await runtime.server.listen(0,"127.0.0.1");const address=runtime.httpServer.address();if(!address||typeof address==="string")throw new Error("No server");const sdk=new Client("http://127.0.0.1:"+address.port);
    const views:Array<View|undefined>=[];
    async function attach(room:Room, index:number) {rooms.push(room);room.reconnection.enabled=false;room.onMessage("room_view",(view:View)=>{views[index]=view;});room.onMessage("game_events",()=>{});room.send("get_view");await waitFor(()=>views[index]);return room;}
    async function send(room:Room,action:unknown) {const requestId=randomUUID();let reply:RoomActionReply|undefined;const off=room.onMessage("action_reply",(value:RoomActionReply)=>{if(value.requestId===requestId)reply=value;});room.send("action",{requestId,action});const result=await waitFor(()=>reply);off();expect(result.ok).toBe(true);}
    try {
      const a=await attach(await sdk.create(name,{nickname:"A"}),0);let b=await attach(await sdk.joinById(a.roomId,{nickname:"B"}),1);
      a.send("get_view");await waitFor(()=>views[0]?.members.length===2);
      await send(a,{type:"START_GAME",expectedRoomRevision:views[0]!.revision});await waitFor(()=>views[0]?.game);
      const match=views[0]!.matchId; const deadline=views[0]!.turnClock!.deadline;
      expect(views[0]!.turnClock!.durationMs).toBe(600);
      if(mode==="debt") {
        await send(a,{type:"GAME_COMMAND",matchId:match,expectedRevision:0,command:{type:"PLAY_CARD",cardId:"two"}});
        await waitFor(()=>views[1]?.game?.pendingDraw===2);
        await waitFor(()=>views[0]?.game?.pendingDraw===0 && views[0]?.game?.revision===2);
        expect(views[1]!.game!.self.hand).toHaveLength(4);
      } else if(mode==="pause") {
        const token=b.reconnectionToken;b.connection.close();
        await waitFor(()=>views[0]?.paused);
        expect(views[0]!.turnClock!.deadline).toBeNull();const remaining=views[0]!.turnClock!.remainingMs;
        await new Promise(resolve=>setTimeout(resolve,700));expect(views[0]!.game!.revision).toBe(0);
        b=await sdk.reconnect(token);await attach(b,1);await waitFor(()=>!views[0]?.paused);
        expect(views[0]!.turnClock!.deadline!).toBeGreaterThan(deadline!);
        expect(views[0]!.turnClock!.remainingMs).toBeLessThanOrEqual(remaining);
        await waitFor(()=>views[0]?.game?.revision===1);
      } else await waitFor(()=>views[0]?.game?.revision===1);
      await waitFor(()=>views[1]?.game?.revision===views[0]?.game?.revision);
      expect(views[0]!.turnClock!.deadline).toBe(views[1]!.turnClock!.deadline);
      expect(views[0]!.game!.currentPlayerId).toBe(views[1]!.game!.currentPlayerId);
      expect(views[0]!.matchId).toBe(match);
    } finally { await Promise.all(rooms.filter(room=>room.connection.isOpen).map(room=>room.leave()));await runtime.server.gracefullyShutdown(false); }
  });
});
