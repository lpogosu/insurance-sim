const STREAK_KEY = 'risklab_streak';
const LAST_VISIT_KEY = 'risklab_last_visit';

const listeners = new Set<() => void>();

/**
 * Подписка для `useSyncExternalStore`. Серия живёт в localStorage, а не в
 * React-состоянии: её пишет главный экран, а показывает «Изучай». Без общего
 * источника пришлось бы синхронизировать два компонента вручную.
 */
export function subscribeToStreak(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function getStreak(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
}

/** Значение на сервере: до гидратации localStorage недоступен. */
export function getServerStreak(): number {
  return 0;
}

export function updateStreak(): number {
  if (typeof window === 'undefined') return 0;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lastVisit = localStorage.getItem(LAST_VISIT_KEY);

  if (lastVisit === today) {
    return parseInt(localStorage.getItem(STREAK_KEY) || '1', 10);
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let streak: number;
  if (lastVisit === yesterdayStr) {
    streak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10) + 1;
  } else {
    streak = 1;
  }

  localStorage.setItem(STREAK_KEY, streak.toString());
  localStorage.setItem(LAST_VISIT_KEY, today);
  listeners.forEach((listener) => listener());
  return streak;
}
