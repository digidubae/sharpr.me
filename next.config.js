/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure server runtime
  experimental: {
    serverActions: {
      // Increase timeout for server actions
      bodySizeLimit: '10mb',
      allowedOrigins: ['*'],
    },
  },
}

module.exports = nextConfig 