'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { X, Check, CheckCircle, XCircle, RotateCcw, Zap } from 'lucide-react';
import { MYTH_CARDS } from '@/content/myths';

type GameState = 'intro' | 'playing' | 'reveal' | 'result';

export default function MythsVsFacts() {
  const [state, setState] = useState<GameState>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const x = useMotionValue(0);

  const card = MYTH_CARDS[currentIndex];
  const total = MYTH_CARDS.length;
  const correctCount = results.filter(Boolean).length;

  const backgroundLeft = useTransform(x, [-150, 0], [0.3, 0]);
  const backgroundRight = useTransform(x, [0, 150], [0, 0.3]);

  const handleAnswer = useCallback(
    (answeredMyth: boolean) => {
      if (state !== 'playing') return;
      const isCorrect = answeredMyth === card.isMyth;
      setUserAnswer(answeredMyth);
      setResults((r) => [...r, isCorrect]);
      setState('reveal');
    },
    [state, card]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (state !== 'playing') return;
    if (info.offset.x < -100) {
      handleAnswer(true); // swipe left = Myth
    } else if (info.offset.x > 100) {
      handleAnswer(false); // swipe right = Fact
    }
  };

  const handleNext = () => {
    x.set(0);
    setUserAnswer(null);
    if (currentIndex + 1 >= total) {
      setState('result');
    } else {
      setCurrentIndex((i) => i + 1);
      setState('playing');
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setUserAnswer(null);
    setResults([]);
    x.set(0);
    setState('intro');
  };

  // Intro
  if (state === 'intro') {
    return (
      <motion.div
        className="glass-panel p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-accent-brand to-accent-lavender"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          <Zap size={28} className="text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Мифы vs Факты</h3>
        <p className="text-sm text-text-secondary mb-1">
          {total} утверждений о страховании
        </p>
        <p className="text-xs text-text-muted mb-6">
          Свайпай или нажимай кнопки: миф это или факт?
        </p>
        <button onClick={() => setState('playing')} className="btn-primary text-sm">
          Поехали
        </button>
      </motion.div>
    );
  }

  // Result
  if (state === 'result') {
    const ratio = correctCount / total;
    return (
      <motion.div
        className="glass-panel p-6 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <motion.div
          className="text-5xl mb-3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, delay: 0.2 }}
        >
          {ratio >= 0.8 ? '\u{1F525}' : ratio >= 0.5 ? '\u{1F44D}' : '\u{1F914}'}
        </motion.div>

        <h3 className="text-xl font-bold text-text-primary mb-1">
          {ratio >= 0.8
            ? 'Детектор мифов!'
            : ratio >= 0.5
              ? 'Хороший результат!'
              : 'Есть над чем работать'}
        </h3>
        <motion.p
          className="text-3xl font-extrabold gradient-text mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {correctCount} / {total}
        </motion.p>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {results.map((correct, i) => (
            <motion.div
              key={i}
              className={`w-3 h-3 rounded-full ${
                correct ? 'bg-accent-mint' : 'bg-accent-coral'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + i * 0.06 }}
            />
          ))}
        </div>

        <button onClick={reset} className="btn-secondary text-sm inline-flex items-center gap-2">
          <RotateCcw size={14} />
          Ещё раз
        </button>
      </motion.div>
    );
  }

  // Playing / Reveal
  const isCorrect = userAnswer !== null ? userAnswer === card.isMyth : null;

  return (
    <div className="glass-panel p-6">
      {/* Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center text-xs text-text-muted">
          <span>{currentIndex + 1} / {total}</span>
          <span>Развенчано мифов: {correctCount} / {total}</span>
        </div>
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => {
            const isCurrent = i === currentIndex;
            const isPast = i < results.length;
            const wasCorrect = isPast ? results[i] : null;
            return (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isCurrent
                    ? 'bg-accent-brand scale-125'
                    : isPast
                      ? wasCorrect
                        ? 'bg-accent-mint'
                        : 'bg-accent-coral'
                      : 'bg-white/20'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Swipe hints */}
      <div className="relative">
        {/* Background indicators */}
        <motion.div
          className="absolute -left-2 inset-y-0 w-16 rounded-l-xl bg-accent-coral/20 flex items-center justify-center pointer-events-none"
          style={{ opacity: backgroundLeft }}
        >
          <X size={24} className="text-accent-coral" />
        </motion.div>
        <motion.div
          className="absolute -right-2 inset-y-0 w-16 rounded-r-xl bg-accent-mint/20 flex items-center justify-center pointer-events-none"
          style={{ opacity: backgroundRight }}
        >
          <Check size={24} className="text-accent-mint" />
        </motion.div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className={`glass-panel-sm p-6 text-center relative cursor-grab active:cursor-grabbing select-none ${
              state === 'reveal'
                ? isCorrect
                  ? 'ring-2 ring-accent-mint/50'
                  : 'ring-2 ring-accent-coral/50'
                : ''
            }`}
            style={state === 'playing' ? { x } : undefined}
            drag={state === 'playing' ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            <p className="text-base font-semibold text-text-primary leading-snug min-h-[3rem] flex items-center justify-center">
              &laquo;{card.statement}&raquo;
            </p>

            {/* Labels when swiping */}
            {state === 'playing' && (
              <p className="text-[10px] text-text-muted mt-4">
                {'\u2190'} Миф &nbsp;&nbsp;{'\u00B7'}&nbsp;&nbsp; Факт {'\u2192'}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Buttons */}
      {state === 'playing' && (
        <motion.div
          className="flex justify-center gap-4 mt-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={() => handleAnswer(true)}
            aria-label="Это миф"
            className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-coral to-accent-rose flex items-center justify-center text-white shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={24} />
          </motion.button>
          <motion.button
            onClick={() => handleAnswer(false)}
            aria-label="Это факт"
            className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-mint to-accent-sage flex items-center justify-center text-white shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Check size={24} />
          </motion.button>
        </motion.div>
      )}

      {/* Reveal */}
      <AnimatePresence>
        {state === 'reveal' && (
          <motion.div
            className="mt-5 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="flex items-center justify-center gap-2">
              {isCorrect ? (
                <span className="text-sm font-bold text-accent-mint flex items-center gap-1">
                  <CheckCircle size={16} />
                  Правильно!
                </span>
              ) : (
                <span className="text-sm font-bold text-accent-coral flex items-center gap-1">
                  <XCircle size={16} />
                  Неверно
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                card.isMyth
                  ? 'bg-accent-coral/15 text-accent-coral'
                  : 'bg-accent-mint/15 text-accent-mint'
              }`}>
                {card.isMyth ? 'Это миф' : 'Это факт'}
              </span>
            </div>
            <div className="glass-panel-sm p-3">
              <p className="text-xs text-text-secondary leading-relaxed">
                {card.explanation}
              </p>
            </div>
            <div className="text-center">
              <button onClick={handleNext} className="btn-primary text-sm">
                {currentIndex + 1 >= total ? 'Результаты' : 'Дальше'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
