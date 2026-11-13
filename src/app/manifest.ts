import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BetterThoughts - Diário Terapêutico',
    short_name: 'BetterThoughts',
    description: 'Diário terapêutico mobile-first com questionamento socrático via IA',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F5F0',
    theme_color: '#F7F5F0',
    orientation: 'portrait',
    icons: [
      {
        src: '/pwa-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
