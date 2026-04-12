import type { NextConfig } from 'next';

const config: NextConfig = {
  // standalone кладёт в образ только реально импортированные модули —
  // финальный контейнер не тащит devDependencies.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
};

export default config;
