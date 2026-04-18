/**
 * Выбор события месяца.
 *
 * Правила подбора — не украшение, а способ удержать урок: первый месяц всегда
 * один и тот же, последний всегда болезненный, а два спокойных месяца подряд
 * запрещены, иначе игрок шесть ходов кликает «Далее» и ничему не учится.
 */

import { ALL_EVENTS, CALM_MONTHS } from '@/content/events';
import { nextRoll, pickOne, pickWeighted } from './rng';
import type { ActiveInsurance, CalmMonth, GameEvent, MonthRecord } from './types';

export interface SelectionRules {
  /**
   * Вероятность того, что в обычный месяц что-то произойдёт.
   * Первый и последний месяцы этой ручке не подчиняются.
   */
  eventChance: number;
  /**
   * Множитель веса для категорий, которые игрок застраховал.
   *
   * Значение больше единицы делает игру нечестной в пользу покупки полиса:
   * купил защиту гаджетов — вырастает шанс, что разобьётся именно телефон.
   * Это осознанный дидактический приём из хакатонной версии, а не ошибка,
   * но его цену видно только измерением — см. `npm run simulate`.
   */
  insuredWeightBoost: number;
  /** Первое событие фиксировано: одинаковый старт для всех. */
  openingEventId: string;
  totalMonths: number;
}

export const DEFAULT_RULES: SelectionRules = {
  eventChance: 0.65,
  insuredWeightBoost: 1.5,
  openingEventId: 'dev-01',
  totalMonths: 6,
};

export interface EventDraw {
  event: GameEvent | null;
  calmMonth: CalmMonth | null;
  seed: number;
}

function calmStreak(history: readonly MonthRecord[]): number {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].event) break;
    streak += 1;
  }
  return streak;
}

function isSevere(event: GameEvent): boolean {
  return event.difficulty !== 'easy' || event.financialLoss >= 15000;
}

function candidatesFor(
  month: number,
  history: readonly MonthRecord[],
  severeOnly: boolean,
): GameEvent[] {
  const used = new Set(history.filter((r) => r.event).map((r) => r.event!.id));
  const lastCategory = history.length > 0 ? (history[history.length - 1].event?.category ?? null) : null;

  const fits = (event: GameEvent): boolean =>
    !used.has(event.id) &&
    event.monthRange[0] <= month &&
    month <= event.monthRange[1] &&
    (!severeOnly || isSevere(event));

  let candidates = ALL_EVENTS.filter(fits);

  // Две беды одной категории подряд читаются как поломка генератора,
  // а не как невезение, поэтому категорию прошлого месяца избегаем —
  // но только если после фильтра что-то остаётся.
  if (lastCategory !== null && candidates.length > 1) {
    const other = candidates.filter((event) => event.category !== lastCategory);
    if (other.length > 0) candidates = other;
  }

  if (candidates.length === 0) {
    candidates = ALL_EVENTS.filter((event) => !used.has(event.id));
  }
  if (candidates.length === 0) {
    candidates = [...ALL_EVENTS];
  }
  return candidates;
}

function drawEvent(
  month: number,
  history: readonly MonthRecord[],
  active: readonly ActiveInsurance[],
  severeOnly: boolean,
  seed: number,
  rules: SelectionRules,
): { event: GameEvent; seed: number } {
  const candidates = candidatesFor(month, history, severeOnly);
  const insured = new Set(active.map((insurance) => insurance.type));
  const weights = candidates.map((event) =>
    insured.has(event.category) ? event.weight * rules.insuredWeightBoost : event.weight,
  );
  const picked = pickWeighted(candidates, weights, seed);
  return { event: picked.item, seed: picked.seed };
}

/**
 * Что происходит в этом месяце. Чистая функция: тот же seed и та же история
 * всегда дают тот же результат.
 */
export function selectMonthOutcome(
  month: number,
  history: readonly MonthRecord[],
  active: readonly ActiveInsurance[],
  seed: number,
  rules: SelectionRules = DEFAULT_RULES,
): EventDraw {
  if (month === 1) {
    const opening = ALL_EVENTS.find((event) => event.id === rules.openingEventId);
    if (!opening) {
      throw new Error(`Стартовое событие ${rules.openingEventId} отсутствует в каталоге`);
    }
    return { event: opening, calmMonth: null, seed };
  }

  if (month >= rules.totalMonths) {
    const drawn = drawEvent(month, history, active, true, seed, rules);
    return { event: drawn.event, calmMonth: null, seed: drawn.seed };
  }

  const guaranteed = calmStreak(history) >= 2 || history.filter((r) => !r.event).length >= 2;
  if (!guaranteed) {
    const roll = nextRoll(seed);
    if (roll.value > rules.eventChance) {
      const calm = pickOne(CALM_MONTHS, roll.seed);
      return { event: null, calmMonth: calm.item, seed: calm.seed };
    }
    const drawn = drawEvent(month, history, active, false, roll.seed, rules);
    return { event: drawn.event, calmMonth: null, seed: drawn.seed };
  }

  const drawn = drawEvent(month, history, active, false, seed, rules);
  return { event: drawn.event, calmMonth: null, seed: drawn.seed };
}
