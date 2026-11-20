import { actingExpandedPlayerId } from "../../../domain/rules/get-effect-view.js";
import type { UnoExpandedGameService } from "../../../application/services/uno-expanded-game.service.js";
import { UnoExpandedRoomSchema, ExpandedMemberSchema } from "../schemas/uno-expanded.schema.js";
export function syncExpandedPublicState(state: UnoExpandedRoomSchema, service: UnoExpandedGameService): void {
  state.roomId = service.roomId; state.revision = service.revision; state.status = service.status;
  state.hostId = service.hostId ?? ""; state.paused = service.paused; state.matchId = service.matchId ?? "";
  state.currentPlayerId = service.game ? actingExpandedPlayerId(service.game) ?? "" : "";
  state.pendingDraw = service.game?.pendingDraw ?? 0;
  state.phase = service.game?.phase ?? ""; state.activeColor = service.game?.activeColor ?? "";
  for (let i = 0; i < service.members.length; i++) {
    const member = service.members[i]!;
    let target = state.members[i];
    if (!target) { target = new ExpandedMemberSchema(); state.members.push(target); }
    target.playerId = member.playerId; target.nickname = member.nickname; target.connected = member.connected;
    target.handCount = service.game?.players.find(player => player.id === member.playerId)?.hand.length ?? 0;
  }
  while (state.members.length > service.members.length) state.members.pop();
}
