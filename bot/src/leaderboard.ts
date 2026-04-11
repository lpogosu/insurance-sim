/**
 * Таблица лидеров.
 *
 * Живёт в памяти процесса и умирает вместе с ним. Это осознанное ограничение
 * хакатонной версии, и оно здесь сохранено: единственная альтернатива —
 * тащить в бота базу ради одного списка из десяти строк. Ограничение названо
 * в README и в ответе команды `/leaderboard`, а не спрятано.
 *
 * Размер ограничен сверху: без этого бот в большом чате растёт в памяти,
 * пока его не убьёт OOM.
 */

export interface Entry {
  userId: number;
  name: string;
  score: number;
  title: string;
}

export const DEFAULT_CAPACITY = 500;
export const TOP_SIZE = 10;

export class Leaderboard {
  private readonly entries = new Map<number, Entry>();

  constructor(private readonly capacity: number = DEFAULT_CAPACITY) {
    if (capacity <= 0) throw new Error('capacity должен быть положительным');
  }

  get size(): number {
    return this.entries.size;
  }

  /**
   * Записать результат. Возвращает true, если запись улучшила прошлую —
   * бот по этому признаку решает, поздравлять ли с личным рекордом.
   */
  submit(entry: Entry): boolean {
    const previous = this.entries.get(entry.userId);
    if (previous && previous.score >= entry.score) return false;

    if (!previous && this.entries.size >= this.capacity) {
      this.evictWorst();
    }
    this.entries.set(entry.userId, entry);
    return true;
  }

  /** Первые `TOP_SIZE` по убыванию счёта; при равенстве — по имени, чтобы порядок был устойчив. */
  top(limit: number = TOP_SIZE): Entry[] {
    return [...this.entries.values()]
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ru'))
      .slice(0, limit);
  }

  private evictWorst(): void {
    let worst: Entry | null = null;
    for (const entry of this.entries.values()) {
      if (!worst || entry.score < worst.score) worst = entry;
    }
    if (worst) this.entries.delete(worst.userId);
  }
}
