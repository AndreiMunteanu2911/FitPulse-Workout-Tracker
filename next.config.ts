import type { NextConfig } from "next";
import { getAndroidDevHost, isProductionAppEnv } from "./config/app-env";

const allowedDevOrigins = isProductionAppEnv() ? [] : [getAndroidDevHost(), "10.0.2.2"];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.exercisedb.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "qcywxceqsopfxpoukaxn.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
