/**
 * Сборка бота. Здесь только проводка: тексты в `messages`, разбор payload в
 * `share`, состояние в `leaderboard` — и всё это проверяется тестами без сети.
 */

import { Bot, InlineKeyboard } from 'grammy';
import type { BotConfig } from './config';
import { Leaderboard } from './leaderboard';
import { ABOUT, HELP, PERSONAL_BEST, START, leaderboardMessage } from './messages';
import { formatShareMessage, parseShareData } from './share';

export function createBot(config: BotConfig, leaderboard = new Leaderboard()): Bot {
  const bot = new Bot(config.token);
  const playButton = (): InlineKeyboard => new InlineKeyboard().webApp('Играть', config.webAppUrl);

  bot.command('start', (ctx) => ctx.reply(START, { reply_markup: playButton() }));
  bot.command('help', (ctx) => ctx.reply(HELP));
  bot.command('about', (ctx) => ctx.reply(ABOUT));
  bot.command('leaderboard', (ctx) =>
    ctx.reply(leaderboardMessage(leaderboard.top()), { parse_mode: 'HTML' }),
  );

  bot.on('message:web_app_data', async (ctx) => {
    const result = parseShareData(ctx.message.web_app_data.data);
    if (!result) {
      // Не ругаемся на пользователя: он этого сообщения не писал.
      return;
    }

    const user = ctx.from;
    const name = user?.first_name ?? 'Игрок';
    const improved =
      user !== undefined &&
      leaderboard.submit({ userId: user.id, name, score: result.score, title: result.title });

    const text = formatShareMessage(result, name);
    await ctx.reply(improved ? `${text}\n\n${PERSONAL_BEST}` : text, {
      parse_mode: 'HTML',
      reply_markup: playButton(),
    });
  });

  bot.catch((error) => {
    // Одно упавшее обновление не должно останавливать polling.
    console.error('Ошибка обработки обновления:', error.message);
  });

  return bot;
}
