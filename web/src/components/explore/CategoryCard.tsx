'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { ALL_EVENTS } from '@/content/events';
import { formatMoney } from '@/engine';
import { CATEGORY_ICONS, SCENARIO_ICONS } from '@/lib/icons';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import type { InsuranceType } from '@/engine';

interface CategoryCardProps {
  type: InsuranceType;
  title: string;
  subtitle: string;
  color: string;
  onDesktopClick?: () => void;
}

export default function CategoryCard({
  type,
  title,
  subtitle,
  color,
  onDesktopClick,
}: CategoryCardProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const scenarios = ALL_EVENTS.filter((e) => e.category === type);
  const panelId = `category-scenarios-${type}`;

  return (
    <motion.div
      className="glass-panel overflow-hidden"
      style={{ borderLeft: `3px solid ${color}` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <button
        onClick={() => {
          if (isDesktop && onDesktopClick) {
            onDesktopClick();
          } else {
            setOpen(!open);
          }
        }}
        className="w-full p-5 flex items-center gap-4 text-left"
        aria-expanded={isDesktop ? undefined : open}
        aria-controls={isDesktop ? undefined : panelId}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${color}20` }}
        >
          {(() => { const I = CATEGORY_ICONS[type]; return I ? <I size={22} style={{ color }} /> : null; })()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-text-primary">{title}</h3>
          <p className="text-xs text-text-secondary">{subtitle}</p>
          <span className="text-[10px] text-text-muted">{scenarios.length} сценариев</span>
        </div>
        {isDesktop ? (
          <ArrowRight size={18} className="text-text-muted" />
        ) : (
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={20} className="text-text-muted" />
          </motion.div>
        )}
      </button>

      {!isDesktop && (
        <AnimatePresence>
          {open && (
            <motion.div
              id={panelId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-3">
                {scenarios.map((scenario) => (
                  <div key={scenario.id} className="glass-panel-sm p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {(() => { const SI = SCENARIO_ICONS[scenario.id]; return SI ? <SI size={18} className="text-text-secondary" /> : null; })()}
                      <h4 className="text-sm font-semibold text-text-primary">
                        {scenario.title}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        scenario.difficulty === 'easy'
                          ? 'bg-accent-mint/20 text-accent-mint'
                          : scenario.difficulty === 'medium'
                            ? 'bg-accent-peach/20 text-accent-peach'
                            : 'bg-accent-coral/20 text-accent-coral'
                      }`}>
                        {scenario.difficulty === 'easy' ? 'Простой' : scenario.difficulty === 'medium' ? 'Средний' : 'Сложный'}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed mb-2">
                      {scenario.description}
                    </p>
                    <div className="text-xs text-text-muted">
                      {formatMoney(scenario.financialLoss)} ущерб / {formatMoney(scenario.insuranceCoverage)} покрытие
                    </div>
                    <p className="text-[10px] text-text-muted mt-2 italic">
                      {scenario.lessonText}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
