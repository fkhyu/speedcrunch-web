import type { NextConfig } from "next";

// Disable static export in dev to allow the Next.js dev server to work.
// If you need a static export, set OUTPUT_EXPORT=1 in your build environment
// and re-enable it conditionally below.
const nextConfig: NextConfig = {
  // ...(process.env.OUTPUT_EXPORT ? { output: "export" as const } : {}),
};

export default nextConfig;
