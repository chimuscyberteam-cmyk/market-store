export default function manifest() {
  return {
    name: 'Market Store — Mulungushi University',
    short_name: 'Market Store',
    description: 'Buy and sell on campus. Delivery in minutes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2f4f7',
    theme_color: '#059669',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ]
  };
}
