import { describe, expect, it } from 'vitest';
import {
  InitDataError,
  authorize,
  readTelegramGate,
  signInitData,
  verifyInitData,
} from '@/server/telegram';

const TOKEN = '123456:TEST-TOKEN-NOT-A-REAL-BOT';
const NOW_MS = 1_775_000_000_000;
const now = () => NOW_MS;

function buildInitData(
  overrides: Partial<Record<string, string>> = {},
  token = TOKEN,
): string {
  const pairs: [string, string][] = [
    ['auth_date', String(Math.floor(NOW_MS / 1000))],
    ['query_id', 'AAF_test'],
    ['user', JSON.stringify({ id: 4242, first_name: 'Лиза', username: 'liza' })],
    ...Object.entries(overrides).map(([key, value]) => [key, value ?? ''] as [string, string]),
  ];
  const deduped = [...new Map(pairs).entries()];
  const params = new URLSearchParams(deduped);
  params.set('hash', signInitData(deduped, token));
  return params.toString();
}

const options = { botToken: TOKEN, maxAgeSeconds: 86400, now };

describe('проверка подписи initData', () => {
  it('принимает корректно подписанную строку и возвращает пользователя', () => {
    const user = verifyInitData(buildInitData(), options);
    expect(user).toEqual({ id: 4242, firstName: 'Лиза', username: 'liza', languageCode: null });
  });

  it('отвергает подмену поля после подписи', () => {
    const params = new URLSearchParams(buildInitData());
    params.set('user', JSON.stringify({ id: 1, first_name: 'Админ' }));
    expect(() => verifyInitData(params.toString(), options)).toThrow(InitDataError);
  });

  it('отвергает подпись чужим токеном', () => {
    const foreign = buildInitData({}, '999:OTHER-TOKEN');
    expect(() => verifyInitData(foreign, options)).toThrow(/подпись/);
  });

  it('отвергает строку без hash', () => {
    const params = new URLSearchParams(buildInitData());
    params.delete('hash');
    expect(() => verifyInitData(params.toString(), options)).toThrow(/hash/);
  });

  it('отвергает просроченную строку', () => {
    const old = String(Math.floor(NOW_MS / 1000) - 90000);
    expect(() => verifyInitData(buildInitData({ auth_date: old }), options)).toThrow(/просроч/);
  });

  it('отвергает auth_date из будущего', () => {
    const future = String(Math.floor(NOW_MS / 1000) + 3600);
    expect(() => verifyInitData(buildInitData({ auth_date: future }), options)).toThrow(/будущем/);
  });

  it('отвергает user без id', () => {
    const broken = buildInitData({ user: JSON.stringify({ first_name: 'Лиза' }) });
    expect(() => verifyInitData(broken, options)).toThrow(/id/);
  });

  it('отвергает user, который не JSON', () => {
    expect(() => verifyInitData(buildInitData({ user: 'не json' }), options)).toThrow(/JSON/);
  });

  it('без токена проверка невозможна и это ошибка, а не разрешение', () => {
    expect(() => verifyInitData(buildInitData(), { ...options, botToken: '' })).toThrow(/токен/);
  });
});

describe('шлюз запроса', () => {
  it('без настроенного токена пускает всех: приложение работает и как обычный сайт', () => {
    const gate = readTelegramGate({});
    expect(gate.enabled).toBe(false);
    expect(authorize(gate, null)).toBeNull();
  });

  it('с настроенным токеном отсутствие заголовка — отказ', () => {
    const gate = readTelegramGate({ TELEGRAM_BOT_TOKEN: TOKEN });
    expect(gate.enabled).toBe(true);
    // Защита, которую обходят, не отправив заголовок, защитой не является.
    expect(() => authorize(gate, null)).toThrow(/заголовок/);
  });

  it('с настроенным токеном валидный заголовок пропускается', () => {
    const gate = readTelegramGate({ TELEGRAM_BOT_TOKEN: TOKEN });
    expect(authorize(gate, buildInitData(), now)?.id).toBe(4242);
  });

  it('некорректный срок жизни в конфигурации отвергается', () => {
    expect(() => readTelegramGate({ TELEGRAM_MAX_AGE_SECONDS: '-1' })).toThrow(InitDataError);
  });
});
