/** Публичная поверхность движка: интерфейс импортирует только отсюда. */

export type {
  ActiveInsurance,
  CalmMonth,
  Difficulty,
  EventBreakdownData,
  GameEvent,
  GamePhase,
  GameResults,
  GameState,
  InsuranceOption,
  InsuranceType,
  LearningOutcome,
  MonthRecord,
  Rarity,
  RiskProfileData,
} from './types';
export { INSURANCE_TYPES } from './types';

export type { GameAction } from './actions';

export {
  GRADE_LEVELS,
  INITIAL_BUDGET,
  MONTH_NAMES,
  TOTAL_MONTHS,
  activeIn,
  applyEvent,
  calculateScore,
  coverageFor,
  formatMoney,
  generateBreakdown,
  getGrade,
  getResults,
  isActiveIn,
  premiumsDueFor,
  toActiveInsurance,
  uniqueInsuranceTypes,
} from './rules';
export type { EventImpact, GradeInfo } from './rules';

export { generateLearningOutcomes, getRiskProfile } from './profile';

export { EMPTY_STATE, reduce } from './reducer';

export { DEFAULT_RULES, selectMonthOutcome } from './selection';
export type { EventDraw, SelectionRules } from './selection';

export { nextRoll, pickOne, pickWeighted, seedFromString } from './rng';
