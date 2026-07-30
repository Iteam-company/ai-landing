import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";

// EasyLand build mode — self-detecting, so a plain `npm run build` always works
// (no env needed, even on a deploy host where .env.local is absent):
//   • A backend client KEEPS app/api (Business Calendar / Customers / lead intake)
//     → Node server build (output: "standalone") so the route handlers run.
//   • A static client has app/api pruned by the CLI → static export (output: "export").
//     Its contact form posts straight to the n8n webhook instead.
// EASYLAND_BACKEND=1 can still force the server build explicitly.
const backend =
  process.env.EASYLAND_BACKEND === "1" || existsSync(join(process.cwd(), "app", "api"));

const nextConfig: NextConfig = {
  output: backend ? "standalone" : "export",
  images: {
    unoptimized: true,
  },
  // trailingSlash:true would 308-redirect POST /api/* and drop the body, so the
  // server build turns it off; static builds keep the original behaviour.
  trailingSlash: !backend,
  env: {
    // Mirrors the flag above so lib/lang.ts can build locale URLs ("/en" vs
    // "/en/") that hit the right one directly instead of taking a 308.
    NEXT_PUBLIC_TRAILING_SLASH: backend ? "" : "1",
  },
};

export default nextConfig;
