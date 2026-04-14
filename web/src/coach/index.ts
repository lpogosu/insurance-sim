/**
 * Выбор реализации тренера.
 *
 * Провайдер задаётся явно, а не выводится из наличия ключа. Разница видна на
 * опечатке: при выборе по наличию ключа опечатка в имени переменной молча
 * переводит приложение на встроенный справочник, и об этом узнаёшь из отзывов.
 * Здесь `COACH_PROVIDER=model` без ключа — ошибка запуска, а `rules` —
 * осознанный, а не случайный офлайн.
 */

import { ModelCoach } from './model';
import { RuleBasedCoach } from './rules';
import type { Coach } from './types';

export type CoachProvider = 'rules' | 'model';

export interface CoachConfig {
  provider: CoachProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
}

export const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
export const DEFAULT_MODEL = 'qwen/qwen3-235b-a22b';
export const DEFAULT_TIMEOUT_MS = 12000;

export class CoachConfigError extends Error {}

function parseProvider(raw: string | undefined): CoachProvider {
  const value = (raw ?? 'rules').trim().toLowerCase();
  if (value === 'rules' || value === 'model') return value;
  throw new CoachConfigError(
    `COACH_PROVIDER: ожидалось "rules" или "model", получено "${raw}"`,
  );
}

function parseTimeout(raw: string | undefined): number {
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new CoachConfigError(`COACH_TIMEOUT_MS: ожидалось положительное число, получено "${raw}"`);
  }
  return value;
}

export function readCoachConfig(env: Record<string, string | undefined>): CoachConfig {
  return {
    provider: parseProvider(env.COACH_PROVIDER),
    baseUrl: env.COACH_BASE_URL?.trim() || DEFAULT_BASE_URL,
    model: env.COACH_MODEL?.trim() || DEFAULT_MODEL,
    apiKey: env.COACH_API_KEY?.trim() ?? '',
    timeoutMs: parseTimeout(env.COACH_TIMEOUT_MS),
  };
}

/**
 * Нужна ли этой конфигурации сеть. Один предикат на всё приложение: если он
 * ложь, объект с транспортом не создаётся вообще, и «случайно сходить наружу»
 * становится невозможно, а не маловероятно.
 */
export function requiresNetwork(config: CoachConfig): boolean {
  return config.provider === 'model';
}

export function buildCoach(config: CoachConfig, fetchImpl?: typeof fetch): Coach {
  if (config.provider === 'rules') return new RuleBasedCoach();
  if (!config.apiKey) {
    throw new CoachConfigError('COACH_PROVIDER=model требует COACH_API_KEY');
  }
  return new ModelCoach({
    baseUrl: config.baseUrl,
    model: config.model,
    apiKey: config.apiKey,
    timeoutMs: config.timeoutMs,
    fetchImpl,
  });
}

export type { ChatTurn, Coach, CoachMode, Reply, Review, ReviewInput } from './types';
export { RuleBasedCoach } from './rules';
export { ModelCoach } from './model';
