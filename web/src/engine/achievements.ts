/** Ачивки. Каждая — предикат по состоянию партии, без побочных эффектов. */

import { TOTAL_MONTHS, calculateScore, uniqueInsuranceTypes } from './rules';
import type { GameState, Rarity } from './types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  rarity: Rarity;
  condition: (state: GameState) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-insurance',
    title: 'Первый полис',
    description: 'Купил первую страховку',
    icon: 'Shield',
    color: '#74B9FF',
    rarity: 'common',
    condition: (state) => state.totalSpentOnInsurance > 0,
  },
  {
    id: 'all-lessons',
    title: 'Прилежный ученик',
    description: 'Прошёл все 6 мини-уроков',
    icon: 'GraduationCap',
    color: '#A29BFE',
    rarity: 'rare',
    condition: (state) => state.lessonsCompleted >= TOTAL_MONTHS,
  },
  {
    id: 'no-losses',
    title: 'Неприкасаемый',
    description: 'Ни разу не потерял деньги без страховки',
    icon: 'Sparkles',
    color: '#4ECDC4',
    rarity: 'legendary',
    condition: (state) => state.totalLostToEvents === 0,
  },
  {
    id: 'grade-s',
    title: 'Страховой гуру',
    description: 'Набрал 90+ баллов',
    icon: 'Trophy',
    color: '#FFB088',
    rarity: 'legendary',
    condition: (state) => calculateScore(state) >= 90,
  },
  {
    id: 'diversified',
    title: 'Диверсификатор',
    description: 'Купил страховки 4+ категорий',
    icon: 'Layers',
    color: '#55EFC4',
    rarity: 'rare',
    condition: (state) => uniqueInsuranceTypes(state) >= 4,
  },
  {
    id: 'saved-big',
    title: 'Экономист',
    description: 'Страховки сохранили 20 000 ₽ и больше',
    icon: 'PiggyBank',
    color: '#4ECDC4',
    rarity: 'rare',
    condition: (state) => state.totalSavedByInsurance >= 20000,
  },
  {
    id: 'risk-taker',
    title: 'Рисковый игрок',
    description: 'Ни разу не купил страховку',
    icon: 'Flame',
    color: '#FF6B6B',
    rarity: 'rare',
    condition: (state) => state.totalSpentOnInsurance === 0 && state.monthHistory.length > 0,
  },
  {
    id: 'survivor',
    title: 'Выживший',
    description: 'Закончил игру с бюджетом больше 0',
    icon: 'Heart',
    color: '#FD79A8',
    rarity: 'common',
    condition: (state) => state.monthHistory.length >= TOTAL_MONTHS && state.budget > 0,
  },
  {
    id: 'bankrupt',
    title: 'Банкрот',
    description: 'Бюджет кончился до конца игры',
    icon: 'TrendingDown',
    color: '#FF3B30',
    rarity: 'rare',
    condition: (state) => state.budget <= 0 && state.monthHistory.length < TOTAL_MONTHS,
  },
];

export function getEarnedAchievements(state: GameState): Achievement[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.condition(state));
}

const STORAGE_KEY = 'risklab-achievements';

/** Ачивки копятся между партиями, поэтому лежат отдельно от состояния игры. */
export function saveAchievements(earned: readonly string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const merged = new Set([...getAllEarned(), ...earned]);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...merged]));
  } catch {
    // Приватный режим и переполненное хранилище — не повод ронять экран итога.
  }
}

export function getAllEarned(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}
