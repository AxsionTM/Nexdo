/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [{ protocol: "http", hostname: "localhost" }],
  },
};

module.exports = nextConfig;
