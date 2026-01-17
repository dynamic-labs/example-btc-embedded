/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "frame-src 'self' https://app.dynamic-preprod.xyz https://app.dynamic.xyz",
              "connect-src 'self' https://app.dynamic-preprod.xyz https://app.dynamic.xyz https://*.dynamic.xyz https://dynamic-static-assets.com https://logs.dynamicauth.com https://mempool.space https://*.mempool.space",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
            ].join('; '),
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

