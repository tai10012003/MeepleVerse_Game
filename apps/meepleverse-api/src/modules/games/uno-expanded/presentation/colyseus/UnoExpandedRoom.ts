import type { EffectTiming } from "../../domain/models/effect-context.js";
import { unoExpandedRoomActionSchema, type UnoExpandedRoomAction, type UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import { GameRoom, type RoomTransportSettings } from "../../../../room/presentation/colyseus/GameRoom.js";
import { UnoExpandedRuleError } from "../../domain/errors/uno-expanded.errors.js";
import { UnoExpandedGameService, type ExpandedGameFactory } from "../../application/services/uno-expanded-game.service.js";
import { UnoExpandedRoomSchema } from "./schemas/uno-expanded.schema.js";
import { syncExpandedPublicState } from "./mappers/uno-expanded-state.mapper.js";
export interface UnoExpandedRoomSettings extends RoomTransportSettings { gameFactory?: ExpandedGameFactory; effectTiming?: Partial<EffectTiming> }
export class UnoExpandedRoom extends GameRoom<UnoExpandedRoomAction["action"], UnoExpandedRoomView, UnoExpandedRoomSchema> {
  protected settings!: UnoExpandedRoomSettings;
  declare protected service: UnoExpandedGameService;
  protected createService(roomId: string) { return new UnoExpandedGameService(roomId, this.settings.gameFactory, Date.now, this.settings.effectTiming); }
  private timer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  protected onPublished(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const deadline = this.service.nextDeadline;
    if (this.disposed || deadline === null) return;
    const matchId = this.service.matchId;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.disposed || this.service.matchId !== matchId || this.service.nextDeadline !== deadline) return;
      try {
        const transition = this.service.advanceTime();
        if (transition) { this.publish(); this.broadcastEvents(transition); }
        else this.onPublished();
      } catch (error) { console.error("Expanded effect timer failed", error); }
    }, Math.max(0, deadline - Date.now()));
  }
  onDispose(): void {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    super.onDispose();
  }
  protected createState() { return new UnoExpandedRoomSchema(); }
  protected syncState() { syncExpandedPublicState(this.state, this.service); }
  protected parseAction(payload: unknown) {
    const parsed = unoExpandedRoomActionSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  }
  protected classifyError(error: unknown): string { return error instanceof UnoExpandedRuleError ? error.code : "INTERNAL_ERROR"; }
}
export function createUnoExpandedRoomClass(settings: UnoExpandedRoomSettings): typeof UnoExpandedRoom {
  return class ConfiguredUnoExpandedRoom extends UnoExpandedRoom { protected settings = settings; };
}
