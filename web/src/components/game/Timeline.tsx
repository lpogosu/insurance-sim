'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/hooks/useGame';
import { MONTH_NAMES } from '@/engine';
import { Check, X, Minus, Circle, Lock } from 'lucide-react';

export default function Timeline() {
  const { currentMonth, monthHistory } = useGameStore();

  return (
    <div className="flex items-center gap-1 w-full">
      {MONTH_NAMES.map((name, i) => {
        const month = i + 1;
        const record = monthHistory.find((r) => r.month === month);
        const isCurrent = month === currentMonth;
        const isPast = month < currentMonth;
        const isLocked = month > currentMonth;
        const hadEvent = record?.event !== null && record?.event !== undefined;
        const wasInsured = record?.wasInsured ?? false;

        let dotColor = 'bg-gray-200';
        let IconComponent: React.FC<{ size?: number; className?: string }> | null = null;
        let iconColor = 'text-white';

        if (isPast && hadEvent && wasInsured) {
          dotColor = 'bg-accent-mint';
          IconComponent = Check;
        } else if (isPast && hadEvent && !wasInsured) {
          dotColor = 'bg-accent-coral';
          IconComponent = X;
        } else if (isPast) {
          dotColor = 'bg-accent-sky';
          IconComponent = Minus;
        } else if (isLocked) {
          dotColor = 'bg-gray-200';
          IconComponent = Lock;
          iconColor = 'text-gray-400';
        }

        return (
          <div
            key={month}
            className={`flex-1 flex flex-col items-center gap-1 group relative ${isLocked ? 'opacity-40' : ''}`}
          >
            <motion.div
              className={`w-5 h-5 rounded-full ${dotColor} flex items-center justify-center ${
                isCurrent
                  ? 'ring-2 ring-accent-brand ring-offset-1 ring-offset-bg-base'
                  : ''
              }`}
              animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
              transition={isCurrent ? { repeat: Infinity, duration: 2 } : {}}
            >
              {isLocked && <Lock size={9} className={iconColor} />}
              {!isLocked && IconComponent && <IconComponent size={10} className={iconColor} />}
              {isCurrent && !isPast && !isLocked && !IconComponent && (
                <Circle size={6} className="text-accent-brand fill-accent-brand" />
              )}
            </motion.div>
            <span
              className={`text-[10px] ${
                isCurrent
                  ? 'font-bold text-text-primary'
                  : isLocked
                    ? 'text-text-muted/50'
                    : 'text-text-muted'
              }`}
            >
              {name}
            </span>

            {isPast && record && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
                <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                  {hadEvent ? record.event!.title : 'Спокойный месяц'}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
