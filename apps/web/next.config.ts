import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@crystal-forge/query-dsl',
    '@crystal-forge/query-validator',
    '@crystal-forge/opensearch-client',
  ],
};

export default nextConfig;
