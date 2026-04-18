import type { GameAction } from '@/engine/actions';
import { EMPTY_STATE, reduce } from '@/engine/reducer';
import { DEFAULT_RULES, type SelectionRules } from '@/engine/selection';
import { INSURANCE_CATALOG } from '@/content/insurance';
import type { GameState, InsuranceOption } from '@/engine/types';

/** Как игрок выбирает полисы в магазине. */
export type Strategy = (state: GameState) => InsuranceOption[];

export const strategies = {
  nothing: (): InsuranceOption[] => [],
  everything: (): InsuranceOption[] => [...INSURANCE_CATALOG],
  cheapest: (): InsuranceOption[] => [
    [...INSURANCE_CATALOG].sort((a, b) => a.monthlyCost - b.monthlyCost)[0],
  ],
  /** Держать защиту только той категории, которая уже один раз ударила. */
  reactive: (state: GameState): InsuranceOption[] => {
    const hit = new Set(
      state.monthHistory.filter((record) => record.event).map((record) => record.event!.category),
    );
    return INSURANCE_CATALOG.filter((option) => hit.has(option.type));
  },
} satisfies Record<string, Strategy>;

export interface PlayResult {
  state: GameState;
  months: number;
}

/**
 * Прогоняет партию до конца, отправляя те же действия, что и интерфейс.
 * Никакого React: редьюсер чистый, и это единственная причина, по которой
 * такой прогон вообще возможен.
 */
export function playGame(
  seed: number,
  strategy: Strategy,
  rules: SelectionRules = DEFAULT_RULES,
): PlayResult {
  let state = reduce(EMPTY_STATE, { type: 'start', playerName: 'Тест', avatar: 'gamer', seed }, rules);

  const send = (action: GameAction): void => {
    state = reduce(state, action, rules);
  };

  // Верхняя граница на случай, если редьюсер перестанет продвигать фазу:
  // тест должен падать по ассерту, а не висеть.
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

  return { state, months: state.monthHistory.length };
}
