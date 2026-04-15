'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Medal } from 'lucide-react';
import { formatMoney } from '@/engine';
import type { GameResults } from '@/engine';

export default function ScoreCard({ results }: { results: GameResults }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animated score counter
  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(2, -10 * progress);
      setAnimatedScore(Math.round(eased * results.score));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [results.score]);

  // Map result grade colors to our pop variables if needed,
  // but we can just use the exact score percentage for the ring styling
  const colorHex = results.gradeColor || '#58cc02'; 

  return (
    <motion.div
      className="text-center w-full"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 150 }}
    >
      <div 
        className="w-40 h-40 rounded-full mx-auto relative flex items-center justify-center border-4"
        style={{ 
          borderColor: colorHex,
          background: `conic-gradient(${colorHex} ${animatedScore}%, #f0f0f0 ${animatedScore}%)`,
          boxShadow: `0 8px 30px ${colorHex}40`
        }}
      >
        <div className="absolute inset-0 m-auto w-[130px] h-[130px] rounded-full bg-bg-base" />
        <div className="relative z-10 text-center flex flex-col items-center justify-center">
          <div 
            className="font-display text-[48px] leading-none font-black"
            style={{ color: colorHex }}
          >
            {animatedScore}
          </div>
          <div className="text-xs text-text-muted font-bold mt-1 uppercase">
            из 100
          </div>
        </div>
      </div>

      <div className="mt-6 mb-2">
        <motion.div 
          className="inline-block px-6 py-2 rounded-full text-white font-display font-black text-sm uppercase tracking-wide"
          style={{ 
            backgroundColor: colorHex,
            borderBottom: '3px solid rgba(0,0,0,0.2)'
          }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Medal size={16} aria-hidden className="inline-block align-[-2px] mr-1" />
          {results.title}
        </motion.div>
      </div>
      
      <motion.div 
        className="w-full text-sm text-text-secondary leading-relaxed max-w-sm mx-auto mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Твоё звание зависит от итогового бюджета и того, как ты управлял рисками.
      </motion.div>

      {/* Статистика */}
      <motion.div
        className="grid grid-cols-2 gap-3 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div
          className="glass-panel-sm p-3"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.9, type: 'spring' }}
        >
          <p className="text-xs text-text-muted">Осталось</p>
          <p className="text-lg font-bold text-text-primary">
            {formatMoney(results.budgetRemaining)}
          </p>
        </motion.div>
        <motion.div
          className="glass-panel-sm p-3"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.95, type: 'spring' }}
        >
          <p className="text-xs text-text-muted">Потрачено на страховки</p>
          <p className="text-lg font-bold text-accent-sky">
            {formatMoney(results.totalSpent)}
          </p>
        </motion.div>
        <motion.div
          className="glass-panel-sm p-3"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.0, type: 'spring' }}
        >
          <p className="text-xs text-text-muted">Потеряно</p>
          <p className="text-lg font-bold text-accent-coral">
            {formatMoney(results.totalLost)}
          </p>
        </motion.div>
        <motion.div
          className="glass-panel-sm p-3"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.05, type: 'spring' }}
        >
          <p className="text-xs text-text-muted">Сохранено страховкой</p>
          <p className="text-lg font-bold text-accent-mint">
            {formatMoney(results.totalSaved)}
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
