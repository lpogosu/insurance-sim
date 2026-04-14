/**
 * Разбор без языковой модели.
 *
 * Разбор партии собирается из чисел, которые уже посчитал движок: остаток
 * бюджета, сумма премий, покрытие, месяцы без защиты. Ни одно предложение не
 * содержит числа, которого нет в `GameResults`, — это свойство проверяется
 * тестом, а не обещанием в промпте.
 *
 * Ответы на вопросы — справочник по ключевым словам. Он отвечает на то, что
 * подросток спрашивает на самом деле (франшиза, ДМС, «а это не развод?»),
 * и честно говорит «не знаю», когда вопрос не про страхование.
 */

import { formatMoney, INITIAL_BUDGET } from '@/engine';
import type { ChatTurn, Coach, Reply, Review, ReviewInput } from './types';

interface Entry {
  /** Подстроки в нижнем регистре; совпадение любой включает ответ. */
  triggers: readonly string[];
  question: string;
  answer: string;
}

export const KNOWLEDGE: readonly Entry[] = [
  {
    triggers: ['что такое страхование', 'как работает страхован', 'зачем страхован'],
    question: 'Что такое страхование?',
    answer:
      'Договор, по которому ты платишь небольшую сумму регулярно, а страховая обязуется закрыть крупный расход, если случится оговорённая неприятность. Смысл не в том, чтобы «выиграть», а в том, чтобы одна поломка не съела весь бюджет.',
  },
  {
    triggers: ['франшиз'],
    question: 'Что такое франшиза?',
    answer:
      'Часть ущерба, которую ты платишь сам. Ремонт на 12 000 ₽ при франшизе 2 000 ₽ — твои 2 000, страховой 10 000. Чем выше франшиза, тем дешевле полис: ты забираешь себе мелкие расходы и страхуешь только крупные.',
  },
  {
    triggers: ['телефон', 'гаджет', 'смартфон', 'ноутбук'],
    question: 'Зачем страховать телефон?',
    answer:
      'Замена экрана у флагмана обходится в 10–15 тысяч, а сам телефон стоит дороже. Полис на гаджет покрывает случайное повреждение, залитие и кражу. Считать надо так: сравни годовую стоимость полиса с суммой, которую ты не сможешь достать за один вечер.',
  },
  {
    triggers: ['путешеств', 'отдых', 'поездк', 'за границ', 'вкр', 'турист'],
    question: 'Нужна ли страховка в поездке?',
    answer:
      'За границей — да. Приём врача там стоит десятки тысяч рублей, а госпитализация — сотни. Туристический полис закрывает не только лечение, но и отмену рейса с потерей багажа.',
  },
  {
    triggers: ['дмс', 'медицин', 'врач', 'стоматолог'],
    question: 'Что такое ДМС?',
    answer:
      'Добровольное медицинское страхование — полис, по которому ты ходишь в платные клиники без отдельной оплаты каждого приёма. Обычно включает анализы, специалистов и часто стоматологию.',
  },
  {
    triggers: ['развод', 'обман', 'не плат', 'не нужн', 'кидал'],
    question: 'Страховка — это развод?',
    answer:
      'Нет, если читать договор. Страховая платит по условиям полиса, и отказ можно оспорить в Банке России. Разочарование обычно возникает там, где человек застраховал не то или не прочитал исключения.',
  },
  {
    triggers: ['осаго', 'машин', 'автомобил'],
    question: 'Что такое ОСАГО?',
    answer:
      'Обязательное страхование ответственности водителя. Оно платит не тебе, а тому, кому ты причинил вред в ДТП. Свою машину защищает уже КАСКО — это другой, добровольный полис.',
  },
  {
    triggers: ['возмещен', 'выплат', 'сколько заплат'],
    question: 'Как считается выплата?',
    answer:
      'Выплата — это меньшее из двух: фактический ущерб и лимит по полису, минус франшиза. Поэтому лимит важнее красивой цены: полис на 10 000 ₽ при ущербе в 40 000 ₽ закроет только четверть.',
  },
  {
    triggers: ['спорт', 'травм', 'скейт', 'футбол'],
    question: 'Зачем спортивная страховка?',
    answer:
      'Она закрывает лечение после травмы на тренировке или на улице: приём травматолога, снимок, реабилитацию. Для секций её часто требуют для допуска к соревнованиям.',
  },
];

