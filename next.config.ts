import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
