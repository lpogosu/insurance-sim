'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { useGameStore } from '@/hooks/useGame';
import { LESSONS } from '@/content/lessons';
import { formatMoney } from '@/engine';
import type { InsuranceType } from '@/engine';
import { CATEGORY_ICONS } from '@/lib/icons';

// Интерактивные элементы для каждого типа урока
function SlidersInteractive() {
  const [probability, setProbability] = useState(50);
  const [damage, setDamage] = useState(12000);

  const probLabel = probability < 30 ? 'низкий' : probability < 65 ? 'средний' : 'высокий';
  const damageLabel = damage < 5000 ? 'мелкий' : damage < 15000 ? 'средний' : 'серьёзный';
  // Нужна страховка если: катастрофический ущерб ИЛИ ожидаемые потери > 1500₽
  const expectedLoss = (probability / 100) * damage;
  const needInsurance = damage >= 15000 || expectedLoss > 1500;

  return (
    <div className="space-y-4 py-3">
      <div>
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>Шанс, что случится</span>
          <span className="font-semibold">{probLabel} ({probability}%)</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={probability}
          onChange={(e) => setProbability(Number(e.target.value))}
          className="w-full accent-accent-brand h-2 rounded-full"
        />
      </div>
      <div>
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>Сколько потеряешь</span>
          <span className="font-semibold">{formatMoney(damage)}</span>
        </div>
        <input
          type="range"
          min={1000}
          max={30000}
          step={1000}
          value={damage}
          onChange={(e) => setDamage(Number(e.target.value))}
          className="w-full accent-accent-peach h-2 rounded-full"
        />
      </div>
      <div className={`text-center p-3 rounded-xl ${needInsurance ? 'bg-accent-coral/10' : 'bg-accent-mint/10'}`}>
        <p className={`text-sm font-bold ${needInsurance ? 'text-accent-coral' : 'text-accent-mint'}`}>
          {needInsurance ? 'Лучше застраховать!' : 'Можно не страховать'}
        </p>
        <p className="text-xs text-text-muted mt-1">
          Шанс {probLabel}, ущерб {damageLabel} ({formatMoney(damage)})
        </p>
      </div>
    </div>
  );
}

function ComparisonInteractive() {
  return (
    <div className="py-3">
      <p className="text-xs text-text-secondary text-center mb-3">
        Маленький платёж защищает от большого убытка
      </p>
      <div className="flex items-end justify-center gap-8">
        <motion.div
          className="flex flex-col items-center"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="w-20 bg-gradient-to-t from-accent-mint to-accent-sage rounded-t-lg" style={{ height: 40 }} />
          <span className="text-[10px] text-text-muted mt-2">Со страховкой</span>
          <span className="text-xs font-bold text-accent-mint">Платишь: {formatMoney(800)}/мес</span>
        </motion.div>
        <motion.div
          className="flex flex-col items-center"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="w-20 bg-gradient-to-t from-accent-coral to-accent-peach rounded-t-lg" style={{ height: 160 }} />
          <span className="text-[10px] text-text-muted mt-2">Без страховки</span>
          <span className="text-xs font-bold text-accent-coral">Потеряешь: {formatMoney(12000)}</span>
        </motion.div>
      </div>
    </div>
  );
}

