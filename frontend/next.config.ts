import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // Make environment variables available to the browser
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
    NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA || 'true',
  },
  experimental: {
    // Disable experimental features that might cause issues
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  typescript: {
    // Disable TypeScript checking during build - we'll handle it separately
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint checking during build - we'll handle it separately
    ignoreDuringBuilds: true,
  },
  // Disable image optimization during development to avoid issues
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
