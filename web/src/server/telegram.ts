/**
 * Проверка подписи Telegram Mini App (initData).
 *
 * Мини-апп отдаёт клиенту строку `initData` — обычный query string, который
 * Telegram подписал HMAC-ом от токена бота. В хакатонной версии сервер читал
 * `initDataUnsafe.user` и верил ему: имя в поле «Unsafe» стоит не просто так,
 * подделать эту строку может кто угодно с curl. Проверка целиком локальная —
 * ни одного запроса к Bot API, — поэтому её можно и нужно покрыть тестами:
 * достаточно любого токена, настоящий не требуется.
 *
 * Алгоритм из документации Telegram Web Apps:
 * 1. вынуть параметр `hash`;
 * 2. остальные пары отсортировать по ключу, склеить как `key=value` через \n;
 * 3. secret = HMAC-SHA256(key = "WebAppData", msg = токен бота);
 * 4. сравнить HMAC-SHA256(key = secret, msg = строка из п.2) с `hash`.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export class InitDataError extends Error {}

export interface TelegramUser {
  id: number;
  firstName: string;
  username: string | null;
  languageCode: string | null;
}

export interface VerifyOptions {
  botToken: string;
  /**
   * Telegram подписывает `auth_date`, но не ограничивает его срок: без этой
   * проверки перехваченная строка работает вечно.
   */
  maxAgeSeconds: number;
  /** Подменяется в тестах, чтобы не зависеть от системных часов. */
  now?: () => number;
}

function dataCheckString(pairs: readonly [string, string][]): string {
  return [...pairs]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

/** Подписать пары так, как это делает Telegram. Нужно тестам и локальной отладке. */
export function signInitData(pairs: readonly [string, string][], botToken: string): string {
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  return createHmac('sha256', secret).update(dataCheckString(pairs)).digest('hex');
}

function equalHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export function verifyInitData(initData: string, options: VerifyOptions): TelegramUser {
  if (!options.botToken) {
    throw new InitDataError('токен бота не настроен');
  }

  const params = new URLSearchParams(initData);
  const received = params.get('hash');
  if (!received) {
    throw new InitDataError('в initData нет hash');
  }

  const pairs: [string, string][] = [];
  params.forEach((value, key) => {
    if (key !== 'hash') pairs.push([key, value]);
  });
  if (pairs.length === 0) {
    throw new InitDataError('initData пуста');
  }

  if (!equalHex(signInitData(pairs, options.botToken), received)) {
    throw new InitDataError('подпись не совпала');
  }

  const fields = new Map(pairs);
  const authDate = Number.parseInt(fields.get('auth_date') ?? '', 10);
  if (!Number.isFinite(authDate)) {
    throw new InitDataError('auth_date отсутствует или не число');
  }

  const nowSeconds = (options.now?.() ?? Date.now()) / 1000;
  const age = nowSeconds - authDate;
  if (age > options.maxAgeSeconds) {
    throw new InitDataError('initData просрочена');
  }
  // Небольшой запас на расхождение часов клиента и сервера.
  if (age < -60) {
    throw new InitDataError('auth_date в будущем');
  }

  return parseUser(fields.get('user') ?? '');
}

function parseUser(raw: string): TelegramUser {
  if (!raw) throw new InitDataError('в initData нет user');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InitDataError('user не является корректным JSON');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new InitDataError('user не объект');
  }

  const record = parsed as Record<string, unknown>;
  const id = record.id;
  const firstName = record.first_name;
  if (typeof id !== 'number' || !Number.isInteger(id) || typeof firstName !== 'string') {
    throw new InitDataError('в user нет id или first_name');
  }

  return {
    id,
    firstName,
    username: typeof record.username === 'string' ? record.username : null,
    languageCode: typeof record.language_code === 'string' ? record.language_code : null,
  };
}

export interface TelegramGate {
  enabled: boolean;
  botToken: string;
  maxAgeSeconds: number;
}

export function readTelegramGate(env: Record<string, string | undefined>): TelegramGate {
  const botToken = env.TELEGRAM_BOT_TOKEN?.trim() ?? '';
  const raw = env.TELEGRAM_MAX_AGE_SECONDS?.trim();
  const maxAgeSeconds = raw ? Number.parseInt(raw, 10) : 86400;
  if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds <= 0) {
    throw new InitDataError(`TELEGRAM_MAX_AGE_SECONDS: ожидалось положительное число, получено "${raw}"`);
  }
  return { enabled: botToken.length > 0, botToken, maxAgeSeconds };
}

/**
 * Пускать ли запрос.
 *
 * Без настроенного токена приложение работает как обычный сайт и подпись не
 * требует — иначе `docker compose up` без секретов не открылся бы вообще.
 * С токеном заголовок обязателен и обязан быть валидным: включённая защита,
 * которую можно обойти, не отправив заголовок, защитой не является.
 */
export function authorize(
  gate: TelegramGate,
  header: string | null,
  now?: () => number,
): TelegramUser | null {
  if (!gate.enabled) return null;
  if (!header) throw new InitDataError('требуется заголовок X-Telegram-Init-Data');
  return verifyInitData(header, {
    botToken: gate.botToken,
    maxAgeSeconds: gate.maxAgeSeconds,
    now,
  });
}
