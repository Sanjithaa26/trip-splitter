/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  // Disable the error overlay
  devIndicators: false,
  // This won't remove errors but you can try:
  onError: (err) => {
    // Suppress errors in dev (not recommended)
  }
}

export default nextConfig
