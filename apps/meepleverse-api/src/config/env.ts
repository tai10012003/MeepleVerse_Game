import "dotenv/config";
import { z } from "zod";
const config = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:9000").transform(
    value => value.split(",").map(origin => origin.trim()).filter(Boolean)
  ).pipe(z.array(z.url()).min(1)),
});
export const env = config.parse(process.env);
