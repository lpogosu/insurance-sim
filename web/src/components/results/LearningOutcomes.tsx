'use client';

import { motion } from 'framer-motion';
import type { LearningOutcome } from '@/engine';
import { BookOpen, TrendingDown, ShieldCheck } from 'lucide-react';

const icons = [BookOpen, TrendingDown, ShieldCheck];

export default function LearningOutcomes({
  outcomes,
}: {
  outcomes: LearningOutcome[];
}) {
  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg font-bold text-text-primary mb-4">
        Чему ты научился
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {outcomes.map((outcome, i) => {
          const Icon = icons[i % icons.length];
          return (
            <motion.div
              key={i}
              className="glass-panel-sm p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="w-8 h-8 rounded-lg bg-accent-sky/20 flex items-center justify-center mb-3">
                <Icon size={16} className="text-accent-sky" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary mb-1">
                {outcome.title}
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                {outcome.text}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
