'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TrendingDown, RotateCcw, BarChart3 } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { useGameStore } from '@/hooks/useGame';
import { formatMoney, MONTH_NAMES } from '@/engine';

export default function BankruptScreen() {
  const router = useRouter();
  const { monthHistory, totalLostToEvents, totalSpentOnInsurance, totalSavedByInsurance, playerName, resetGame } =
    useGameStore();

  const lastRecord = monthHistory[monthHistory.length - 1];
  const bankruptMonth = lastRecord?.month ?? 1;

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
      >
        <GlassPanel className="p-8 max-w-md mx-auto text-center relative overflow-hidden">
          {/* Red gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-50/50 to-transparent pointer-events-none" />

          {/* Icon */}
          <motion.div
            className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center relative z-10"
            style={{ background: 'var(--gradient-danger)' }}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
          >
            <TrendingDown size={40} className="text-white" />
          </motion.div>

          <motion.h2
            className="font-display text-2xl font-extrabold text-text-primary mb-2 relative z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Бюджет закончился
          </motion.h2>

          <motion.p
            className="text-sm text-text-secondary mb-6 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {playerName}, твоих денег не хватило и игра завершилась —{' '}
            <span className="font-semibold">{MONTH_NAMES[bankruptMonth - 1]}</span>
            {' '}({bankruptMonth} из 6 месяцев).
          </motion.p>

          {/* Что произошло */}
          {lastRecord?.event && (
            <motion.div
              className="glass-panel-sm p-4 mb-4 text-left relative z-10"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              <p className="text-xs text-text-muted mb-1">Последнее событие:</p>
              <p className="text-sm font-semibold text-text-primary">{lastRecord.event.title}</p>
              <p className="text-xs text-text-secondary mt-1">{lastRecord.event.description}</p>
            </motion.div>
          )}

          {/* Статистика */}
          <motion.div
            className="grid grid-cols-3 gap-2 mb-6 relative z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="glass-panel-sm p-3">
              <p className="text-[10px] text-text-muted">Потрачено</p>
              <p className="text-xs font-bold text-accent-sky">{formatMoney(totalSpentOnInsurance)}</p>
            </div>
            <div className="glass-panel-sm p-3">
              <p className="text-[10px] text-text-muted">Потеряно</p>
              <p className="text-xs font-bold text-accent-coral">{formatMoney(totalLostToEvents)}</p>
            </div>
            <div className="glass-panel-sm p-3">
              <p className="text-[10px] text-text-muted">Спасено</p>
              <p className="text-xs font-bold text-accent-mint">{formatMoney(totalSavedByInsurance)}</p>
            </div>
          </motion.div>

          {/* Урок */}
          <motion.p
            className="text-xs text-text-muted italic mb-6 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            В реальной жизни банкротство — серьёзная проблема. Страхование помогает избежать ситуаций, когда одно событие лишает тебя всех денег.
          </motion.p>

          {/* Кнопки */}
          <motion.div
            className="flex gap-3 justify-center relative z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <button
              onClick={() => router.push('/results')}
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <BarChart3 size={14} />
              Результаты
            </button>
            <button
              onClick={() => {
                resetGame();
                router.push('/');
              }}
              className="btn-primary text-xs inline-flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              Играть снова
            </button>
          </motion.div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
