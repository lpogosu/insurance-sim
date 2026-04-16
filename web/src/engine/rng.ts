/**
 * Детерминированный генератор случайных чисел.
 *
 * В исходной версии выбор события делался через `Math.random()` прямо внутри
 * действия хранилища. Это удобно ровно до момента, когда нужно проверить
 * «а действительно ли страховка окупается» — воспроизвести партию нельзя,
 * и тест на баланс написать не из чего. Здесь состояние генератора лежит
 * в `GameState.seed`, поэтому партия целиком определяется одним числом:
 * одинаковый seed и одинаковые действия дают одинаковый результат.
 *
 * Алгоритм — mulberry32: 32 бита состояния, один шаг на вызов.
 */

export interface Roll {
  /** Значение в [0, 1). */
  value: number;
  /** Состояние генератора после броска. */
  seed: number;
}

export function nextRoll(seed: number): Roll {
  let a = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  a = a | 0;
  return { value, seed: a };
}

export interface Pick<T> {
  item: T;
  seed: number;
}

/**
 * Взвешенный выбор. Веса должны быть положительными; нулевой суммарный вес
 * означает ошибку в данных, а не «нечего выбрать», поэтому падаем.
 */
export function pickWeighted<T>(items: readonly T[], weights: readonly number[], seed: number): Pick<T> {
  if (items.length === 0) {
    throw new Error('pickWeighted: пустой список кандидатов');
  }
  if (items.length !== weights.length) {
    throw new Error('pickWeighted: длины списка и весов не совпадают');
  }
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) {
    throw new Error('pickWeighted: суммарный вес не положителен');
  }

  const roll = nextRoll(seed);
  let threshold = roll.value * total;
  for (let i = 0; i < items.length; i += 1) {
    threshold -= weights[i];
    // Строгое сравнение с нулём здесь было бы неверным: при value = 0
    // порог сразу уходит в минус и должен выбрать первый элемент.
    if (threshold < 0) {
      return { item: items[i], seed: roll.seed };
    }
  }
  return { item: items[items.length - 1], seed: roll.seed };
}

export function pickOne<T>(items: readonly T[], seed: number): Pick<T> {
  return pickWeighted(items, items.map(() => 1), seed);
}

/** Воспроизводимый seed из строки — чтобы «партия Лизы» всегда была одна и та же. */
export function seedFromString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash | 0;
}
