/**
 * Типы игрового движка. Ничего, кроме данных: ни React, ни хранилища.
 *
 * Имена полей и значения фаз намеренно совпадают с хакатонными: интерфейс
 * портирован как есть, и переименование ради вкуса стоило бы правок в три
 * десятка компонентов без единого выигрыша.
 */

export type InsuranceType = 'device' | 'travel' | 'sports' | 'event' | 'digital' | 'health';

export const INSURANCE_TYPES: readonly InsuranceType[] = [
  'device',
  'travel',
  'sports',
  'event',
  'digital',
  'health',
];

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Rarity = 'common' | 'rare' | 'legendary';

export type GamePhase =
  | 'intro'
  | 'lesson'
  | 'insurance-shop'
  | 'living'
  | 'event'
  | 'event-result'
  | 'event-breakdown'
  | 'month-summary'
  | 'final-results'
  | 'bankrupt';

export interface InsuranceOption {
  type: InsuranceType;
  name: string;
  description: string;
  /** Списывается при покупке и затем в начале каждого следующего месяца действия. */
  monthlyCost: number;
  coverageAmount: number;
  /** Сколько месяцев действует полис, считая месяц покупки. */
  duration: number;
  icon: string;
  color: string;
}

export interface ActiveInsurance {
  type: InsuranceType;
  monthPurchased: number;
  monthlyCost: number;
  coverageAmount: number;
  duration: number;
  /** Первый месяц, в котором полис уже не действует. */
  expiresAtMonth: number;
}

export interface GameEvent {
  id: string;
  category: InsuranceType;
  title: string;
  description: string;
  notificationText: string;
  financialLoss: number;
  insuranceCoverage: number;
  /** Вес в лотерее выбора события. Больше — чаще. */
  weight: number;
  monthRange: [number, number];
  difficulty: Difficulty;
  withInsuranceText: string;
  withoutInsuranceText: string;
  lessonText: string;
}

export interface CalmMonth {
  id: string;
  title: string;
  notification: string;
  description: string;
}

export interface MonthRecord {
  month: number;
  monthName: string;
  insurancesBought: ActiveInsurance[];
  event: GameEvent | null;
  calmMonth: CalmMonth | null;
  wasInsured: boolean;
  /** Отрицательное число: сколько ушло из бюджета из-за события. */
  financialImpact: number;
  /** Премии, списанные в начале этого месяца за ранее купленные полисы. */
  premiumsCharged: number;
  budgetAfter: number;
  lessonCompleted: boolean;
}

export interface EventBreakdownData {
  flowDiagram: 'insured' | 'uninsured';
  whatHappened: string;
  howItWorks: string;
  keyTerm: { term: string; definition: string };
  financialSummary: {
    paid: number;
    covered: number;
    outOfPocket: number;
    netResult: number;
  };
}

export interface GameResults {
  score: number;
  grade: string;
  title: string;
  gradeColor: string;
  budgetRemaining: number;
  totalSpent: number;
  totalLost: number;
  totalSaved: number;
  /** Сколько рублей покрытия пришлось на рубль премии. */
  efficiency: number;
  monthHistory: MonthRecord[];
}

export interface LearningOutcome {
  title: string;
  text: string;
}

export interface RiskProfileData {
  type: string;
  description: string;
  icon: string;
  color: string;
}

export interface GameState {
  playerName: string;
  avatar: string;
  currentMonth: number;
  phase: GamePhase;
  lessonsCompleted: number;
  budget: number;
  totalSpentOnInsurance: number;
  totalLostToEvents: number;
  totalSavedByInsurance: number;
  activeInsurances: ActiveInsurance[];
  monthHistory: MonthRecord[];
  currentEvent: GameEvent | null;
  currentCalmMonth: CalmMonth | null;
  /** Полисы, купленные именно в этом месяце: нужны для карточки итога месяца. */
  currentMonthInsurances: ActiveInsurance[];
  /** Премии, списанные при входе в текущий месяц за ранее купленные полисы. */
  premiumsThisMonth: number;
  /** Состояние генератора: партия воспроизводима по одному числу. */
  seed: number;
}
