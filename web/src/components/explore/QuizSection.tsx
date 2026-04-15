'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { QUIZ_QUESTIONS, getQuizResult } from '@/content/quiz';
import { QUIZ_RESULT_ICONS } from '@/lib/icons';

type QuizState = 'intro' | 'playing' | 'answered' | 'result';

export default function QuizSection() {
  const [state, setState] = useState<QuizState>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const question = QUIZ_QUESTIONS[currentIndex];
  const total = QUIZ_QUESTIONS.length;
  const progress = ((currentIndex + (state === 'answered' ? 1 : 0)) / total) * 100;

  const answeringRef = useRef(false);

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (state !== 'playing' || answeringRef.current) return;
      answeringRef.current = true;
      setSelectedOption(optionIndex);
      const isCorrect = optionIndex === question.correctIndex;
      if (isCorrect) setCorrectCount((c) => c + 1);
      setAnswers((a) => [...a, isCorrect]);
      setState('answered');
    },
    [state, question]
  );

  const handleNext = () => {
    if (currentIndex + 1 >= total) {
      setState('result');
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      answeringRef.current = false;
      setState('playing');
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setAnswers([]);
    answeringRef.current = false;
    setState('intro');
  };

  const start = () => {
    reset();
    setState('playing');
  };

  // Intro screen
  if (state === 'intro') {
    return (
      <motion.div
        className="glass-panel p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-accent-lavender to-accent-sky"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          <Sparkles size={28} className="text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Проверь себя</h3>
        <p className="text-sm text-text-secondary mb-1">
          {total} вопросов о страховании
        </p>
        <p className="text-xs text-text-muted mb-6">
          Узнай, насколько хорошо ты разбираешься в теме
        </p>
        <button onClick={start} className="btn-primary text-sm">
          Начать квиз
        </button>
      </motion.div>
    );
  }

  // Result screen
  if (state === 'result') {
    const result = getQuizResult(correctCount, total);
    return (
      <motion.div
        className="glass-panel p-6 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <motion.div
          className="w-16 h-16 rounded-2xl bg-accent-brand/10 flex items-center justify-center mb-4"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, delay: 0.2 }}
        >
          {(() => { const I = QUIZ_RESULT_ICONS[result.icon]; return I ? <I size={32} className="text-accent-brand" /> : null; })()}
        </motion.div>

        <h3 className="text-xl font-bold text-text-primary mb-1">{result.title}</h3>
        <motion.p
          className="text-3xl font-extrabold gradient-text mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {correctCount} / {total}
        </motion.p>

        <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto">
          {result.message}
        </p>

        {/* Ответы */}
        <div className="flex justify-center gap-1.5 mb-6">
          {answers.map((correct, i) => (
            <motion.div
              key={i}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                correct
                  ? 'bg-gradient-to-br from-accent-mint to-accent-sage'
                  : 'bg-gradient-to-br from-accent-coral to-accent-rose'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + i * 0.08, type: 'spring' }}
            >
              {i + 1}
            </motion.div>
          ))}
        </div>

        <button onClick={reset} className="btn-secondary text-sm inline-flex items-center gap-2">
          <RotateCcw size={14} />
          Пройти заново
        </button>
      </motion.div>
    );
  }

  // Question screen
  return (
    <div className="glass-panel p-6">
      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-text-muted mb-2">
          <span>Вопрос {currentIndex + 1} из {total}</span>
          <span>{correctCount} правильно</span>
        </div>
        <div
          className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden"
          role="progressbar"
          aria-label="Прогресс квиза"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent-lavender to-accent-sky"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <h3 className="text-base font-bold text-text-primary mb-4 leading-snug">
            {question.question}
          </h3>

          {/* Options */}
          <div className="space-y-2.5">
            {question.options.map((option, i) => {
              const isSelected = selectedOption === i;
              const isCorrect = i === question.correctIndex;
              const isAnswered = state === 'answered';
              let optionStyle = 'glass-panel-sm hover:bg-white/60';

              if (isAnswered) {
                if (isCorrect) {
                  optionStyle = 'bg-accent-mint/15 border-accent-mint/40 border';
                } else if (isSelected && !isCorrect) {
                  optionStyle = 'bg-accent-coral/10 border-accent-coral/30 border';
                } else {
                  optionStyle = 'glass-panel-sm opacity-50';
                }
              }

              return (
                <motion.button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={isAnswered}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${optionStyle} ${
                    !isAnswered ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
                  }`}
                  whileTap={!isAnswered ? { scale: 0.98 } : undefined}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isAnswered && isCorrect
                          ? 'bg-accent-mint text-white'
                          : isAnswered && isSelected && !isCorrect
                            ? 'bg-accent-coral text-white'
                            : 'bg-white/50 text-text-secondary'
                      }`}
                    >
                      {isAnswered && isCorrect ? (
                        <CheckCircle size={14} />
                      ) : isAnswered && isSelected && !isCorrect ? (
                        <XCircle size={14} />
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    <span className={`flex-1 ${isAnswered && isCorrect ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                      {option}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {state === 'answered' && (
              <motion.div
                className="mt-4 glass-panel-sm p-4"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <p className="text-xs text-text-secondary leading-relaxed">
                  {question.explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next button */}
          {state === 'answered' && (
            <motion.div
              className="mt-5 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={handleNext}
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                {currentIndex + 1 >= total ? 'Результаты' : 'Следующий'}
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
