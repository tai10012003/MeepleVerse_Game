import type { UnoGameService } from "../../../application/services/uno-game.service.js";
import { MemberSchema, UnoRoomSchema } from "../schemas/uno.schema.js";
export function syncPublicState(state: UnoRoomSchema, service: UnoGameService): void {
  state.roomId = service.roomId; state.revision = service.revision; state.status = service.status;
  state.hostId = service.hostId ?? ""; state.paused = service.paused; state.matchId = service.matchId ?? "";
  state.currentPlayerId = service.status === "PLAYING" ? service.game!.players[service.game!.currentIndex]!.id : "";
  state.activeColor = service.game?.activeColor ?? "";
  // At most four seats; preserve schema identities to keep patches small.
  for (let i = 0; i < service.members.length; i++) {
    const member = service.members[i]!;
    let target = state.members[i];
    if (!target) { target = new MemberSchema(); state.members.push(target); }
    target.playerId = member.playerId; target.nickname = member.nickname; target.connected = member.connected;
    target.handCount = service.game?.players.find(player => player.id === member.playerId)?.hand.length ?? 0;
  }
  while (state.members.length > service.members.length) state.members.pop();
}
