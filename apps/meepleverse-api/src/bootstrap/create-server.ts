import express from "express";
import cors from "cors";
import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";
export function createServer() {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: env.CORS_ORIGINS }));
  app.use(express.json({ limit: "32kb" }));
  app.get("/health", (_req, res) => {
    res.set("Cache-Control", "no-store").json({ status: "ok", service: "meepleverse-api" });
  });
  app.use((_req, res) => { res.status(404).json({ error: "NOT_FOUND" }); });
  const onError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  };
  app.use(onError);
  return app;
}
