import { createServer } from "./bootstrap/create-server.js";
import { env } from "./config/env.js";
const server = createServer().listen(env.PORT, () => {
  console.log("MeepleVerse API: http://localhost:" + env.PORT);
});
server.on("error", error => { console.error(error); process.exitCode = 1; });
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    server.close(error => { if (error) { console.error(error); process.exitCode = 1; } });
  });
}
