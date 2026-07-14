import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project directory. Without this, Next.js
  // auto-detects a root by walking up looking for lockfiles, which can land
  // on a parent directory and cause it to watch far more of the filesystem
  // than needed — this is what caused the EACCES watcher warnings.
  // (Using process.cwd() instead of __dirname since next.config.ts is
  // loaded as an ES module here, where __dirname isn't defined.)
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
