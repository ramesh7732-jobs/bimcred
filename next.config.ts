import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin file tracing to this project. Without it Next can infer a parent folder
  // as the workspace root when another lockfile exists higher up the tree.
  outputFileTracingRoot: process.cwd(),
  // The prototype is fully local. No remote image domains are required.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
