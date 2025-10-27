/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, {isServer}) => {
    if (!isServer) {
      // Exclude sharp from client-side bundles
      config.resolve.fallback = {
        ...config.resolve.fallback,
        sharp: false,
        'detect-libc': false,
        fs: false,
        child_process: false,
        crypto: false,
      };
    }

    // Handle node: protocol
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:child_process': false,
      'node:crypto': false,
      'node:events': false,
      'node:fs': false,
    };

    return config;
  },
  // Mark sharp as external for server components
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  // Ensure sharp is only used in server environments
  serverExternalPackages: ['sharp'],
};

module.exports = nextConfig;