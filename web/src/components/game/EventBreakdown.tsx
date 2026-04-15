'use client';

import { motion, type Variants } from 'framer-motion';
import { Shield, AlertTriangle } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { useGameStore } from '@/hooks/useGame';
import { generateBreakdown, formatMoney } from '@/engine';

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.3 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 200 } },
};

export default function EventBreakdown() {
  const { currentEvent, currentCalmMonth, activeInsurances, currentMonth, finishBreakdown } =
    useGameStore();

  // Спокойный месяц — упрощённый разбор
  if (!currentEvent) {
    return (
      <GlassPanel className="p-6 max-w-lg mx-auto">
        <h3 className="font-display text-lg font-bold text-text-primary mb-3">
          Как это работает
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          {currentCalmMonth
            ? currentCalmMonth.description
            : 'Если купленные страховки не пригодились — это нормально. Они продолжают действовать и защищать тебя в следующих месяцах.'}
        </p>
        <div className="glass-panel-sm p-3">
          <p className="text-xs text-text-muted">
            <span className="font-semibold text-text-secondary">Ключевой термин: </span>
            Страховая премия — цена страховки, которую ты платишь за защиту. Даже если ничего не случилось, ты платил за спокойствие.
          </p>
        </div>
        <div className="text-center mt-5">
          <button onClick={finishBreakdown} className="btn-primary text-sm">
            Продолжить
          </button>
        </div>
      </GlassPanel>
    );
  }

  const wasInsured = activeInsurances.some(
    (ins) => ins.type === currentEvent.category && ins.expiresAtMonth > currentMonth
  );

  const premiumPaid = wasInsured
    ? activeInsurances.find(
        (ins) => ins.type === currentEvent.category && ins.expiresAtMonth > currentMonth
      )?.monthlyCost ?? 0
    : 0;

  const breakdown = generateBreakdown(currentEvent, wasInsured, premiumPaid);

  return (
    <GlassPanel className="p-6 max-w-lg mx-auto">
      <h3 className="font-display text-lg font-bold text-text-primary mb-4">
        Как это работает
      </h3>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
        {/* Что произошло — СНАЧАЛА текст */}
        <motion.div variants={fadeUp}>
          <p className="text-sm text-text-secondary leading-relaxed">
            {breakdown.whatHappened}
          </p>
        </motion.div>

        {/* Как работает страховка */}
        <motion.div variants={fadeUp}>
          <p className="text-sm text-text-secondary leading-relaxed">
            {breakdown.howItWorks}
          </p>
        </motion.div>

        {/* Ключевой термин — цветной бейдж */}
        <motion.div variants={fadeUp}>
          {(() => {
            const Icon = wasInsured ? Shield : AlertTriangle;
            const bg = wasInsured ? 'bg-accent-mint/10' : 'bg-accent-coral/10';
            const border = wasInsured ? 'border-accent-mint' : 'border-accent-coral';
            const color = wasInsured ? 'text-accent-mint' : 'text-accent-coral';
            return (
              <div className={`${bg} border-l-4 ${border} rounded-xl p-4 flex gap-3`}>
                <Icon size={20} className={`${color} shrink-0 mt-0.5`} />
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${color} mb-1`}>
                    Ключевой термин
                  </p>
                  <p className="text-sm font-bold text-text-primary">
                    {breakdown.keyTerm.term}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    {breakdown.keyTerm.definition}
                  </p>
                </div>
              </div>
            );
          })()}
        </motion.div>

        {/* Финансовый итог */}
        <motion.div variants={fadeUp} className="glass-panel-sm p-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-text-muted">Заплатил за страховку</p>
              <p className="text-sm font-bold text-text-primary">
                {formatMoney(breakdown.financialSummary.paid)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Страховая покрыла</p>
              <p className="text-sm font-bold text-accent-mint">
                {formatMoney(breakdown.financialSummary.covered)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Из кармана</p>
              <p className="text-sm font-bold text-accent-coral">
                {formatMoney(breakdown.financialSummary.outOfPocket)}
              </p>
            </div>
            <div>
              {(() => {
                const { paid, covered, outOfPocket } = breakdown.financialSummary;
                const saved = wasInsured && outOfPocket === 0 ? Math.max(0, covered - paid) : 0;
                const showSaved = saved > 0;
                const label = showSaved ? 'Сохранил' : 'Потерял';
                const value = showSaved ? saved : outOfPocket;
                const cls = showSaved ? 'text-accent-mint' : 'text-accent-coral';
                return (
                  <>
                    <p className="text-xs text-text-muted">{label}</p>
                    <p className={`text-sm font-bold ${cls}`}>{formatMoney(value)}</p>
                  </>
                );
              })()}
            </div>
          </div>
        </motion.div>

        {/* Что запомнить */}
        <motion.div variants={fadeUp}>
          <p className="text-xs text-text-muted italic">{currentEvent.lessonText}</p>
        </motion.div>
      </motion.div>

      <div className="text-center mt-5">
        <button onClick={finishBreakdown} className="btn-primary text-sm">
          Продолжить
        </button>
      </div>
    </GlassPanel>
  );
}
