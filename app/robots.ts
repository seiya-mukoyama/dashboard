import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
    host: 'https://dashboard-7rky.vercel.app',
  }
}
