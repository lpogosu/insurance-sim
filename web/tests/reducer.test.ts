import { describe, expect, it } from 'vitest';
import { INSURANCE_CATALOG } from '@/content/insurance';
import { EMPTY_STATE, reduce } from '@/engine/reducer';
import { INITIAL_BUDGET, TOTAL_MONTHS } from '@/engine/rules';
import { playGame, strategies } from './helpers';

const SEEDS = [1, 7, 42, 1337, 20260411, -99, 2 ** 20];

function start(seed = 1) {
  return reduce(EMPTY_STATE, { type: 'start', playerName: 'Лиза', avatar: 'gamer', seed });
}

describe('переходы фаз', () => {
  it('партия начинается с урока первого месяца', () => {
    const state = start();
    expect(state.phase).toBe('lesson');
    expect(state.currentMonth).toBe(1);
    expect(state.budget).toBe(INITIAL_BUDGET);
  });

  it('действие не своей фазы не меняет состояние', () => {
    const state = start();
    // Купить полис можно только в магазине; из урока это должно быть no-op.
    expect(reduce(state, { type: 'buy', option: INSURANCE_CATALOG[0] })).toBe(state);
    expect(reduce(state, { type: 'nextMonth' })).toBe(state);
    expect(reduce(state, { type: 'acknowledge' })).toBe(state);
  });

  it('пропуск урока не засчитывается как пройденный', () => {
    const skipped = reduce(start(), { type: 'skipLesson' });
    expect(skipped.phase).toBe('insurance-shop');
    expect(skipped.lessonsCompleted).toBe(0);
  });
});

describe('покупка полиса', () => {
  it('списывает премию один раз и запоминает покупку', () => {
    const shop = reduce(reduce(start(), { type: 'completeLesson' }), { type: 'finishShopping' });
    expect(shop.phase).toBe('living');

    const inShop = reduce(start(), { type: 'completeLesson' });
    const option = INSURANCE_CATALOG[0];
    const bought = reduce(inShop, { type: 'buy', option });

    expect(bought.budget).toBe(INITIAL_BUDGET - option.monthlyCost);
    expect(bought.totalSpentOnInsurance).toBe(option.monthlyCost);
    expect(bought.currentMonthInsurances).toHaveLength(1);
  });

  it('второй полис той же категории не покупается и не списывает деньги', () => {
    const inShop = reduce(start(), { type: 'completeLesson' });
    const option = INSURANCE_CATALOG[0];
    const once = reduce(inShop, { type: 'buy', option });
    const twice = reduce(once, { type: 'buy', option });

    expect(twice).toBe(once);
    expect(twice.budget).toBe(INITIAL_BUDGET - option.monthlyCost);
  });

  it('полис дороже остатка не покупается', () => {
    const inShop = reduce(start(), { type: 'completeLesson' });
    const poor = { ...inShop, budget: 100 };
    expect(reduce(poor, { type: 'buy', option: INSURANCE_CATALOG[0] })).toBe(poor);
  });
});

describe('инварианты полной партии', () => {
  it.each(SEEDS)('бюджет сходится с расходами при seed %i', (seed) => {
    for (const [name, strategy] of Object.entries(strategies)) {
      const { state } = playGame(seed, strategy);
      // Единственный источник расхождения — ошибка в арифметике редьюсера:
      // деньги уходят либо в премии, либо в незакрытый ущерб, третьего нет.
      expect(
        state.budget,
        `${name}: бюджет не сходится`,
      ).toBe(INITIAL_BUDGET - state.totalSpentOnInsurance - state.totalLostToEvents);
    }
  });

  it.each(SEEDS)('партия завершается за шесть месяцев или банкротством при seed %i', (seed) => {
    for (const strategy of Object.values(strategies)) {
      const { state, months } = playGame(seed, strategy);
      expect(['final-results', 'bankrupt']).toContain(state.phase);
      if (state.phase === 'final-results') {
        expect(months).toBe(TOTAL_MONTHS);
      } else {
        expect(months).toBeLessThanOrEqual(TOTAL_MONTHS);
        expect(state.budget).toBeLessThanOrEqual(0);
      }
    }
  });

  it('одинаковый seed и одинаковая стратегия дают одинаковую партию', () => {
    const first = playGame(20260411, strategies.everything);
    const second = playGame(20260411, strategies.everything);
    expect(second.state).toEqual(first.state);
  });

  it('разные seed дают разные партии', () => {
    const a = playGame(1, strategies.nothing);
    const b = playGame(2, strategies.nothing);
    const idsOf = (result: typeof a): string[] =>
      result.state.monthHistory.map((record) => record.event?.id ?? 'calm');
    expect(idsOf(a)).not.toEqual(idsOf(b));
  });

  it('одно событие не повторяется внутри партии', () => {
    for (const seed of SEEDS) {
      const { state } = playGame(seed, strategies.cheapest);
      const ids = state.monthHistory.filter((r) => r.event).map((r) => r.event!.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('без единого полиса потери равны сумме ущербов', () => {
    const { state } = playGame(42, strategies.nothing);
    const damage = state.monthHistory
      .filter((record) => record.event)
      .reduce((sum, record) => sum + record.event!.financialLoss, 0);
    expect(state.totalSpentOnInsurance).toBe(0);
    expect(state.totalLostToEvents).toBe(damage);
  });

  it('страховка всех категорий не оставляет незакрытых событий, кроме превышения лимита', () => {
    const { state } = playGame(7, strategies.everything);
    for (const record of state.monthHistory) {
      if (!record.event) continue;
      expect(record.wasInsured).toBe(true);
      const excess = Math.max(0, record.event.financialLoss - record.event.insuranceCoverage);
      expect(Math.abs(record.financialImpact)).toBe(excess);
    }
  });
});

describe('банкротство', () => {
  it('наступает, когда премии съедают остаток на входе в месяц', () => {
    const broke = {
      ...start(),
      phase: 'month-summary' as const,
      currentMonth: 2,
      budget: 500,
      activeInsurances: [
        {
          type: 'device' as const,
          monthPurchased: 1,
          monthlyCost: 2500,
          coverageAmount: 25000,
          duration: 3,
          expiresAtMonth: 4,
        },
      ],
    };
    const next = reduce(broke, { type: 'nextMonth' });
    expect(next.phase).toBe('bankrupt');
    expect(next.budget).toBeLessThanOrEqual(0);
  });
});
