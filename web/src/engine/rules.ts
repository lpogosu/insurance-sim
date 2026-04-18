/** Арифметика игры: покрытие, премии, счёт, разбор события. */

import type {
  ActiveInsurance,
  EventBreakdownData,
  GameEvent,
  GameResults,
  GameState,
  InsuranceOption,
  InsuranceType,
} from './types';
import { INSURANCE_TYPES } from './types';

export const INITIAL_BUDGET = 50000;
export const TOTAL_MONTHS = 6;
export const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь'] as const;

/**
 * Полис действует с месяца покупки включительно и до `expiresAtMonth`
 * не включая.
 *
 * Одно определение на весь движок. В хакатонной версии границу считали в трёх
 * местах двумя способами: покрытие проверяли по `expiresAtMonth > currentMonth`,
 * а списание истёкших делали по `> nextMonth`. Из-за этого полис последнего
 * месяца то срабатывал, то нет, в зависимости от того, какая из веток
 * выполнялась первой.
 */
export function isActiveIn(insurance: ActiveInsurance, month: number): boolean {
  return insurance.monthPurchased <= month && month < insurance.expiresAtMonth;
}

export function activeIn(insurances: readonly ActiveInsurance[], month: number): ActiveInsurance[] {
  return insurances.filter((insurance) => isActiveIn(insurance, month));
}

export function coverageFor(
  insurances: readonly ActiveInsurance[],
  category: InsuranceType,
  month: number,
): ActiveInsurance | null {
  return activeIn(insurances, month).find((insurance) => insurance.type === category) ?? null;
}

export function toActiveInsurance(option: InsuranceOption, month: number): ActiveInsurance {
  return {
    type: option.type,
    monthPurchased: month,
    monthlyCost: option.monthlyCost,
    coverageAmount: option.coverageAmount,
    duration: option.duration,
    expiresAtMonth: month + option.duration,
  };
}

export interface EventImpact {
  wasInsured: boolean;
  /** Сколько ушло из бюджета. */
  outOfPocket: number;
  /** Сколько закрыла страховая. */
  covered: number;
}

export function applyEvent(
  event: GameEvent,
  insurances: readonly ActiveInsurance[],
  month: number,
): EventImpact {
  const policy = coverageFor(insurances, event.category, month);
  if (!policy) {
    return { wasInsured: false, outOfPocket: event.financialLoss, covered: 0 };
  }
  // Лимит по полису может быть меньше ущерба: остаток платит игрок. Именно это
  // отличает страховку от волшебной палочки, и именно это должен увидеть
  // подросток на экране разбора.
  const covered = Math.min(policy.coverageAmount, event.insuranceCoverage, event.financialLoss);
  return { wasInsured: true, outOfPocket: event.financialLoss - covered, covered };
}

/**
 * Премии, списываемые в начале месяца: за каждый действующий полис, кроме
 * месяца покупки — за него уже заплатили в магазине.
 *
 * Хакатонная версия отбрасывала полис из списка на списание раньше, чем
 * считала сумму, поэтому трёхмесячный полис оплачивался дважды, а покрывал
 * три месяца. Ошибка в пользу игрока и потому незаметная.
 */
export function premiumsDueFor(insurances: readonly ActiveInsurance[], month: number): number {
  return activeIn(insurances, month)
    .filter((insurance) => insurance.monthPurchased !== month)
    .reduce((sum, insurance) => sum + insurance.monthlyCost, 0);
}

export function uniqueInsuranceTypes(state: GameState): number {
  const types = new Set<InsuranceType>();
  for (const record of state.monthHistory) {
    for (const insurance of record.insurancesBought) types.add(insurance.type);
  }
  for (const insurance of state.activeInsurances) types.add(insurance.type);
  return types.size;
}

