/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  experimental: {
    appDir: true,
    serverActions: true,
  }
}

module.exports = nextConfig
