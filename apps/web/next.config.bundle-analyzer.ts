/**
 * Bundle Analyzer Configuration
 *
 * Usage:
 * ANALYZE=true npm run build
 *
 * This will generate a bundle analysis report after building
 * showing which dependencies are taking up space
 *
 * Reference: https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer
 */

import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer;
