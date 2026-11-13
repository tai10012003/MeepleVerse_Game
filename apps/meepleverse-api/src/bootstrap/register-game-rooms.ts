import type { Server } from "@colyseus/core";
import { createUnoRoomClass, type UnoRoomSettings } from "../modules/games/uno/presentation/colyseus/UnoRoom.js";
export function registerGameRooms(server: Server, settings: UnoRoomSettings): void {
  server.define("uno", createUnoRoomClass(settings));
}
