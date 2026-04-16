/**
 * Состояние партии как чистый редьюсер.
 *
 * В хакатонной версии эта логика жила внутри действий zustand-хранилища и
 * читала состояние через `get()`. Работало, но проверить в ней было нечего:
 * чтобы узнать, окупается ли стратегия «покупать всё», пришлось бы поднимать
 * React и кликать шесть месяцев подряд. Здесь состояние — данные, переход —
 * функция, и `scripts/simulate.ts` прогоняет тысячи партий за секунды.
 * Хранилище осталось на месте: оно стало тонкой обёрткой над этой функцией.
 *
 * Действие, не подходящее текущей фазе, возвращает состояние без изменений.
 * Экран не обязан знать порядок фаз — его знает редьюсер.
 */

import type { GameAction } from './actions';
import {
  INITIAL_BUDGET,
  MONTH_NAMES,
  TOTAL_MONTHS,
  activeIn,
  applyEvent,
  coverageFor,
  isActiveIn,
  premiumsDueFor,
  toActiveInsurance,
} from './rules';
import { DEFAULT_RULES, selectMonthOutcome, type SelectionRules } from './selection';
import type { ActiveInsurance, GameState, MonthRecord } from './types';

export const EMPTY_STATE: GameState = {
  playerName: '',
  avatar: '',
  currentMonth: 1,
  phase: 'intro',
  lessonsCompleted: 0,
  budget: INITIAL_BUDGET,
  totalSpentOnInsurance: 0,
  totalLostToEvents: 0,
  totalSavedByInsurance: 0,
  activeInsurances: [],
  monthHistory: [],
  currentEvent: null,
  currentCalmMonth: null,
  currentMonthInsurances: [],
  premiumsThisMonth: 0,
  seed: 1,
};

function recordFor(state: GameState, budgetAfter: number): MonthRecord {
  const event = state.currentEvent;
  const wasInsured =
    event !== null && coverageFor(state.activeInsurances, event.category, state.currentMonth) !== null;
  const impact = event ? applyEvent(event, state.activeInsurances, state.currentMonth) : null;

  return {
    month: state.currentMonth,
    monthName: MONTH_NAMES[state.currentMonth - 1] ?? `Месяц ${state.currentMonth}`,
    insurancesBought: state.currentMonthInsurances,
    event,
    calmMonth: state.currentCalmMonth,
    wasInsured,
    financialImpact: impact ? -impact.outOfPocket : 0,
    premiumsCharged: state.premiumsThisMonth,
    budgetAfter,
    lessonCompleted: state.lessonsCompleted >= state.currentMonth,
  };
}

export function reduce(
  state: GameState,
  action: GameAction,
  rules: SelectionRules = DEFAULT_RULES,
): GameState {
  switch (action.type) {
    case 'start':
      return {
        ...EMPTY_STATE,
        playerName: action.playerName,
        avatar: action.avatar,
        seed: action.seed,
        phase: 'lesson',
      };

    case 'restore':
      return action.state;

    case 'completeLesson':
      if (state.phase !== 'lesson') return state;
      return {
        ...state,
        lessonsCompleted: state.lessonsCompleted + 1,
        phase: 'insurance-shop',
      };

    case 'skipLesson':
      if (state.phase !== 'lesson') return state;
      return { ...state, phase: 'insurance-shop' };

    case 'buy': {
      if (state.phase !== 'insurance-shop') return state;
      const option = action.option;
      const alreadyCovered = state.activeInsurances.some(
        (insurance) => insurance.type === option.type && isActiveIn(insurance, state.currentMonth),
      );
      // Второй полис той же категории не удваивает лимит — он просто списывает
      // премию дважды.
      if (alreadyCovered) return state;
      if (state.budget < option.monthlyCost) return state;

      const bought = toActiveInsurance(option, state.currentMonth);
      return {
        ...state,
        budget: state.budget - option.monthlyCost,
        totalSpentOnInsurance: state.totalSpentOnInsurance + option.monthlyCost,
        activeInsurances: [...state.activeInsurances, bought],
        currentMonthInsurances: [...state.currentMonthInsurances, bought],
      };
    }

    case 'finishShopping':
      if (state.phase !== 'insurance-shop') return state;
      return { ...state, phase: 'living' };

    case 'live': {
      if (state.phase !== 'living') return state;
      const draw = selectMonthOutcome(
        state.currentMonth,
        state.monthHistory,
        activeIn(state.activeInsurances, state.currentMonth),
        state.seed,
        rules,
      );
      return {
        ...state,
        currentEvent: draw.event,
        currentCalmMonth: draw.calmMonth,
        seed: draw.seed,
        phase: 'event',
      };
    }

    case 'acknowledge': {
      if (state.phase !== 'event') return state;
      if (!state.currentEvent) return { ...state, phase: 'event-breakdown' };

      const impact = applyEvent(state.currentEvent, state.activeInsurances, state.currentMonth);
      return {
        ...state,
        budget: state.budget - impact.outOfPocket,
        totalLostToEvents: state.totalLostToEvents + impact.outOfPocket,
        totalSavedByInsurance: state.totalSavedByInsurance + impact.covered,
        phase: 'event-breakdown',
      };
    }

    case 'finishBreakdown': {
      if (state.phase !== 'event-breakdown') return state;
      if (state.budget > 0) return { ...state, phase: 'month-summary' };
      return {
        ...state,
        monthHistory: [...state.monthHistory, recordFor(state, state.budget)],
        phase: 'bankrupt',
      };
    }

    case 'nextMonth': {
      if (state.phase !== 'month-summary') return state;
      const history = [...state.monthHistory, recordFor(state, state.budget)];

      if (state.currentMonth >= TOTAL_MONTHS) {
        return { ...state, monthHistory: history, phase: 'final-results' };
      }

      const currentMonth = state.currentMonth + 1;
      const carried: ActiveInsurance[] = activeIn(state.activeInsurances, currentMonth);
      const premiums = premiumsDueFor(carried, currentMonth);
      const budget = state.budget - premiums;

      const base: GameState = {
        ...state,
        currentMonth,
        monthHistory: history,
        activeInsurances: carried,
        budget,
        totalSpentOnInsurance: state.totalSpentOnInsurance + premiums,
        currentEvent: null,
        currentCalmMonth: null,
        currentMonthInsurances: [],
        premiumsThisMonth: premiums,
      };

      // Премии могут добить бюджет до нуля на входе в месяц: это тот самый
      // случай «застраховал всё и остался без денег», ради которого в игре
      // вообще есть банкротство.
      return budget > 0 ? { ...base, phase: 'lesson' } : { ...base, phase: 'bankrupt' };
    }

    case 'reset':
      return EMPTY_STATE;

    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
