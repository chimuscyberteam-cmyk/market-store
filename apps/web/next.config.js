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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            // We added https://api.cloudinary.com to connect-src
            value: "default-src 'self'; img-src 'self' data: https://res.cloudinary.com https://*.googleusercontent.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.mycampusmarket.shop wss://api.mycampusmarket.shop https://api.cloudinary.com; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
