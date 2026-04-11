/**
 * Разбор и форматирование результата, присланного из мини-аппа.
 *
 * Telegram доставляет `web_app_data` сам, поэтому отправитель подтверждён.
 * Содержимое — нет: строку собирает страница на устройстве игрока, и ничто
 * не мешает подставить туда что угодно. Поэтому payload проверяется по полям,
 * а числа ограничиваются диапазоном — иначе в чат уходит сообщение с
 * `NaN ₽` или счётом в девять знаков.
 *
 * Модуль чистый: ни сети, ни grammy. Именно он и покрыт тестами.
 */

export interface ShareResult {
  score: number;
  title: string;
  budgetRemaining: number;
  totalSaved: number;
  totalLost: number;
}

const MAX_TITLE_LENGTH = 60;
const MAX_AMOUNT = 100_000_000;

function isFiniteAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= MAX_AMOUNT;
}

/** Вернуть результат либо null, если payload не похож на наш. */
export function parseShareData(raw: string): ShareResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const data = parsed as Record<string, unknown>;
  if (data.type !== 'result') return null;
  if (typeof data.title !== 'string' || data.title.trim().length === 0) return null;
  if (typeof data.score !== 'number' || !Number.isFinite(data.score)) return null;
  if (!isFiniteAmount(data.budgetRemaining)) return null;
  if (!isFiniteAmount(data.totalSaved)) return null;
  if (!isFiniteAmount(data.totalLost)) return null;

  return {
    score: Math.max(0, Math.min(100, Math.round(data.score))),
    title: data.title.trim().slice(0, MAX_TITLE_LENGTH),
    budgetRemaining: Math.round(data.budgetRemaining),
    totalSaved: Math.round(data.totalSaved),
    totalLost: Math.round(data.totalLost),
  };
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

/** Экранирование для parse_mode: 'HTML'. Заголовок приходит от клиента. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>]/g, (char) => ESCAPES[char] ?? char);
}

export function formatMoney(amount: number): string {
  return `${Math.round(amount).toLocaleString('ru-RU').replace(/[\s ]/g, ' ')} ₽`;
}

export function formatShareMessage(result: ShareResult, playerName: string): string {
  const name = escapeHtml(playerName.trim().slice(0, 40)) || 'Игрок';
  return [
    `<b>${name} прошёл РискЛаб</b>`,
    '',
    `Счёт: <b>${result.score} / 100</b> — ${escapeHtml(result.title)}`,
    `Осталось от бюджета: <b>${formatMoney(result.budgetRemaining)}</b>`,
    `Страховки закрыли: ${formatMoney(result.totalSaved)}`,
    `Потеряно без полиса: ${formatMoney(result.totalLost)}`,
  ].join('\n');
}
