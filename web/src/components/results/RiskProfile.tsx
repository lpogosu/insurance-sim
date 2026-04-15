'use client';

import { motion } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { PROFILE_ICONS } from '@/lib/icons';
import type { RiskProfileData } from '@/engine';

interface RiskProfileProps {
  profile: RiskProfileData;
}

export default function RiskProfile({ profile }: RiskProfileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: 'spring', damping: 25, stiffness: 200 }}
    >
      <GlassPanel className="p-6 relative overflow-hidden">
        {/* Decorative gradient */}
        <div
          className="absolute top-0 left-0 w-full h-1 rounded-t-[1.5rem]"
          style={{ background: `linear-gradient(90deg, ${profile.color}, ${profile.color}80)` }}
        />

        <div className="flex items-center gap-4">
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${profile.color}15` }}
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.6 }}
          >
            {(() => { const I = PROFILE_ICONS[profile.icon]; return I ? <I size={28} style={{ color: profile.color }} /> : null; })()}
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted mb-0.5">Твой профиль рисков</p>
            <h3
              className="font-display text-lg font-bold"
              style={{ color: profile.color }}
            >
              {profile.type}
            </h3>
            <p className="text-sm text-text-secondary mt-1 leading-relaxed">
              {profile.description}
            </p>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
