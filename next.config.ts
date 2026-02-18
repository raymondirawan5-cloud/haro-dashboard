import type { NextConfig } from "next";

const rawAssetPrefix = process.env.HARO_ASSET_PREFIX || "";
const assetPrefix = rawAssetPrefix && rawAssetPrefix !== "/"
  ? rawAssetPrefix.replace(/\/$/, "")
  : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  assetPrefix,
};

export default nextConfig;
