import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    
    // Handle Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false
      };
    }
    
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