function CardsQuizInteractive() {
  const scenarios = [
    { text: 'Телефон сломался, потому что ты его уронил', answer: true, hint: 'Да, страховой случай' },
    { text: 'Телефон стал тормозить через 3 года', answer: false, hint: 'Нет, это износ' },
    { text: 'Телефон украли из кармана', answer: true, hint: 'Да, если есть защита от кражи' },
  ];
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});

  const handleAnswer = (idx: number, val: boolean) => {
    setAnswers((prev) => ({ ...prev, [idx]: val }));
  };

  return (
    <div className="space-y-3 py-3">
      <p className="text-xs font-semibold text-accent-brand text-center mb-1">
        {'\u{1F447}'} Нажми: это страховой случай или нет?
      </p>
      {scenarios.map((s, i) => {
        const answered = answers[i] !== undefined && answers[i] !== null;
        const correct = answers[i] === s.answer;

        return (
          <div key={i} className="glass-panel-sm p-3">
            <p className="text-sm text-text-primary mb-2">{s.text}</p>
            {answered ? (
              <p className={`text-xs font-semibold ${correct ? 'text-accent-mint' : 'text-accent-coral'}`}>
                {s.hint}
              </p>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAnswer(i, true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-accent-brand text-white font-medium hover:bg-accent-brand-hover transition"
                >
                  Да, страховой
                </button>
                <button
                  onClick={() => handleAnswer(i, false)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-bg-base text-text-secondary font-medium hover:bg-border-light transition border border-border-light"
                >
                  Нет
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CalculatorInteractive() {
  // Нейтральный учебный пример — не зависит от текущего состояния игрока
  const example = {
    damage: 9000,
    premium: 800,
    covered: 8000,
    outOfPocket: 1000,
  };

  return (
    <div className="space-y-3 py-3">
      <div className="glass-panel-sm p-3">
        <p className="text-xs text-text-muted mb-1">Пример</p>
        <p className="text-sm text-text-primary">
          Ты разбил телефон. Ремонт стоит {formatMoney(example.damage)}.
        </p>
      </div>
      <div className="flex justify-between items-center glass-panel-sm p-3">
        <span className="text-xs text-text-secondary">Заплатил за страховку</span>
        <span className="text-sm font-bold text-text-primary">{formatMoney(example.premium)}</span>
      </div>
      <div className="flex justify-between items-center glass-panel-sm p-3">
        <span className="text-xs text-text-secondary">Страховка покрыла</span>
        <span className="text-sm font-bold text-accent-mint">{formatMoney(example.covered)}</span>
      </div>
      <div className="flex justify-between items-center p-3 rounded-xl bg-accent-mint/10 border-l-4 border-accent-mint">
        <span className="text-xs text-text-secondary font-medium">Твой реальный убыток</span>
        <span className="text-sm font-extrabold text-accent-mint">{formatMoney(example.outOfPocket)}</span>
      </div>
      <p className="text-xs text-text-muted text-center italic">
        Вместо {formatMoney(example.damage)} ты потерял только {formatMoney(example.outOfPocket)}
      </p>
    </div>
  );
}

function CategoryGlyph({ type }: { type: InsuranceType }) {
  const Icon = CATEGORY_ICONS[type];
  return <Icon size={24} className="mx-auto text-text-primary" aria-hidden />;
}

function CategoryMapInteractive() {
  const { activeInsurances } = useGameStore();
  const usedTypes = new Set(activeInsurances.map((i) => i.type));
  const categories = [
    { type: 'device', label: 'Гаджеты' },
    { type: 'travel', label: 'Путешествия' },
    { type: 'sports', label: 'Спорт' },
    { type: 'event', label: 'Мероприятия' },
    { type: 'digital', label: 'Цифровое' },
    { type: 'health', label: 'Здоровье' },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-2 py-3">
      {categories.map((c) => (
        <div
          key={c.type}
          className={`glass-panel-sm p-3 text-center transition ${usedTypes.has(c.type) ? 'ring-2 ring-accent-mint/50' : 'opacity-60'}`}
        >
          <CategoryGlyph type={c.type} />
          <p className="text-[10px] mt-1 text-text-secondary">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

function ChecklistInteractive() {
  const scenarios = [
    { text: 'Порвались кроссовки за 2 000 руб.', shouldInsure: false, hint: 'Мелкая сумма — проще купить новые' },
    { text: 'Телефон за 30 000 руб. — риск разбить', shouldInsure: true, hint: 'Дорогая вещь + высокий риск = страхуй' },
    { text: 'Перелёт за границу на 2 недели', shouldInsure: true, hint: 'Лечение за границей стоит сотни тысяч' },
  ];
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});

  const handleAnswer = (idx: number, val: boolean) => {
    setAnswers((prev) => ({ ...prev, [idx]: val }));
  };

  return (
    <div className="space-y-3 py-3">
      <p className="text-xs font-semibold text-accent-brand text-center mb-1">
        Нужно страховать или нет?
      </p>
      {scenarios.map((s, i) => {
        const answered = answers[i] !== undefined && answers[i] !== null;
        const correct = answers[i] === s.shouldInsure;
        return (
          <div key={i} className="glass-panel-sm p-3">
            <p className="text-sm text-text-primary mb-2">{s.text}</p>
            {answered ? (
              <p className={`text-xs font-semibold ${correct ? 'text-accent-mint' : 'text-accent-coral'}`}>
                {correct ? 'Верно! ' : 'Не совсем. '}{s.hint}
              </p>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAnswer(i, true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-accent-brand/10 text-accent-brand font-medium hover:bg-accent-brand/20 transition"
                >
                  Страховать
                </button>
                <button
                  onClick={() => handleAnswer(i, false)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-bg-base text-text-secondary font-medium hover:bg-border-light transition"
                >
                  Не нужно
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const INTERACTIVES: Record<string, React.FC> = {
  sliders: SlidersInteractive,
  comparison: ComparisonInteractive,
  'cards-quiz': CardsQuizInteractive,
  calculator: CalculatorInteractive,
  'category-map': CategoryMapInteractive,
  checklist: ChecklistInteractive,
};

export default function LessonCard() {
  const { currentMonth, completeLesson, skipLesson } = useGameStore();
  const lesson = LESSONS.find((l) => l.month === currentMonth);

  if (!lesson) {
    completeLesson();
    return null;
  }

  const Interactive = INTERACTIVES[lesson.interactiveType];

  return (
    <GlassPanel className="p-6 max-w-lg mx-auto">
      <div className="text-center mb-4">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Урок {lesson.id} из 6
        </span>
        <h2 className="text-xl font-bold text-text-primary mt-1">
          {lesson.title}
        </h2>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mt-2">
        {lesson.text}
      </p>

      <p className="text-xs text-text-muted mt-2 italic">
        {lesson.connectionToGame}
      </p>

      {Interactive && <div className="mt-4"><Interactive /></div>}

      <div className="flex gap-2 sm:gap-3 mt-5 justify-center">
        <button onClick={skipLesson} className="btn-secondary text-xs sm:text-sm !px-5 sm:!px-8 !py-3">
          Пропустить
        </button>
        <button onClick={completeLesson} className="btn-primary text-xs sm:text-sm !px-5 sm:!px-8 !py-3">
          Дальше
        </button>
      </div>
    </GlassPanel>
  );
}
