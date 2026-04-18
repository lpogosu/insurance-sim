import { describe, expect, it, vi } from 'vitest';
import {
  CoachConfigError,
  DEFAULT_MODEL,
  ModelCoach,
  RuleBasedCoach,
  buildCoach,
  readCoachConfig,
  requiresNetwork,
} from '@/coach';
import { allowedAmounts, stripReasoning, usesOnlyKnownAmounts } from '@/coach/model';
import { getResults } from '@/engine/rules';
import { playGame, strategies } from './helpers';

const results = getResults(playGame(42, strategies.reactive).state);
const input = { playerName: 'Лиза', results };

function jsonResponse(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('конфигурация', () => {
  it('по умолчанию не требует сети', () => {
    const config = readCoachConfig({});
    expect(config.provider).toBe('rules');
    expect(requiresNetwork(config)).toBe(false);
  });

  it('модель без ключа — ошибка запуска, а не тихий откат', () => {
    const config = readCoachConfig({ COACH_PROVIDER: 'model' });
    expect(() => buildCoach(config)).toThrow(CoachConfigError);
  });

  it('неизвестный провайдер отвергается', () => {
    expect(() => readCoachConfig({ COACH_PROVIDER: 'openai' })).toThrow(CoachConfigError);
  });

  it('нечисловой таймаут отвергается', () => {
    expect(() => readCoachConfig({ COACH_TIMEOUT_MS: 'скоро' })).toThrow(CoachConfigError);
  });

  it('офлайн-конфигурация собирает детерминированного тренера', () => {
    expect(buildCoach(readCoachConfig({})).name).toBe('rules');
  });

  it('имя реализации содержит модель, чтобы путь был виден в /api/health', () => {
    const coach = buildCoach(readCoachConfig({ COACH_PROVIDER: 'model', COACH_API_KEY: 'k' }));
    expect(coach.name).toBe(`model:${DEFAULT_MODEL}`);
  });
});

describe('детерминированный тренер', () => {
  it('на одном входе даёт побайтово одинаковый разбор', async () => {
    const coach = new RuleBasedCoach();
    const first = await coach.review(input);
    const second = await coach.review(input);
    expect(second.text).toBe(first.text);
    expect(first.mode).toBe('rules');
  });

  it('называет только числа этой партии', async () => {
    const coach = new RuleBasedCoach();
    const { text } = await coach.review(input);
    expect(usesOnlyKnownAmounts(text, allowedAmounts(input))).toBe(true);
  });

  it('отвечает по существу на вопрос из справочника', async () => {
    const coach = new RuleBasedCoach();
    const { text } = await coach.answer([{ role: 'user', content: 'Что такое франшиза?' }]);
    expect(text).toContain('франшиза');
  });

  it('распознаёт вопрос по ключевому слову, а не по точному совпадению', async () => {
    const coach = new RuleBasedCoach();
    const { text } = await coach.answer([
      { role: 'user', content: 'а зачем вообще страховать телефон если он в чехле' },
    ]);
    expect(text).toContain('экран');
  });

  it('разделяет «не по теме» и «спроси конкретнее»', async () => {
    const coach = new RuleBasedCoach();
    const offTopic = await coach.answer([{ role: 'user', content: 'кто выиграл вчера матч' }]);
    const tooBroad = await coach.answer([{ role: 'user', content: 'расскажи про страхование' }]);
    expect(offTopic.text).not.toBe(tooBroad.text);
    expect(offTopic.text).toContain('только про страхование');
  });
});

describe('проверка чисел в ответе модели', () => {
  it('пропускает текст, где все суммы из партии', () => {
    const allowed = new Set([50000, 12500]);
    expect(usesOnlyKnownAmounts('Осталось 12 500 ₽ из 50 000 ₽.', allowed)).toBe(true);
  });

  it('ловит выдуманную сумму', () => {
    const allowed = new Set([50000, 12500]);
    expect(usesOnlyKnownAmounts('Ты потерял 31 000 ₽.', allowed)).toBe(false);
  });

  it('не придирается к мелким числам', () => {
    // 6 месяцев, 3 полиса, 74 балла — выдумать этим вред нельзя.
    expect(usesOnlyKnownAmounts('За 6 месяцев ты купил 3 полиса и набрал 74 балла.', new Set())).toBe(
      true,
    );
  });

  it('срезает рассуждения модели', () => {
    expect(stripReasoning('<think>прикидываю</think>Ответ.')).toBe('Ответ.');
  });
});

describe('тренер поверх модели', () => {
  const options = {
    baseUrl: 'https://example.invalid/v1',
    model: 'test-model',
    apiKey: 'test-key',
    timeoutMs: 500,
  };

  it('возвращает ответ модели, когда числа сходятся', async () => {
    const text = `Осталось ${Math.round(results.budgetRemaining)} рублей, это нормальный итог.`;
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(text));
    const coach = new ModelCoach({ ...options, fetchImpl: fetchImpl as unknown as typeof fetch });

    const review = await coach.review(input);
    expect(review.mode).toBe('model');
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('выбрасывает ответ с выдуманной суммой и отдаёт детерминированный', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse('Ты потерял 999 999 рублей.'));
    const coach = new ModelCoach({ ...options, fetchImpl: fetchImpl as unknown as typeof fetch });

    const review = await coach.review(input);
    expect(review.mode).toBe('rules');
    expect(review.text).toBe((await new RuleBasedCoach().review(input)).text);
  });

  it('падение транспорта переводит на детерминированный путь, а не роняет экран', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
    const coach = new ModelCoach({ ...options, fetchImpl: fetchImpl as unknown as typeof fetch });

    const review = await coach.review(input);
    expect(review.mode).toBe('rules');
    expect(review.text.length).toBeGreaterThan(0);
  });

  it('ответ не 200 обрабатывается так же, как обрыв', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('rate limited', { status: 429 }));
    const coach = new ModelCoach({ ...options, fetchImpl: fetchImpl as unknown as typeof fetch });

    expect((await coach.answer([{ role: 'user', content: 'что такое ДМС' }])).mode).toBe('rules');
  });

  it('битый JSON не приводит к исключению', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{не json', { status: 200 }));
    const coach = new ModelCoach({ ...options, fetchImpl: fetchImpl as unknown as typeof fetch });

    expect((await coach.review(input)).mode).toBe('rules');
  });

  it('в чат уходит не больше восьми последних реплик', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse('Ответ.'));
    const coach = new ModelCoach({ ...options, fetchImpl: fetchImpl as unknown as typeof fetch });

    const messages = Array.from({ length: 12 }, (_, index) => ({
      role: 'user' as const,
      content: `вопрос ${index}`,
    }));
    await coach.answer(messages);

    const body = JSON.parse(String(fetchImpl.mock.calls[0][1].body)) as {
      messages: { role: string }[];
    };
    // Системная реплика плюс восемь последних.
    expect(body.messages).toHaveLength(9);
  });
});
