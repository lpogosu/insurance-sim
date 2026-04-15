'use client';

import { motion } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { useGameStore } from '@/hooks/useGame';
import { formatMoney, MONTH_NAMES, INITIAL_BUDGET } from '@/engine';
import { CATEGORY_ICONS } from '@/lib/icons';

export default function MonthSummary() {
  const { currentMonth, budget, currentEvent, activeInsurances, currentCalmMonth, nextMonth } =
    useGameStore();

  const isLastMonth = currentMonth >= 6;
  const validInsurances = activeInsurances.filter(
    (ins) => ins.expiresAtMonth > currentMonth
  );
  const budgetPercentage = Math.max(0, (budget / INITIAL_BUDGET) * 100);

  return (
    <GlassPanel className="p-6 max-w-lg mx-auto">
      <motion.div
        className="text-center mb-5"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Итог месяца
        </span>
        <h2 className="text-xl font-bold text-text-primary mt-1">
          {MONTH_NAMES[currentMonth - 1]}
        </h2>
      </motion.div>

      {/* Баланс */}
      <motion.div
        className="glass-panel-sm p-5 text-center mb-5 relative overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        {/* Progress indicator */}
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-accent-mint to-accent-sage rounded-b-lg" style={{ width: `${budgetPercentage}%` }} />
        <p className="text-sm text-text-secondary mb-1">Баланс</p>
        <p className="text-3xl font-extrabold text-text-primary">
          {formatMoney(budget)}
        </p>
        <p className="text-xs text-text-muted mt-1">
          {Math.round(budgetPercentage)}% от начального
        </p>
      </motion.div>

      {/* Что произошло */}
      {currentEvent && (
        <motion.div
          className="glass-panel-sm p-4 mb-4"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <div className="flex items-center gap-2 mb-1">
            {(() => { const I = CATEGORY_ICONS[currentEvent.category]; return I ? <I size={18} className="text-text-secondary" /> : null; })()}
            <span className="text-sm font-semibold text-text-primary">
              {currentEvent.title}
            </span>
          </div>
          <p className="text-xs text-text-secondary">{currentEvent.description}</p>
        </motion.div>
      )}

      {!currentEvent && currentCalmMonth && (
        <motion.div
          className="glass-panel-sm p-4 mb-4"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">&#x2600;&#xFE0F;</span>
            <span className="text-sm font-semibold text-text-primary">
              {currentCalmMonth.title}
            </span>
          </div>
        </motion.div>
      )}

      {/* Активные страховки */}
      {validInsurances.length > 0 && (
        <motion.div
          className="mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs text-text-muted mb-2">Активные страховки:</p>
          <div className="flex flex-wrap gap-2">
            {validInsurances.map((ins, i) => (
              <motion.span
                key={i}
                className="text-xs px-3 py-1 rounded-full bg-accent-mint/15 text-accent-mint font-medium"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35 + i * 0.05, type: 'spring' }}
              >
                {(() => { const I = CATEGORY_ICONS[ins.type]; return I ? <I size={12} className="inline -mt-0.5 mr-0.5" /> : null; })()}
                до конца {
                  ['\u044F\u043D\u0432\u0430\u0440\u044F','\u0444\u0435\u0432\u0440\u0430\u043B\u044F','\u043C\u0430\u0440\u0442\u0430','\u0430\u043F\u0440\u0435\u043B\u044F','\u043C\u0430\u044F','\u0438\u044E\u043D\u044F'][Math.min(ins.expiresAtMonth - 1, 5)]
                }
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button onClick={nextMonth} className="btn-primary text-sm">
          {isLastMonth ? 'Посмотреть результаты' : `Прожить ${MONTH_NAMES[currentMonth]}`}
        </button>
      </motion.div>
    </GlassPanel>
  );
}
