import type { NextConfig } from "next";

const rawBasePath = process.env.HARO_BASE_PATH || "";
const basePath = rawBasePath && rawBasePath !== "/"
  ? rawBasePath.replace(/\/$/, "")
  : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath,
};

export default nextConfig;
