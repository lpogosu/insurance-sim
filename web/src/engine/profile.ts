/** Профиль игрока и итоговые выводы — то, что читают на экране результата. */

import { INITIAL_BUDGET, calculateScore, formatMoney, uniqueInsuranceTypes } from './rules';
import type { GameState, LearningOutcome, RiskProfileData } from './types';

/**
 * Порядок веток значим: «не купил ничего» проверяется раньше среднего
 * результата, иначе игрок, которому просто повезло, получал бы «расчётчика».
 */
export function getRiskProfile(state: GameState): RiskProfileData {
  const score = calculateScore(state);
  const diversity = uniqueInsuranceTypes(state);

  if (score >= 85 && diversity >= 4) {
    return {
      type: 'Страховой стратег',
      description:
        'Ты диверсифицировал риски и принимал умные решения. В реальной жизни ты бы стал отличным финансовым консультантом.',
      icon: 'strategist',
      color: '#f59e0b',
    };
  }
  if (state.totalSpentOnInsurance === 0) {
    return {
      type: 'Азартный рисковщик',
      description:
        'Ты не купил ни одной страховки и рискнул всем. Иногда это работает, но в реальной жизни — опасная стратегия.',
      icon: 'risk-taker',
      color: '#ef4444',
    };
  }
  if (score >= 65) {
    return {
      type: 'Умный расчётчик',
      description:
        'Ты хорошо оценивал риски и выбирал важное. Продолжай в том же духе — это настоящая финансовая грамотность.',
      icon: 'calculator',
      color: '#22c55e',
    };
  }
  if (diversity >= 3) {
    return {
      type: 'Исследователь',
      description:
        'Ты попробовал разные виды страховок. Теперь знаешь, как они работают — осталось научиться выбирать нужные.',
      icon: 'explorer',
      color: '#3b82f6',
    };
  }
  return {
    type: 'Начинающий',
    description:
      'У тебя всё впереди! Попробуй пройти ещё раз, обращая внимание на уроки — и результат будет лучше.',
    icon: 'beginner',
    color: '#8b5cf6',
  };
}

/** Не больше трёх выводов: столько помещается на экран результата. */
export function generateLearningOutcomes(state: GameState): LearningOutcome[] {
  const outcomes: LearningOutcome[] = [
    {
      title: 'Что такое страхование',
      text: 'Страхование — это способ защитить себя от крупных неожиданных расходов, заплатив небольшую сумму заранее.',
    },
  ];

  if (state.totalLostToEvents > 0) {
    const share = Math.round((state.totalLostToEvents / INITIAL_BUDGET) * 100);
    outcomes.push({
      title: 'Цена риска',
      text: `Ты потерял ${formatMoney(state.totalLostToEvents)} из-за событий, от которых не был застрахован. Это ${share}% от начального бюджета.`,
    });
  }

  if (state.totalSavedByInsurance > 0) {
    const ratio = Math.round(
      (state.totalSpentOnInsurance / state.totalSavedByInsurance) * 100,
    );
    outcomes.push({
      title: 'Страховка работает',
      text: `Страховки сохранили тебе ${formatMoney(state.totalSavedByInsurance)}. Ты заплатил ${formatMoney(state.totalSpentOnInsurance)} премий — это ${ratio}% от того, что могло бы стоить без защиты.`,
    });
  }

  if (
    state.totalSpentOnInsurance > state.totalSavedByInsurance &&
    state.totalSavedByInsurance > 0
  ) {
    outcomes.push({
      title: 'Баланс — это ключ',
      text: 'Ты потратил на страховки больше, чем они покрыли. Это не ошибка — невозможно предсказать будущее. Но в реальной жизни стоит выбирать страховки под свои главные риски, а не брать всё подряд.',
    });
  }

  return outcomes.slice(0, 3);
}
