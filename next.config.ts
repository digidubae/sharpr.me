import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  env: {
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
  }
};

export default nextConfig;
