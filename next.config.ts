import type { NextConfig } from "next";

// Static export for GitHub Pages. A project site lives under /<repo>, so the
// deploy workflow passes that prefix in; locally it is empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  // One render worker shares the fetch cache and keeps requests to the club's WordPress host gentle.
  experimental: { cpus: 1 },
};

export default nextConfig;
