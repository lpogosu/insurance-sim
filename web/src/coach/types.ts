/**
 * Шов между «разбор пишет языковая модель» и «разбор собирается из чисел партии».
 *
 * Обе реализации равноправны и обе всегда собраны. Приложение стартует и
 * полностью работает без ключа: детерминированный разбор — не заглушка на
 * случай падения, а второй автор с другими сильными сторонами. Он не умеет
 * переформулировать, зато физически не может выдумать сумму, которой не было
 * в партии.
 */

import type { GameResults } from '@/engine';

/** Каким путём получен текст. Уходит в ответ API и показывается пользователю. */
export type CoachMode = 'rules' | 'model';

export interface Review {
  text: string;
  mode: CoachMode;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface Reply {
  text: string;
  mode: CoachMode;
}

export interface ReviewInput {
  playerName: string;
  results: GameResults;
}

export interface Coach {
  /** Имя реализации: попадает в /api/health и в ответ, чтобы путь был виден. */
  readonly name: string;
  review(input: ReviewInput): Promise<Review>;
  answer(messages: readonly ChatTurn[]): Promise<Reply>;
}
