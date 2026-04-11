import { createBot } from './bot';
import { ConfigError, readConfig } from './config';

function main(): void {
  let config;
  try {
    config = readConfig(process.env);
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }

  const bot = createBot(config);

  process.once('SIGINT', () => void bot.stop());
  process.once('SIGTERM', () => void bot.stop());

  void bot.start({
    onStart: (info) => console.error(`Бот @${info.username} запущен`),
  });
}

main();
