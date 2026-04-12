/**
 * Прогон партий без интерфейса.
 *
 * Редьюсер чистый, а генератор случайных чисел живёт в состоянии, поэтому
 * партию можно сыграть в цикле и померить то, что на экране не видно: сколько
 * стоит стратегия, как часто наступает банкротство и — главное — что делает
 * с балансом множитель веса для застрахованных категорий.
 *
 * Запуск: npm run simulate [-- --games 5000]
 */

import { INSURANCE_CATALOG } from '../src/content/insurance';
import { EMPTY_STATE, reduce } from '../src/engine/reducer';
import { INITIAL_BUDGET, TOTAL_MONTHS, calculateScore } from '../src/engine/rules';
import { DEFAULT_RULES, type SelectionRules } from '../src/engine/selection';
import type { GameAction } from '../src/engine/actions';
import type { GameState, InsuranceOption } from '../src/engine/types';

type Strategy = (state: GameState) => InsuranceOption[];

const STRATEGIES: Record<string, Strategy> = {
  'без полисов': () => [],
  'всё подряд': () => [...INSURANCE_CATALOG],
  'самый дешёвый': () => [[...INSURANCE_CATALOG].sort((a, b) => a.monthlyCost - b.monthlyCost)[0]],
  'после первой беды': (state) => {
    const hit = new Set(
      state.monthHistory.filter((r) => r.event).map((r) => r.event!.category),
    );
    return INSURANCE_CATALOG.filter((option) => hit.has(option.type));
  },
  'два дешёвых': (state) => {
    const affordable = [...INSURANCE_CATALOG]
      .sort((a, b) => a.monthlyCost - b.monthlyCost)
      .slice(0, 2);
    return affordable.filter((option) => option.monthlyCost <= state.budget);
  },
};

interface Outcome {
  score: number;
  budget: number;
  spent: number;
  lost: number;
  saved: number;
  bankrupt: boolean;
  events: number;
  /** Событий, попавших в категорию действующего полиса. */
  eventsCovered: number;
}

function play(seed: number, strategy: Strategy, rules: SelectionRules): Outcome {
  let state = reduce(
    EMPTY_STATE,
    { type: 'start', playerName: 'sim', avatar: 'gamer', seed },
    rules,
  );
  const send = (action: GameAction): void => {
    state = reduce(state, action, rules);
  };

  for (let guard = 0; guard < 200; guard += 1) {
    if (state.phase === 'final-results' || state.phase === 'bankrupt') break;
    switch (state.phase) {
      case 'lesson':
        send({ type: 'completeLesson' });
        break;
      case 'insurance-shop':
        for (const option of strategy(state)) send({ type: 'buy', option });
        send({ type: 'finishShopping' });
        break;
      case 'living':
        send({ type: 'live' });
        break;
      case 'event':
        send({ type: 'acknowledge' });
        break;
      case 'event-breakdown':
        send({ type: 'finishBreakdown' });
        break;
      case 'month-summary':
        send({ type: 'nextMonth' });
        break;
      default:
        throw new Error(`Неожиданная фаза: ${state.phase}`);
    }
  }

  const withEvents = state.monthHistory.filter((record) => record.event !== null);
  return {
    score: calculateScore(state),
    budget: state.budget,
    spent: state.totalSpentOnInsurance,
    lost: state.totalLostToEvents,
    saved: state.totalSavedByInsurance,
    bankrupt: state.phase === 'bankrupt',
    events: withEvents.length,
    eventsCovered: withEvents.filter((record) => record.wasInsured).length,
  };
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

interface Row {
  strategy: string;
  score: number;
  budget: number;
  spent: number;
  saved: number;
  lost: number;
  bankruptcy: number;
  coverage: number;
}

function runSuite(games: number, rules: SelectionRules): Row[] {
  return Object.entries(STRATEGIES).map(([name, strategy]) => {
    const outcomes: Outcome[] = [];
    for (let i = 0; i < games; i += 1) {
      // Тот же ряд seed для каждой стратегии и каждого режима: сравниваются
      // решения, а не везение.
      outcomes.push(play(i * 2654435761, strategy, rules));
    }
    const events = outcomes.reduce((sum, o) => sum + o.events, 0);
    const covered = outcomes.reduce((sum, o) => sum + o.eventsCovered, 0);
    return {
      strategy: name,
      score: mean(outcomes.map((o) => o.score)),
      budget: mean(outcomes.map((o) => o.budget)),
      spent: mean(outcomes.map((o) => o.spent)),
      saved: mean(outcomes.map((o) => o.saved)),
      lost: mean(outcomes.map((o) => o.lost)),
      bankruptcy: mean(outcomes.map((o) => (o.bankrupt ? 1 : 0))),
      coverage: events === 0 ? 0 : covered / events,
    };
  });
}

function table(rows: readonly Row[]): string {
  const head = '| стратегия | счёт | остаток | премии | покрыто | потеряно | банкротств | событий в покрытии |';
  const sep = '|---|---:|---:|---:|---:|---:|---:|---:|';
  const body = rows.map(
    (row) =>
      `| ${row.strategy} | ${row.score.toFixed(1)} | ${Math.round(row.budget)} | ${Math.round(row.spent)} | ${Math.round(row.saved)} | ${Math.round(row.lost)} | ${(row.bankruptcy * 100).toFixed(1)}% | ${(row.coverage * 100).toFixed(1)}% |`,
  );
  return [head, sep, ...body].join('\n');
}

function main(): void {
  const argIndex = process.argv.indexOf('--games');
  const games = argIndex === -1 ? 2000 : Number.parseInt(process.argv[argIndex + 1] ?? '', 10);
  if (!Number.isFinite(games) || games <= 0) {
    throw new Error('--games ожидает положительное число');
  }

  console.log(
    `партий на стратегию: ${games}; месяцев: ${TOTAL_MONTHS}; стартовый бюджет: ${INITIAL_BUDGET}\n`,
  );

  const weighted = runSuite(games, DEFAULT_RULES);
  console.log(`## Множитель для застрахованных категорий = ${DEFAULT_RULES.insuredWeightBoost}\n`);
  console.log(table(weighted));

  const neutral = runSuite(games, { ...DEFAULT_RULES, insuredWeightBoost: 1 });
  console.log('\n## Множитель = 1 (честная лотерея)\n');
  console.log(table(neutral));

  console.log('\n## Разница, внесённая множителем\n');
  console.log('| стратегия | Δ счёт | Δ остаток | Δ покрыто | Δ событий в покрытии |');
  console.log('|---|---:|---:|---:|---:|');
  for (let i = 0; i < weighted.length; i += 1) {
    const w = weighted[i];
    const n = neutral[i];
    console.log(
      `| ${w.strategy} | ${(w.score - n.score >= 0 ? '+' : '')}${(w.score - n.score).toFixed(1)} | ${(w.budget - n.budget >= 0 ? '+' : '')}${Math.round(w.budget - n.budget)} | ${(w.saved - n.saved >= 0 ? '+' : '')}${Math.round(w.saved - n.saved)} | ${(w.coverage - n.coverage >= 0 ? '+' : '')}${((w.coverage - n.coverage) * 100).toFixed(1)} п.п. |`,
    );
  }
}

main();
