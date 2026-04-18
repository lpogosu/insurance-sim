/**
 * Обработчики API без привязки к Next.
 *
 * Route handler остаётся тремя строками, а вся логика — обычная функция от
 * `Request` к объекту. Так контракт можно проверить тестом, не поднимая
 * сервер и не подменяя фреймворк.
 */

import type { ChatTurn } from '@/coach';
import type { GameResults } from '@/engine';
import { ALL_EVENTS } from '@/content/events';
import { QUIZ_QUESTIONS } from '@/content/quiz';
import { getContext, describeContext, type ServerContext } from './context';
import { InitDataError, authorize } from './telegram';

export interface HandlerResult {
  status: number;
  body: unknown;
}

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 500;

function guard(context: ServerContext, request: Request): HandlerResult | null {
  try {
    authorize(context.telegram, request.headers.get('x-telegram-init-data'));
    return null;
  } catch (error) {
    if (error instanceof InitDataError) {
      // Причина не уходит наружу: она подсказывала бы, какую часть подписи
      // подбирать. В логах она есть.
      return { status: 401, body: { error: 'telegram_init_data_invalid' } };
    }
    throw error;
  }
}

function isChatTurn(value: unknown): value is ChatTurn {
  if (typeof value !== 'object' || value === null) return false;
  const turn = value as Partial<ChatTurn>;
  return (
    (turn.role === 'user' || turn.role === 'assistant') &&
    typeof turn.content === 'string' &&
    turn.content.trim().length > 0
  );
}

function isResults(value: unknown): value is GameResults {
  if (typeof value !== 'object' || value === null) return false;
  const results = value as Partial<GameResults>;
  return (
    typeof results.score === 'number' &&
    typeof results.title === 'string' &&
    typeof results.budgetRemaining === 'number' &&
    typeof results.totalSpent === 'number' &&
    typeof results.totalLost === 'number' &&
    typeof results.totalSaved === 'number' &&
    Array.isArray(results.monthHistory)
  );
}

export async function handleHealth(context: ServerContext = getContext()): Promise<HandlerResult> {
  return {
    status: 200,
    body: {
      status: 'ok',
      events: ALL_EVENTS.length,
      quizQuestions: QUIZ_QUESTIONS.length,
      ...describeContext(context),
    },
  };
}

export async function handleReview(
  request: Request,
  context: ServerContext = getContext(),
): Promise<HandlerResult> {
  const denied = guard(context, request);
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return { status: 400, body: { error: 'invalid_json' } };
  }

  const body = payload as { playerName?: unknown; results?: unknown };
  if (!isResults(body.results)) {
    return { status: 400, body: { error: 'invalid_results' } };
  }

  const playerName = typeof body.playerName === 'string' ? body.playerName.slice(0, 40) : '';
  const review = await context.coach.review({ playerName, results: body.results });
  return { status: 200, body: review };
}

export async function handleCoach(
  request: Request,
  context: ServerContext = getContext(),
): Promise<HandlerResult> {
  const denied = guard(context, request);
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return { status: 400, body: { error: 'invalid_json' } };
  }

  const body = payload as { messages?: unknown };
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return { status: 400, body: { error: 'invalid_messages' } };
  }
  if (body.messages.length > MAX_MESSAGES) {
    return { status: 400, body: { error: 'too_many_messages' } };
  }
  if (!body.messages.every(isChatTurn)) {
    return { status: 400, body: { error: 'invalid_messages' } };
  }

  const messages: ChatTurn[] = body.messages.map((turn) => ({
    role: turn.role,
    content: turn.content.slice(0, MAX_MESSAGE_LENGTH),
  }));

  const reply = await context.coach.answer(messages);
  return { status: 200, body: reply };
}
