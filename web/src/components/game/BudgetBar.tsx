'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { formatMoney, INITIAL_BUDGET } from '@/engine';
import { useGameStore } from '@/hooks/useGame';
import { MONTH_NAMES } from '@/engine';
import { AVATARS } from '@/lib/avatars';
import Image from 'next/image';

export default function BudgetBar() {
  const { budget, currentMonth, avatar: playerAvatar } = useGameStore();
  const isNegative = budget < 0;
  const percentage = isNegative ? 100 : Math.max(0, (budget / INITIAL_BUDGET) * 100);
  const avatar = AVATARS.find((a) => a.src === playerAvatar);

  const barColor = isNegative
    ? 'from-red-600 to-red-500'
    : percentage > 60
      ? 'from-accent-mint to-accent-sage'
      : percentage > 30
        ? 'from-accent-peach to-accent-coral'
        : 'from-accent-coral to-accent-rose';

  const moneyColor = isNegative
    ? 'text-red-600'
    : percentage < 30
      ? 'text-accent-coral'
      : 'text-text-primary';

  return (
    <motion.div
      className="glass-panel-sm sticky top-0 z-50 px-5 py-3"
      initial={false}
    >
      <div className="flex items-center justify-between mb-2 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {avatar && (
            <Image
              src={avatar.src}
              alt={avatar.label}
              width={24}
              height={24}
              className="rounded-full shrink-0"
            />
          )}
          <span className="text-sm font-medium text-text-secondary truncate">
            {MONTH_NAMES[currentMonth - 1]}
          </span>
          <span className="text-xs text-text-muted shrink-0">
            {currentMonth} / 6
          </span>
        </div>
        <div className="relative min-w-[110px] h-6 flex items-center justify-end overflow-hidden shrink-0">
          <AnimatePresence mode="wait">
            <motion.span
              key={budget}
              className={`text-lg font-extrabold tabular-nums whitespace-nowrap ${moneyColor}`}
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            >
              {formatMoney(budget)}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <div
        className="w-full h-3 bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-label="Остаток бюджета"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={formatMoney(budget)}
      >
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} ${isNegative ? 'animate-pulse' : ''}`}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        />
      </div>
      {isNegative && (
        <p className="text-[10px] text-red-600 font-semibold mt-1 text-center">
          Бюджет в минусе — следи за расходами!
        </p>
      )}
    </motion.div>
  );
}
