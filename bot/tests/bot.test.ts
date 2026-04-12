import { describe, expect, it } from 'vitest';
import { ConfigError, readConfig } from '../src/config';
import { Leaderboard } from '../src/leaderboard';
import { EMPTY_LEADERBOARD, leaderboardMessage } from '../src/messages';
import { escapeHtml, formatShareMessage, parseShareData } from '../src/share';

const RESULT = {
  type: 'result',
  score: 74,
  title: 'Умный игрок',
  budgetRemaining: 21500,
  totalSaved: 18000,
  totalLost: 6500,
};

describe('конфигурация', () => {
  it('без токена бот не запускается', () => {
    expect(() => readConfig({ WEB_APP_URL: 'https://example.org' })).toThrow(ConfigError);
  });

  it('без адреса мини-аппа бот не запускается', () => {
    expect(() => readConfig({ BOT_TOKEN: '123:abc' })).toThrow(ConfigError);
  });

  it('http-адрес отвергается: Telegram откроет мини-апп только по https', () => {
    expect(() => readConfig({ BOT_TOKEN: '123:abc', WEB_APP_URL: 'http://example.org' })).toThrow(
      /https/,
    );
  });

  it('корректное окружение читается целиком', () => {
    expect(readConfig({ BOT_TOKEN: ' 123:abc ', WEB_APP_URL: ' https://example.org ' })).toEqual({
      token: '123:abc',
      webAppUrl: 'https://example.org',
    });
  });
});

describe('разбор результата из мини-аппа', () => {
  it('принимает корректный payload и округляет числа', () => {
    const parsed = parseShareData(JSON.stringify({ ...RESULT, score: 74.6 }));
    expect(parsed).toEqual({
      score: 75,
      title: 'Умный игрок',
      budgetRemaining: 21500,
      totalSaved: 18000,
      totalLost: 6500,
    });
  });

  it('отвергает не-JSON', () => {
    expect(parseShareData('не json')).toBeNull();
  });

  it('отвергает чужой тип сообщения', () => {
    expect(parseShareData(JSON.stringify({ ...RESULT, type: 'ping' }))).toBeNull();
  });

  it('отвергает NaN и Infinity вместо суммы', () => {
    expect(parseShareData(JSON.stringify({ ...RESULT, budgetRemaining: null }))).toBeNull();
    expect(parseShareData('{"type":"result","score":1,"title":"x","budgetRemaining":1e400,"totalSaved":0,"totalLost":0}')).toBeNull();
  });

  it('отвергает пустой заголовок', () => {
    expect(parseShareData(JSON.stringify({ ...RESULT, title: '   ' }))).toBeNull();
  });

  it('зажимает счёт в диапазон 0..100', () => {
    expect(parseShareData(JSON.stringify({ ...RESULT, score: 900 }))?.score).toBe(100);
    expect(parseShareData(JSON.stringify({ ...RESULT, score: -5 }))?.score).toBe(0);
  });

  it('обрезает слишком длинный заголовок', () => {
    const long = 'о'.repeat(200);
    expect(parseShareData(JSON.stringify({ ...RESULT, title: long }))?.title).toHaveLength(60);
  });
});

describe('форматирование сообщения', () => {
  it('содержит счёт и суммы', () => {
    const parsed = parseShareData(JSON.stringify(RESULT))!;
    const text = formatShareMessage(parsed, 'Лиза');
    expect(text).toContain('74 / 100');
    expect(text).toContain('21 500 ₽');
    expect(text).toContain('Лиза');
  });

  it('экранирует разметку в имени и заголовке', () => {
    const parsed = parseShareData(JSON.stringify({ ...RESULT, title: '<b>взлом</b>' }))!;
    const text = formatShareMessage(parsed, '<script>');
    expect(text).not.toContain('<script>');
    expect(text).toContain('&lt;script&gt;');
    expect(text).toContain('&lt;b&gt;взлом&lt;/b&gt;');
  });

  it('пустое имя заменяется на нейтральное', () => {
    const parsed = parseShareData(JSON.stringify(RESULT))!;
    expect(formatShareMessage(parsed, '   ')).toContain('Игрок');
  });

  it('escapeHtml трогает только три символа', () => {
    expect(escapeHtml('a&b<c>d"e\'f')).toBe('a&amp;b&lt;c&gt;d"e\'f');
  });
});

describe('таблица лидеров', () => {
  const entry = (userId: number, score: number, name = `Игрок${userId}`) => ({
    userId,
    name,
    score,
    title: 'Умный игрок',
  });

  it('первый результат игрока принимается', () => {
    const board = new Leaderboard();
    expect(board.submit(entry(1, 50))).toBe(true);
    expect(board.size).toBe(1);
  });

  it('результат хуже прошлого не перезаписывает рекорд', () => {
    const board = new Leaderboard();
    board.submit(entry(1, 80));
    expect(board.submit(entry(1, 40))).toBe(false);
    expect(board.top()[0].score).toBe(80);
  });

  it('равный результат не считается новым рекордом', () => {
    const board = new Leaderboard();
    board.submit(entry(1, 60));
    expect(board.submit(entry(1, 60))).toBe(false);
  });

  it('топ отсортирован по убыванию счёта', () => {
    const board = new Leaderboard();
    board.submit(entry(1, 30));
    board.submit(entry(2, 90));
    board.submit(entry(3, 60));
    expect(board.top().map((e) => e.score)).toEqual([90, 60, 30]);
  });

  it('при равном счёте порядок устойчив и не зависит от порядка вставки', () => {
    const first = new Leaderboard();
    first.submit(entry(1, 50, 'Борис'));
    first.submit(entry(2, 50, 'Анна'));
    const second = new Leaderboard();
    second.submit(entry(2, 50, 'Анна'));
    second.submit(entry(1, 50, 'Борис'));
    expect(first.top().map((e) => e.name)).toEqual(second.top().map((e) => e.name));
  });

  it('вместимость ограничена: худший вытесняется', () => {
    const board = new Leaderboard(3);
    board.submit(entry(1, 10));
    board.submit(entry(2, 20));
    board.submit(entry(3, 30));
    board.submit(entry(4, 40));
    expect(board.size).toBe(3);
    expect(board.top().map((e) => e.score)).toEqual([40, 30, 20]);
  });

  it('нулевая вместимость запрещена', () => {
    expect(() => new Leaderboard(0)).toThrow();
  });

  it('пустая таблица объясняет, что делать', () => {
    expect(leaderboardMessage([])).toBe(EMPTY_LEADERBOARD);
  });

  it('сообщение предупреждает, что список не переживает перезапуск', () => {
    expect(leaderboardMessage([entry(1, 70)])).toContain('перезапуске');
  });
});
