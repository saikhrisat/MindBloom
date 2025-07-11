import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // typedRoutes: true, // If you want to use typed routes, uncomment this
  },
  // This is not needed as Geist is handled by next/font
  // webpack: (config) => {
  //   config.module.rules.push({
  //     test: /\.(woff|woff2|eot|ttf|otf)$/i,
  //     type: 'asset/resource',
  //   });
  //   return config;
  // },
};

export default nextConfig;
