'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ALL_EVENTS } from '@/content/events';
import { formatMoney } from '@/engine';
import { CATEGORY_ICONS, SCENARIO_ICONS } from '@/lib/icons';
import type { InsuranceType } from '@/engine';

interface CategoryModalProps {
  type: InsuranceType;
  title: string;
  subtitle: string;
  color: string;
  onClose: () => void;
}

export default function CategoryModal({
  type,
  title,
  subtitle,
  color,
  onClose,
}: CategoryModalProps) {
  const scenarios = ALL_EVENTS.filter((e) => e.category === type);
  const Icon = CATEGORY_ICONS[type];

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative glass-panel p-6 max-w-lg w-full z-10 max-h-[80vh] flex flex-col"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-bg-base flex items-center justify-center text-text-muted hover:text-text-primary transition"
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-5 pr-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${color}20` }}
          >
            {Icon && <Icon size={22} style={{ color }} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">{title}</h3>
            <p className="text-xs text-text-secondary">{subtitle}</p>
            <span className="text-[10px] text-text-muted">{scenarios.length} сценариев</span>
          </div>
        </div>

        {/* Scenarios */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="glass-panel-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                {(() => { const SI = SCENARIO_ICONS[scenario.id]; return SI ? <SI size={18} className="text-text-secondary" /> : null; })()}
                <h4 className="text-sm font-semibold text-text-primary">
                  {scenario.title}
                </h4>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    scenario.difficulty === 'easy'
                      ? 'bg-accent-mint/20 text-accent-mint'
                      : scenario.difficulty === 'medium'
                        ? 'bg-accent-peach/20 text-accent-peach'
                        : 'bg-accent-coral/20 text-accent-coral'
                  }`}
                >
                  {scenario.difficulty === 'easy'
                    ? 'Простой'
                    : scenario.difficulty === 'medium'
                      ? 'Средний'
                      : 'Сложный'}
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mb-2">
                {scenario.description}
              </p>
              <div className="text-xs text-text-muted">
                {formatMoney(scenario.financialLoss)} ущерб /{' '}
                {formatMoney(scenario.insuranceCoverage)} покрытие
              </div>
              <p className="text-[10px] text-text-muted mt-2 italic">
                {scenario.lessonText}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
