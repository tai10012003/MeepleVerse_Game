import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  allowedDevOrigins: (process.env.NEXT_DEV_ALLOWED_ORIGINS ?? "").split(",").map(host => host.trim()).filter(Boolean),
};
export default nextConfig;
