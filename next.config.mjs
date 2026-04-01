/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vonds.net',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://platform.twitter.com https://cdn.syndication.twimg.com",
              "style-src 'self' 'unsafe-inline' https://platform.twitter.com",
              "frame-src 'self' https://www.instagram.com https://platform.twitter.com https://syndication.twitter.com https://twitter.com https://www.youtube.com https://www.youtube-nocookie.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https: wss:",
              "font-src 'self' data: https:",
            ].join('; '),
          },
        ],
      },
    ]
  },
}
export default nextConfig
