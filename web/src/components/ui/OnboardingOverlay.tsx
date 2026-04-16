'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Compass, X, ArrowRight, Shield, Wallet, Target } from 'lucide-react';

const STORAGE_KEY = 'risklab_onboarding_done';

interface Step {
  icon: React.FC<{ size?: number; className?: string }>;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    icon: Shield,
    title: 'Это РискЛаб',
    text: 'Симулятор, где ты проживаешь 6 месяцев и учишься управлять рисками. Не лекция — реальные ситуации из жизни.',
  },
  {
    icon: Wallet,
    title: '50 000 рублей на полгода',
    text: 'Это твой бюджет. Каждый месяц можно купить страховку, но на все сразу не хватит. Выбирай, что важнее.',
  },
  {
    icon: Gamepad2,
    title: 'Каждый месяц — событие',
    text: 'Разбился телефон, отменили рейс, украли аккаунт. Есть страховка — она покроет. Нет — платишь сам.',
  },
  {
    icon: Target,
    title: 'Цель — сохранить бюджет',
    text: 'В конце — оценка по 100-балльной шкале. Учитывается: сколько сохранил, сколько раз страховка сработала, разнообразие решений.',
  },
  {
    icon: Compass,
    title: 'Не только игра',
    text: 'Раздел «Исследуй» — квиз, мифы, глоссарий терминов. Раздел «Чат» — AI-наставник отвечает на вопросы.',
  },
];

export default function OnboardingOverlay() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const finish = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const next = () => {
    if (step + 1 >= STEPS.length) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  };

  if (!show) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step + 1 >= STEPS.length;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/25 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={finish}
        />

        <motion.div
          className="relative glass-panel p-8 max-w-sm w-full text-center z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <button
            onClick={finish}
            aria-label="Закрыть"
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-bg-base flex items-center justify-center text-text-muted hover:text-text-primary transition"
          >
            <X size={14} />
          </button>

          {/* Progress */}
          <div className="flex justify-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === step ? 'w-5 bg-accent-brand' : i < step ? 'w-1.5 bg-accent-brand/40' : 'w-1.5 bg-border-light'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-accent-brand"
            >
              <Icon size={26} className="text-white" />
            </motion.div>
          </AnimatePresence>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <h3 className="font-display text-base font-bold text-text-primary mb-2">
                {current.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                {current.text}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 justify-center">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="btn-secondary text-xs px-5 py-2.5"
              >
                Назад
              </button>
            )}
            <button
              onClick={next}
              className="btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-1.5"
            >
              {isLast ? 'Понятно!' : 'Дальше'}
              <ArrowRight size={14} />
            </button>
          </div>

          <p className="text-[11px] text-text-muted mt-4">
            {step + 1} из {STEPS.length}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
