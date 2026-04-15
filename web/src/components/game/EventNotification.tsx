'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { useGameStore } from '@/hooks/useGame';
import { formatMoney } from '@/engine';
import type { GameEvent } from '@/engine';
import { CATEGORY_ICONS } from '@/lib/icons';
import { hapticNotification } from '@/lib/telegram';

// Частицы "улетающих денег"
function makeMoneyParticles() {
  return Array.from({ length: 4 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 60,
  }));
}

function MoneyParticles({ amount }: { amount: number }) {
  const [particles] = useState(makeMoneyParticles);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setGone(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (gone) return null;

  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/3 pointer-events-none z-20"
          initial={{ opacity: 1, y: 0, x: p.x }}
          animate={{ opacity: 0, y: -70, x: p.x }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ marginLeft: -30 }}
        >
          <span className="text-sm font-medium text-[#ef4444] whitespace-nowrap">
            -{formatMoney(amount)}
          </span>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

export default function EventNotification() {
  const { currentEvent, currentCalmMonth, activeInsurances, currentMonth, acknowledgeEvent } =
    useGameStore();
  if (!currentEvent && !currentCalmMonth) return null;

  // Спокойный месяц
  if (!currentEvent && currentCalmMonth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassPanel className="p-8 max-w-md mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 150 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-mint to-accent-sage flex items-center justify-center mx-auto mb-5"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </motion.div>

          <h2 className="text-xl font-bold text-text-primary mb-2">
            {currentCalmMonth.title}
          </h2>
          <p className="text-sm text-text-secondary mb-1">
            {currentCalmMonth.notification}
          </p>
          <p className="text-xs text-text-muted mt-3">
            {currentCalmMonth.description}
          </p>

          <button onClick={acknowledgeEvent} className="btn-primary text-sm mt-6">
            Продолжить
          </button>
        </GlassPanel>
      </div>
    );
  }

  const event = currentEvent!;
  const wasInsured = activeInsurances.some(
    (ins) => ins.type === event.category && ins.expiresAtMonth > currentMonth
  );

  // key по идентификатору события: следующее событие монтирует карточку
  // заново, и встряска играет для каждого, а не только для первого.
  return (
    <EventCard
      key={event.id}
      event={event}
      wasInsured={wasInsured}
      onAcknowledge={acknowledgeEvent}
    />
  );
}

function EventCard({
  event,
  wasInsured,
  onAcknowledge,
}: {
  event: GameEvent;
  wasInsured: boolean;
  onAcknowledge: () => void;
}) {
  const [shaking, setShaking] = useState(true);
  const [flashing, setFlashing] = useState(true);

  useEffect(() => {
    hapticNotification('warning');
    const t1 = setTimeout(() => setShaking(false), 500);
    const t2 = setTimeout(() => setFlashing(false), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 50 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: shaking ? [0, -8, 8, -5, 5, 0] : 0,
          rotate: shaking ? [0, -1, 1, 0] : 0,
        }}
        transition={shaking
          ? { x: { duration: 0.5 }, rotate: { duration: 0.5 } }
          : { type: 'spring', damping: 20, stiffness: 150 }
        }
        className="relative"
      >
        {/* Money particles */}
        {!wasInsured && <MoneyParticles amount={event.financialLoss} />}

        <GlassPanel
          className={`p-8 max-w-md mx-auto relative overflow-hidden transition-colors duration-700 ${
            flashing ? 'bg-red-50' : ''
          }`}
        >
          {/* Flash overlay */}
          <AnimatePresence>
            {flashing && (
              <motion.div
                className="absolute inset-0 bg-red-100/50 pointer-events-none z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.7 }}
              />
            )}
          </AnimatePresence>

          {/* Иконка события */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 relative z-10"
            style={{ background: 'var(--gradient-danger)' }}
          >
            {(() => { const I = CATEGORY_ICONS[event.category]; return I ? <I size={40} className="text-white" /> : null; })()}
          </motion.div>

          {/* Уведомление */}
          <motion.div
            className="glass-panel-sm px-4 py-3 mb-5 relative z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-text-secondary">{event.notificationText}</p>
          </motion.div>

          <h2 className="text-xl font-bold text-text-primary text-center mb-2 relative z-10">
            {event.title}
          </h2>

          <p className="text-sm text-text-secondary text-center leading-relaxed mb-5 relative z-10">
            {event.description}
          </p>

          {/* Финансовый итог */}
          <motion.div
            className="glass-panel-sm px-4 py-3 mb-5 space-y-2 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {wasInsured ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Ущерб</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {formatMoney(event.financialLoss)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Страховка покроет</span>
                  <span className="text-lg font-bold text-accent-mint">
                    -{formatMoney(Math.min(event.insuranceCoverage, event.financialLoss))}
                  </span>
                </div>
                {event.financialLoss > event.insuranceCoverage && (
                  <div className="flex items-center justify-between border-t border-white/30 pt-2">
                    <span className="text-sm text-text-secondary">Доплатишь сам</span>
                    <span className="text-sm font-bold text-accent-coral">
                      {formatMoney(event.financialLoss - event.insuranceCoverage)}
                    </span>
                  </div>
                )}
                {event.financialLoss <= event.insuranceCoverage && (
                  <div className="flex items-center justify-between border-t border-white/30 pt-2">
                    <span className="text-sm font-medium text-accent-mint">Полное покрытие</span>
                    <span className="text-sm font-bold text-accent-mint">{formatMoney(0)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Ущерб</span>
                <span className="text-lg font-bold text-accent-coral">
                  -{formatMoney(event.financialLoss)}
                </span>
              </div>
            )}
          </motion.div>

          <div className="text-center relative z-10">
            <button onClick={onAcknowledge} className="btn-primary text-sm">
              {wasInsured ? 'Страховка сработала' : 'Принять удар'}
            </button>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
