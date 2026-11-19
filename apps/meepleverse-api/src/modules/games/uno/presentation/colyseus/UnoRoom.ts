import { roomActionSchema, type RoomAction, type UnoRoomView } from "@meepleverse/contracts/room";
import { UnoGameService, type GameFactory } from "../../application/services/uno-game.service.js";
import { RoomRuleError } from "../../../../room/domain/room.errors.js";
import { UnoRuleError } from "../../domain/errors/uno.errors.js";
import { GameRoom, type RoomTransportSettings } from "../../../../room/presentation/colyseus/GameRoom.js";
import { UnoRoomSchema } from "./schemas/uno.schema.js";
import { syncPublicState } from "./mappers/uno-state.mapper.js";
export interface UnoRoomSettings extends RoomTransportSettings { gameFactory?: GameFactory }
export class UnoRoom extends GameRoom<RoomAction["action"], UnoRoomView, UnoRoomSchema> {
  protected settings!: UnoRoomSettings;
  declare protected service: UnoGameService;
  protected createService(roomId: string) { return new UnoGameService(roomId, this.settings.gameFactory); }
  protected createState() { return new UnoRoomSchema(); }
  protected syncState() { syncPublicState(this.state, this.service); }
  protected parseAction(payload: unknown) {
    const parsed = roomActionSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  }
  protected classifyError(error: unknown): string {
    return error instanceof RoomRuleError || error instanceof UnoRuleError ? error.code : "INTERNAL_ERROR";
  }
}
export function createUnoRoomClass(settings: UnoRoomSettings): typeof UnoRoom {
  return class ConfiguredUnoRoom extends UnoRoom { protected settings = settings; };
}
