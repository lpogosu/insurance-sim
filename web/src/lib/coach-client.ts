/**
 * Клиент разбора и чата.
 *
 * Роль этого модуля — донести до интерфейса не только текст, но и то, кто его
 * написал. Поле `mode` приходит с сервера и попадает в подпись на экране:
 * подменять разбор от модели разбором из чисел молча — значит вводить
 * читателя в заблуждение относительно того, насколько ответ персонален.
 *
 * Запасного текста здесь нет. Детерминированный разбор живёт на сервере
 * (`@/coach/rules`) и приходит тем же путём, что и любой другой; две копии
 * одних и тех же формулировок разъезжаются на первой же правке.
 */

import type { CoachMode } from '@/coach/types';
import type { GameResults } from '@/engine';
import { getTelegramWebApp } from '@/lib/telegram';

export interface CoachText {
  text: string;
  mode: CoachMode;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Подписанная строка Telegram, если приложение открыто как мини-апп. */
function authHeaders(): Record<string, string> {
  const initData = getTelegramWebApp()?.initData ?? '';
  return initData ? { 'X-Telegram-Init-Data': initData } : {};
}

async function post(path: string, body: unknown): Promise<CoachText> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${path}: ${response.status}`);
  }
  return (await response.json()) as CoachText;
}

export function getAIReview(results: GameResults, playerName: string): Promise<CoachText> {
  return post('/api/review', { playerName, results });
}

export function sendChatMessage(messages: readonly ChatTurn[]): Promise<CoachText> {
  return post('/api/coach', { messages });
}
