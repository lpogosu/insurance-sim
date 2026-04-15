'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/hooks/useGame';
import { MONTH_NAMES } from '@/engine';

const LIFE_SNIPPETS = [
  'Ходишь в школу...',
  'Гуляешь с друзьями...',
  'Сидишь в телефоне...',
  'Готовишь домашку...',
  'Слушаешь музыку...',
  'Играешь в игры...',
];

export default function LivingPhase() {
  const { currentMonth, finishLiving } = useGameStore();
  const [snippetIndex, setSnippetIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(finishLiving, 2500);
    return () => clearTimeout(timer);
  }, [finishLiving]);

  // Cycling life snippets
  useEffect(() => {
    const interval = setInterval(() => {
      setSnippetIndex((prev) => (prev + 1) % LIFE_SNIPPETS.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center relative"
          style={{ background: 'var(--gradient-accent)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, ease: 'linear', repeat: Infinity }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {/* Пульсирующее кольцо */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-accent-brand/30"
            animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>

        <motion.h2
          className="text-xl font-bold text-text-primary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Проживаем {MONTH_NAMES[currentMonth - 1].toLowerCase()}...
        </motion.h2>

        {/* Сниппеты жизни */}
        <div className="h-6 mt-3 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={snippetIndex}
              className="text-sm text-text-muted"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {LIFE_SNIPPETS[snippetIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.div
          className="flex justify-center gap-1.5 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-accent-brand"
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
