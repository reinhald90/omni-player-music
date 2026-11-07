/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'yt3.ggpht.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['yt-search', 'cheerio'],
  },
  async headers() {
    return [
      {
        // 🛡️ Security Headers Global (Cegah Clickjacking, MIME Sniffing, dll)
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ],
      },
      {
        // 🛡️ Hapus '*' di API. Hanya izinkan request dari domain kamu sendiri.
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://omniplayermusic.web.id' }, // Sesuaikan dengan domain asli kamu
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Range' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
