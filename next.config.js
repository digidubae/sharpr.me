/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase the default keep-alive timeout
  serverOptions: {
    keepAliveTimeout: 60000, // 60 seconds
  },
  // Enable HTTP keep-alive
  experimental: {
    keepAlive: true,
  },
}

module.exports = nextConfig 