const OFF_TOPIC =
  'Я отвечаю только про страхование, риски и деньги. Спроси про конкретный полис — например, что такое франшиза или зачем нужна страховка в поездке.';

const TOO_GENERAL =
  'Уточни вопрос: про какой риск речь? Телефон, поездка, спорт, аккаунт — для каждого работает свой полис, и условия у них разные.';

export function lookup(question: string): string {
  const normalised = question.toLowerCase();
  const hit = KNOWLEDGE.find((entry) =>
    entry.triggers.some((trigger) => normalised.includes(trigger)),
  );
  if (hit) return hit.answer;
  // Слово «страхов» без уточнения — вопрос по теме, но слишком общий,
  // и это разные ответы: «не знаю» и «спроси конкретнее» не одно и то же.
  if (normalised.includes('страхов') || normalised.includes('полис')) return TOO_GENERAL;
  return OFF_TOPIC;
}

export function composeReview({ playerName, results }: ReviewInput): string {
  const parts: string[] = [];
  const name = playerName.trim();
  const address = name.length > 0 ? `${name}, ` : '';

  parts.push(
    `${address}итог — ${results.score} из 100, уровень «${results.title}». Из ${formatMoney(INITIAL_BUDGET)} осталось ${formatMoney(results.budgetRemaining)}.`,
  );

  if (results.totalSpent === 0) {
    parts.push(
      `Ты не купил ни одного полиса и оставил все риски себе. За полгода это стоило ${formatMoney(results.totalLost)}.`,
    );
  } else if (results.totalSaved === 0) {
    parts.push(
      `Премии обошлись в ${formatMoney(results.totalSpent)}, но ни одно событие в них не попало. Это не проигрыш: так выглядит год, в котором страховка не пригодилась.`,
    );
  } else {
    const ratio = results.efficiency;
    parts.push(
      `Премии обошлись в ${formatMoney(results.totalSpent)}, страховая закрыла ${formatMoney(results.totalSaved)} — ${ratio.toFixed(1)} ₽ покрытия на каждый рубль премии.`,
    );
  }

  const uninsured = results.monthHistory.filter((record) => record.event && !record.wasInsured);
  if (uninsured.length > 0) {
    const worst = uninsured.reduce((a, b) => (a.financialImpact <= b.financialImpact ? a : b));
    parts.push(
      `Больнее всего вышел ${worst.monthName.toLowerCase()}: «${worst.event!.title}» без полиса, ${formatMoney(Math.abs(worst.financialImpact))} из кармана.`,
    );
  } else if (results.monthHistory.some((record) => record.event)) {
    parts.push('Ни одно событие не застало тебя без подходящего полиса — это редкий результат.');
  }

  parts.push(
    'Правило на жизнь простое: страхуй то, чего не сможешь оплатить сразу, и не трать премию на то, что закроешь из карманных денег.',
  );

  return parts.join(' ');
}

/** Детерминированный тренер: одинаковый вход даёт побайтово одинаковый выход. */
export class RuleBasedCoach implements Coach {
  readonly name = 'rules';

  async review(input: ReviewInput): Promise<Review> {
    return { text: composeReview(input), mode: 'rules' };
  }

  async answer(messages: readonly ChatTurn[]): Promise<Reply> {
    const lastUser = [...messages].reverse().find((turn) => turn.role === 'user');
    return { text: lookup(lastUser?.content ?? ''), mode: 'rules' };
  }
}
