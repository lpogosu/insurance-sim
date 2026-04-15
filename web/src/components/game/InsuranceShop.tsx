'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/hooks/useGame';
import { INSURANCE_CATALOG } from '@/content/insurance';
import { formatMoney } from '@/engine';
import { hapticImpact } from '@/lib/telegram';
import { CATEGORY_ICONS } from '@/lib/icons';
import type { InsuranceOption } from '@/engine';

// Toast уведомление
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <motion.div
      className="fixed bottom-20 left-1/2 z-50 pointer-events-none"
      style={{ x: '-50%' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: 'spring', damping: 25 }}
      onAnimationComplete={() => {
        setTimeout(onDone, 1800);
      }}
    >
      <div className="px-5 py-3 rounded-xl text-sm font-medium text-white shadow-lg whitespace-nowrap"
        style={{ background: '#1e3a8a' }}>
        {message}
      </div>
    </motion.div>
  );
}

export default function InsuranceShop() {
  const { budget, activeInsurances, currentMonth, buyInsurance, finishShopping } =
    useGameStore();
  const [justBought, setJustBought] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isOwned = useCallback((option: InsuranceOption) =>
    activeInsurances.some(
      (ins) => ins.type === option.type && ins.expiresAtMonth > currentMonth
    ), [activeInsurances, currentMonth]);

  const canAfford = (option: InsuranceOption) => budget >= option.monthlyCost;

  const handleBuy = (option: InsuranceOption) => {
    if (isOwned(option) || !canAfford(option)) return;
    buyInsurance(option);
    hapticImpact('medium');
    setJustBought(option.type);
    setToast(`-${formatMoney(option.monthlyCost)} \u00B7 ${option.name} активна`);
    setTimeout(() => setJustBought(null), 1200);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="font-display text-xl font-bold text-text-primary">
          Магазин страховок
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Выбери, от чего хочешь защититься в этом месяце
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" data-tutorial="shop-grid">
        <AnimatePresence>
          {INSURANCE_CATALOG.map((option, i) => {
            const owned = isOwned(option);
            const affordable = canAfford(option);
            const isBought = justBought === option.type;

            return (
              <motion.div
                key={option.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isBought ? [0.97, 1] : 1,
                }}
                transition={isBought
                  ? { scale: { duration: 0.2 } }
                  : { delay: i * 0.08, type: 'spring', damping: 25, stiffness: 200 }
                }
              >
                <div
                  className={`glass-panel-sm p-4 h-full relative overflow-hidden transition-all duration-300 ${
                    owned
                      ? 'ring-2 ring-accent-mint/50'
                      : affordable
                        ? 'hover:bg-white/60 cursor-pointer'
                        : 'opacity-50'
                  }`}
                  style={{
                    borderLeft: owned
                      ? '3px solid #004DE5'
                      : `3px solid ${option.color}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {(() => { const I = CATEGORY_ICONS[option.type]; return I ? <I size={18} style={{ color: option.color }} /> : null; })()}
                        <h3 className="font-semibold text-text-primary text-sm">
                          {option.name}
                        </h3>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {option.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        <span>Покрытие: {formatMoney(option.coverageAmount)}</span>
                        <span>{option.duration} мес.</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-sm font-bold text-text-primary">
                        {formatMoney(option.monthlyCost)}
                        <span className="text-xs font-normal text-text-muted">/мес</span>
                      </span>

                      {owned ? (
                        <motion.span
                          className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                          style={{
                            color: '#166534',
                            background: '#dcfce7',
                            borderColor: '#bbf7d0',
                          }}
                          initial={isBought ? { scale: 0.8 } : false}
                          animate={{ scale: 1 }}
                        >
                          Куплено &#10003;
                        </motion.span>
                      ) : (
                        <button
                          onClick={() => handleBuy(option)}
                          disabled={!affordable}
                          className="btn-primary text-xs px-4 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Купить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Итого за месяц */}
      {activeInsurances.length > 0 && (
        <motion.div
          className="glass-panel-sm px-4 py-3 flex items-center justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <p className="text-xs text-text-muted">Итого страховок в месяц</p>
            <p className="text-sm font-bold text-text-primary">
              {formatMoney(activeInsurances.filter(ins => ins.expiresAtMonth > currentMonth).reduce((s, ins) => s + ins.monthlyCost, 0))}/мес
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Остаток</p>
            <p className={`text-sm font-bold ${budget > 15000 ? 'text-accent-mint' : budget > 5000 ? 'text-accent-peach' : 'text-accent-coral'}`}>
              {formatMoney(budget)}
            </p>
          </div>
        </motion.div>
      )}

      <motion.div className="flex justify-center pt-2" data-tutorial="shop-go">
        <button onClick={finishShopping} className="btn-secondary text-sm">
          Прожить месяц
        </button>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast message={toast} onDone={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
