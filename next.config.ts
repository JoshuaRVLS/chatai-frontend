import type { NextConfig } from 'next';

// Polyfill broken localStorage in Node environment (SSR)
if (typeof global !== 'undefined') {
  const g = global as any;
  if (!g.localStorage || typeof g.localStorage.getItem !== 'function') {
    console.warn('Patching broken global.localStorage');
    g.localStorage = {
      getItem: () => null,
      setItem: () => { },
      removeItem: () => { },
      clear: () => { },
      length: 0,
      key: () => null,
    };
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['next-auth', 'bcryptjs'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
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
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
