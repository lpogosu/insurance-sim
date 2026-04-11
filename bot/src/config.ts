/**
 * Конфигурация бота.
 *
 * Токен обязателен: без него бот не «работает в ограниченном режиме», он не
 * работает вовсе, и падение на старте честнее, чем процесс, который молча
 * ничего не делает.
 */

export interface BotConfig {
  token: string;
  webAppUrl: string;
}

export class ConfigError extends Error {}

export function readConfig(env: Record<string, string | undefined>): BotConfig {
  const token = env.BOT_TOKEN?.trim() ?? '';
  if (!token) {
    throw new ConfigError('BOT_TOKEN не задан: получите токен у @BotFather');
  }

  const webAppUrl = env.WEB_APP_URL?.trim() ?? '';
  if (!webAppUrl) {
    throw new ConfigError('WEB_APP_URL не задан: это адрес, на котором развёрнут веб-клиент');
  }
  // Telegram открывает мини-апп только по https: http-адрес кнопка примет,
  // а клиент молча откажется загружать.
  if (!webAppUrl.startsWith('https://')) {
    throw new ConfigError('WEB_APP_URL должен начинаться с https:// — этого требует Telegram');
  }

  return { token, webAppUrl };
}
