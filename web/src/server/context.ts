/**
 * Сборка серверных зависимостей.
 *
 * Конфигурация читается один раз за процесс и падает на старте, если она
 * противоречива: `COACH_PROVIDER=model` без ключа — это ошибка развёртывания,
 * и узнать о ней надо из логов запуска, а не из пустого экрана у подростка.
 */

import { buildCoach, readCoachConfig, requiresNetwork, type Coach, type CoachConfig } from '@/coach';
import { readTelegramGate, type TelegramGate } from './telegram';

export interface ServerContext {
  coach: Coach;
  coachConfig: CoachConfig;
  telegram: TelegramGate;
}

let cached: ServerContext | null = null;

export function getContext(env: Record<string, string | undefined> = process.env): ServerContext {
  if (cached) return cached;
  const coachConfig = readCoachConfig(env);
  cached = {
    coachConfig,
    coach: buildCoach(coachConfig),
    telegram: readTelegramGate(env),
  };
  return cached;
}

/** Только для тестов: сбросить кеш между сценариями конфигурации. */
export function resetContext(): void {
  cached = null;
}

export function describeContext(context: ServerContext): Record<string, string | boolean> {
  return {
    coach: context.coach.name,
    network: requiresNetwork(context.coachConfig),
    telegramVerification: context.telegram.enabled,
  };
}
