import { createRealtimeServer } from "./bootstrap/create-realtime-server.js";
import { env } from "./config/env.js";
const { server } = createRealtimeServer();
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  try { await server.gracefullyShutdown(false); }
  catch (error) { console.error(error); process.exitCode = 1; }
}
for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => { void stop(); });
try {
  await server.listen(env.PORT);
  console.log("MeepleVerse HTTP + Colyseus: http://localhost:" + env.PORT);
} catch (error) { console.error(error); process.exitCode = 1; await stop(); }
