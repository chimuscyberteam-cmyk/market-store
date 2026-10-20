/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // This Content Security Policy allows your own domain, Cloudinary for images, and Render for API calls.
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' data: https://res.cloudinary.com https://*.googleusercontent.com; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://market-store-api.onrender.com wss://market-store-api.onrender.com;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
