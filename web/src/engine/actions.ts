import type { GameState, InsuranceOption } from './types';

export type GameAction =
  | { type: 'start'; playerName: string; avatar: string; seed: number }
  /** Возврат сохранённой партии из браузера: переходом фазы не является. */
  | { type: 'restore'; state: GameState }
  | { type: 'completeLesson' }
  | { type: 'skipLesson' }
  | { type: 'buy'; option: InsuranceOption }
  | { type: 'finishShopping' }
  | { type: 'live' }
  | { type: 'acknowledge' }
  | { type: 'finishBreakdown' }
  | { type: 'nextMonth' }
  | { type: 'reset' };
