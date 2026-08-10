import type { NextConfig } from "next";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, "../..");

/**
 * Load KEY=VALUE pairs from a dotenv file into process.env without overriding
 * values that are already set (so apps/web/.env.local wins over root .env).
 */
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

// Monorepo-friendly: root .env then app-local overrides via Next's own loader.
loadEnvFile(path.join(monorepoRoot, ".env"));
loadEnvFile(path.join(monorepoRoot, ".env.local"));

/**
 * `output: "standalone"` is required for Docker/Cloud Run images.
 * Enable with DOCKER_BUILD=1.
 */
const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
  reactStrictMode: true,
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ["@ordra/ui", "@ordra/types", "@ordra/utils", "@ordra/validation"],
};

export default nextConfig;
