'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  GraduationCap,
  Sparkles,
  Trophy,
  Layers,
  PiggyBank,
  Flame,
  Heart,
} from 'lucide-react';
import type { Achievement } from '@/engine/achievements';

const ICON_MAP: Record<string, React.FC<React.SVGProps<SVGSVGElement> & { size?: number }>> = {
  Shield,
  GraduationCap,
  Sparkles,
  Trophy,
  Layers,
  PiggyBank,
  Flame,
  Heart,
};

const rarityLabels: Record<string, string> = {
  common: 'Обычный',
  rare: 'Редкий',
  legendary: 'Легендарный',
};

interface AchievementsProps {
  earned: Achievement[];
  all: Achievement[];
}

export default function Achievements({ earned, all }: AchievementsProps) {
  const earnedIds = new Set(earned.map((a) => a.id));
  const earnedCount = earned.length;

  return (
    <motion.div
      className="glass-panel p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold text-text-primary">Достижения</h3>
        <span className="text-xs text-text-muted font-medium px-2 py-0.5 rounded-full bg-white/50">
          {earnedCount} / {all.length}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {all.map((achievement, i) => {
          const isEarned = earnedIds.has(achievement.id);
          const Icon = ICON_MAP[achievement.icon];
          const isLegendary = achievement.rarity === 'legendary' && isEarned;

          return (
            <motion.div
              key={achievement.id}
              className={`glass-panel-sm p-4 text-center relative overflow-hidden ${isEarned ? '' : 'opacity-40 grayscale'}`}
              initial={{ opacity: 0, y: 20, scale: 0.85 }}
              animate={{ opacity: isEarned ? 1 : 0.4, y: 0, scale: 1 }}
              transition={{
                delay: isLegendary ? 1.5 + i * 0.1 : 0.4 + i * 0.1,
                type: 'spring',
                damping: 18,
                stiffness: 180,
              }}
              style={
                isLegendary
                  ? { boxShadow: `0 0 24px ${achievement.color}50, 0 0 48px ${achievement.color}20` }
                  : undefined
              }
            >
              {/* Свечение для legendary */}
              {isLegendary && (
                <motion.div
                  className="absolute inset-0 rounded-[inherit] pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${achievement.color}15, transparent 70%)`,
                  }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {Icon && (
                <motion.div
                  className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center relative"
                  style={{ background: isEarned ? `${achievement.color}25` : undefined }}
                  initial={isEarned ? { rotate: -10, scale: 0 } : false}
                  animate={isEarned ? { rotate: 0, scale: 1 } : {}}
                  transition={{
                    delay: isLegendary ? 1.8 + i * 0.1 : 0.6 + i * 0.1,
                    type: 'spring',
                    damping: 10,
                    stiffness: 200,
                  }}
                >
                  <Icon
                    size={20}
                    style={{ color: isEarned ? achievement.color : '#999' }}
                  />
                </motion.div>
              )}

              <p className="text-xs font-semibold text-text-primary leading-tight relative">
                {achievement.title}
              </p>
              <p className="text-[10px] text-text-muted mt-1 relative">
                {achievement.description}
              </p>
              <span
                className={`inline-block text-[9px] mt-2 px-2 py-0.5 rounded-full relative ${
                  achievement.rarity === 'legendary'
                    ? 'bg-accent-peach/20 text-accent-peach'
                    : achievement.rarity === 'rare'
                      ? 'bg-accent-lavender/20 text-accent-lavender'
                      : 'bg-accent-sky/20 text-accent-sky'
                }`}
              >
                {rarityLabels[achievement.rarity]}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
