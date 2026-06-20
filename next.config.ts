import type { NextConfig } from "next";

import "./src/shared/config/env";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