export function calculateScore(state: GameState): number {
  const withEvents = state.monthHistory.filter((record) => record.event !== null);
  const budgetRetention = Math.max(0, state.budget) / INITIAL_BUDGET;
  const smartRatio =
    withEvents.length === 0
      ? 0
      : withEvents.filter((record) => record.wasInsured).length / withEvents.length;
  const diversification = uniqueInsuranceTypes(state) / INSURANCE_TYPES.length;

  const raw = budgetRetention * 40 + smartRatio * 40 + diversification * 20;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export interface GradeInfo {
  grade: string;
  title: string;
  color: string;
}

export const GRADE_LEVELS: readonly (GradeInfo & { min: number })[] = [
  { min: 90, grade: 'guru', title: 'Страховой гуру', color: '#f59e0b' },
  { min: 75, grade: 'smart', title: 'Умный игрок', color: '#1e56e0' },
  { min: 55, grade: 'understands', title: 'Разбирается', color: '#22c55e' },
  { min: 35, grade: 'learning', title: 'Учится на ошибках', color: '#eab308' },
  { min: 15, grade: 'risky', title: 'Рискует зря', color: '#f97316' },
  { min: 0, grade: 'pain', title: 'Жизнь — боль', color: '#ef4444' },
];

export function getGrade(score: number): GradeInfo {
  const level = GRADE_LEVELS.find((candidate) => score >= candidate.min);
  if (!level) {
    throw new Error(`Ни один грейд не подходит под счёт ${score}`);
  }
  return { grade: level.grade, title: level.title, color: level.color };
}

export function getResults(state: GameState): GameResults {
  const score = calculateScore(state);
  const { grade, title, color } = getGrade(score);
  return {
    score,
    grade,
    title,
    gradeColor: color,
    budgetRemaining: state.budget,
    totalSpent: state.totalSpentOnInsurance,
    totalLost: state.totalLostToEvents,
    totalSaved: state.totalSavedByInsurance,
    efficiency:
      state.totalSpentOnInsurance > 0
        ? state.totalSavedByInsurance / state.totalSpentOnInsurance
        : 0,
    monthHistory: state.monthHistory,
  };
}

/** Неразрывные пробелы: сумма не должна переноситься по разрядам. */
export function formatMoney(amount: number): string {
  const digits = Math.round(amount).toLocaleString('ru-RU').replace(/[\s ]/g, ' ');
  return `${digits} ₽`;
}

export function generateBreakdown(
  event: GameEvent,
  wasInsured: boolean,
  premiumPaid: number,
): EventBreakdownData {
  if (wasInsured) {
    const covered = Math.min(event.insuranceCoverage, event.financialLoss);
    return {
      flowDiagram: 'insured',
      whatHappened: event.withInsuranceText,
      howItWorks: `Ты платил ${formatMoney(premiumPaid)}/мес за страховку. Когда случился страховой случай, страховая компания покрыла ${formatMoney(covered)} из ${formatMoney(event.financialLoss)} ущерба. Разница между премией и покрытием — это ценность страхования.`,
      keyTerm: {
        term: 'Страховое возмещение',
        definition: 'Деньги, которые страховая выплачивает при наступлении страхового случая.',
      },
      financialSummary: {
        paid: premiumPaid,
        covered,
        outOfPocket: Math.max(0, event.financialLoss - event.insuranceCoverage),
        netResult: covered - premiumPaid,
      },
    };
  }

  return {
    flowDiagram: 'uninsured',
    whatHappened: event.withoutInsuranceText,
    howItWorks: `Без страховки ты берёшь весь риск на себя. Это значит, что при проблеме ты платишь полную стоимость — ${formatMoney(event.financialLoss)}.`,
    keyTerm: {
      term: 'Незастрахованный риск',
      definition:
        'Когда ты осознанно или случайно не защитил что-то — и платишь за последствия сам.',
    },
    financialSummary: {
      paid: 0,
      covered: 0,
      outOfPocket: event.financialLoss,
      netResult: -event.financialLoss,
    },
  };
}
