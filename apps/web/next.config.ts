import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * `output: "standalone"` is required for Docker/Cloud Run images.
 * On Windows without Developer Mode, Next.js fails creating symlinks during
 * standalone tracing — so we enable it only when explicitly requested.
 */
const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@ordra/ui", "@ordra/types", "@ordra/utils", "@ordra/validation"],
};

export default nextConfig;
