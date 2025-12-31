import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@crystal-forge/query-dsl',
    '@crystal-forge/query-validator',
    '@crystal-forge/opensearch-client',
  ],
};

export default nextConfig;
