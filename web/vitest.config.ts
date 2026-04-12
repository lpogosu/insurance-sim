import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Tailwind обрабатывает CSS только в сборке Next. Тестам стили не нужны,
  // а загрузка postcss.config.mjs здесь роняет прогон целиком.
  css: { postcss: { plugins: [] } },
  test: {
    globals: true,
    // Под тестами только движок, тренер и проверка подписи Telegram —
    // это чистые модули, DOM им не нужен.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
  },
});
