import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: ['192.168.0.165', 'localhost:3000'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any, 
};

export default nextConfig;