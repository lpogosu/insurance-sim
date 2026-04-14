/**
 * Тренер поверх внешней модели (OpenAI-совместимый эндпоинт).
 *
 * Здесь две защиты, и вторая важнее первой.
 *
 * 1. Транспортная: таймаут, единственная попытка, любая ошибка — переход на
 *    детерминированный разбор с честной пометкой `mode: 'rules'`.
 * 2. Числовая: модель получает готовые суммы и просьбу не выдумывать свои.
 *    Просьба ничего не гарантирует, поэтому ответ проверяется: каждое число
 *    от тысячи и выше обязано встречаться среди чисел партии. Не совпало —
 *    ответ выбрасывается целиком. Подросток, которому назвали сумму, которую
 *    он не терял, перестаёт верить и всему остальному.
 */

import { formatMoney, INITIAL_BUDGET } from '@/engine';
import { RuleBasedCoach } from './rules';
import type { ChatTurn, Coach, Reply, Review, ReviewInput } from './types';

const REVIEW_SYSTEM = `Ты разбираешь партию подростка в обучающем симуляторе страхования.

Правила:
- по-русски, на «ты», спокойно и без снисходительности;
- используй ТОЛЬКО суммы из блока данных, своих чисел не добавляй;
- 60–120 слов, без markdown, без списков, без эмодзи;
- порядок: общая оценка, самое дорогое решение, что изменить в следующий раз.`;

const CHAT_SYSTEM = `Ты объясняешь подросткам, как устроено страхование.

Правила:
- по-русски, на «ты», 3–6 предложений, без эмодзи и без заигрывания;
- если уместно — короткий бытовой пример;
- отвечай только про страхование, риски и личные финансы;
- на вопрос не по теме скажи об этом прямо и коротко;
- не называй конкретные страховые компании.`;

export interface ModelCoachOptions {
  baseUrl: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
  /** Подменяется в тестах: живой транспорт в них не участвует. */
  fetchImpl?: typeof fetch;
  fallback?: Coach;
}

/**
 * Числа партии, которые модели разрешено называть.
 *
 * Хранятся по модулю: разрядка из текста вынимается регулярным выражением по
 * цифрам, знак в неё не попадает. При отрицательном остатке бюджета — а он
 * уходит в минус при банкротстве — сверка со знаковым значением отвергала бы
 * совершенно правильную сумму.
 */
export function allowedAmounts(input: ReviewInput): Set<number> {
  const { results } = input;
  const allowed = new Set<number>();
  const add = (value: number): void => {
    allowed.add(Math.abs(Math.round(value)));
  };

  add(INITIAL_BUDGET);
  add(results.budgetRemaining);
  add(results.totalSpent);
  add(results.totalLost);
  add(results.totalSaved);

  for (const record of results.monthHistory) {
    add(record.financialImpact);
    add(record.budgetAfter);
    add(record.premiumsCharged);
    if (record.event) {
      add(record.event.financialLoss);
      add(record.event.insuranceCoverage);
    }
    for (const insurance of record.insurancesBought) {
      add(insurance.monthlyCost);
      add(insurance.coverageAmount);
    }
  }
  return allowed;
}

/**
 * Все числа от 1000 и выше в тексте должны быть известными.
 * Мелкие числа не проверяются: это месяцы, баллы и «три полиса»,
 * выдумать ими вред невозможно.
 */
export function usesOnlyKnownAmounts(text: string, allowed: ReadonlySet<number>): boolean {
  const withoutSeparators = text.replace(/(\d)[   ](?=\d{3}\b)/g, '$1');
  const numbers = withoutSeparators.match(/\d+/g) ?? [];
  return numbers
    .map((token) => Number.parseInt(token, 10))
    .filter((value) => value >= 1000)
    .every((value) => allowed.has(value));
}

function buildReviewPrompt({ playerName, results }: ReviewInput): string {
  const months = results.monthHistory
    .map((record) => {
      if (!record.event) return `${record.monthName}: без происшествий`;
      const status = record.wasInsured
        ? 'полис был, покрытие сработало'
        : `полиса не было, из кармана ${formatMoney(Math.abs(record.financialImpact))}`;
      return `${record.monthName}: «${record.event.title}» — ${status}`;
    })
    .join('\n');

  return `ДАННЫЕ ПАРТИИ
Имя: ${playerName || 'без имени'}
Счёт: ${results.score} из 100, уровень «${results.title}»
Стартовый бюджет: ${formatMoney(INITIAL_BUDGET)}
Осталось: ${formatMoney(results.budgetRemaining)}
Премии: ${formatMoney(results.totalSpent)}
Потеряно без полиса: ${formatMoney(results.totalLost)}
Закрыто страховой: ${formatMoney(results.totalSaved)}

ПО МЕСЯЦАМ
${months}

Напиши разбор. Никаких сумм, кроме перечисленных выше.`;
}

interface ChatCompletion {
  choices?: { message?: { content?: string } }[];
}

export class ModelCoach implements Coach {
  readonly name: string;

  private readonly options: Required<Omit<ModelCoachOptions, 'fetchImpl' | 'fallback'>>;
  private readonly fetchImpl: typeof fetch;
  private readonly fallback: Coach;

  constructor(options: ModelCoachOptions) {
    this.options = {
      baseUrl: options.baseUrl,
      model: options.model,
      apiKey: options.apiKey,
      timeoutMs: options.timeoutMs,
    };
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.fallback = options.fallback ?? new RuleBasedCoach();
    this.name = `model:${options.model}`;
  }

  async review(input: ReviewInput): Promise<Review> {
    const text = await this.complete(REVIEW_SYSTEM, [
      { role: 'user', content: buildReviewPrompt(input) },
    ]);
    if (text && usesOnlyKnownAmounts(text, allowedAmounts(input))) {
      return { text, mode: 'model' };
    }
    return this.fallback.review(input);
  }

  async answer(messages: readonly ChatTurn[]): Promise<Reply> {
    // Контекст обрезаем: длинная переписка не улучшает ответ про франшизу,
    // но линейно увеличивает счёт.
    const recent = messages.slice(-8);
    const text = await this.complete(CHAT_SYSTEM, recent);
    if (text) return { text, mode: 'model' };
    return this.fallback.answer(messages);
  }

  /** Возвращает текст либо пустую строку — решение о запасном пути принимает вызывающий. */
  private async complete(system: string, messages: readonly ChatTurn[]): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.options.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify({
          model: this.options.model,
          messages: [{ role: 'system', content: system }, ...messages],
          temperature: 0.6,
          max_tokens: 700,
        }),
        signal: controller.signal,
      });
      if (!response.ok) return '';
      const payload = (await response.json()) as ChatCompletion;
      return stripReasoning(payload.choices?.[0]?.message?.content ?? '');
    } catch {
      // Сюда попадают таймаут, обрыв соединения и невалидный JSON. Все три
      // означают одно: текста нет. Повторять не пытаемся — экран разбора
      // ждёт человек, а не пакетный обработчик.
      return '';
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Рассуждающие модели оборачивают черновик в <think>…</think>. Пользователю он не нужен. */
export function stripReasoning(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}
