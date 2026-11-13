import { createServer as createHttpServer } from "node:http";
import { Server, matchMaker } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { env } from "../config/env.js";
import { createServer } from "./create-server.js";
import { registerGameRooms } from "./register-game-rooms.js";
import { RoomCodePool } from "../modules/room/infrastructure/room-code-pool.js";
import type { GameFactory } from "../modules/games/uno/application/services/uno-game.service.js";
export interface RealtimeOptions { reconnectSeconds?: number; gameFactory?: GameFactory }
export function createRealtimeServer(options: RealtimeOptions = {}) {
  Reflect.deleteProperty(matchMaker.controller.DEFAULT_CORS_HEADERS, "Access-Control-Allow-Origin");
  matchMaker.controller.getCorsHeaders = (headers): Record<string, string> => {
    const origin = headers.get("origin");
    return origin && env.CORS_ORIGINS.includes(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : { Vary: "Origin" };
  };
  const httpServer = createHttpServer(createServer());
  const transport = new WebSocketTransport({
    server: httpServer, maxPayload: 8192,
    verifyClient: ({ origin }, done) => {
      // Native SDK clients omit Origin; browser clients must match the allowlist.
      done(!origin || env.CORS_ORIGINS.includes(origin), 403, "Origin not allowed");
    },
  });
  const server = new Server({ transport, gracefullyShutdown: false, greet: false });
  registerGameRooms(server, {
    reconnectSeconds: options.reconnectSeconds ?? 30, codes: new RoomCodePool(),
    gameFactory: options.gameFactory,
  });
  return { server, httpServer };
}
