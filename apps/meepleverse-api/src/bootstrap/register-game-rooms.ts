import type { EffectTiming } from "../modules/games/uno-expanded/domain/models/effect-context.js";
import type { Server } from "@colyseus/core";
import { createUnoRoomClass, type UnoRoomSettings } from "../modules/games/uno/presentation/colyseus/UnoRoom.js";
import { createUnoExpandedRoomClass } from "../modules/games/uno-expanded/presentation/colyseus/UnoExpandedRoom.js";
import type { ExpandedGameFactory } from "../modules/games/uno-expanded/application/services/uno-expanded-game.service.js";
export interface GameRoomRegistrySettings extends UnoRoomSettings {
  enableExpandedRooms?: boolean;
  expandedGameFactory?: ExpandedGameFactory;
  expandedEffectTiming?: Partial<EffectTiming>;
}
export function registerGameRooms(server: Server, settings: GameRoomRegistrySettings): void {
  // Keep the existing Basic room name for current clients and saved reconnection tokens.
  server.define("uno", createUnoRoomClass(settings));
  if (settings.enableExpandedRooms === true) {
    server.define("uno-expanded", createUnoExpandedRoomClass({
      reconnectSeconds: settings.reconnectSeconds, codes: settings.codes, gameFactory: settings.expandedGameFactory, effectTiming: settings.expandedEffectTiming,
    }));
  }
}
