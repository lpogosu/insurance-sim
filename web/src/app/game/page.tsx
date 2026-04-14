'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import BudgetBar from '@/components/game/BudgetBar';
import Timeline from '@/components/game/Timeline';
import LessonCard from '@/components/game/LessonCard';
import InsuranceShop from '@/components/game/InsuranceShop';
import LivingPhase from '@/components/game/LivingPhase';
import EventNotification from '@/components/game/EventNotification';
import EventBreakdown from '@/components/game/EventBreakdown';
import MonthSummary from '@/components/game/MonthSummary';
import BankruptScreen from '@/components/game/BankruptScreen';
import { useGameStore, useGameHydrated } from '@/hooks/useGame';
import GameTutorial from '@/components/ui/GameTutorial';

export default function GamePage() {
  const router = useRouter();
  const { phase, playerName } = useGameStore();
  const hydrated = useGameHydrated();

  // Редирект только после подъёма сохранённой партии: до него имя пустое
  // у любого игрока, в том числе у того, кто просто обновил страницу.
  useEffect(() => {
    if (hydrated && !playerName) {
      router.replace('/');
    }
  }, [hydrated, playerName, router]);

  // Финальные результаты — редирект
  useEffect(() => {
    if (phase === 'final-results') {
      router.push('/results');
    }
  }, [phase, router]);

  if (!hydrated || !playerName) return null;

  return (
    <main className="min-h-screen pb-8">
      <GameTutorial />

      <div className="w-full max-w-[430px] mx-auto lg:max-w-[1200px] px-4">
        {/* Верхняя панель */}
        <div className="pt-4 mb-4 space-y-3">
          <div data-tutorial="budget">
            <BudgetBar />
          </div>
          <div className="glass-panel-sm px-4 py-2" data-tutorial="timeline">
            <Timeline />
          </div>
        </div>

        {/* Контент — зависит от фазы */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            data-tutorial="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {phase === 'lesson' && (
              <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                <div className="lg:col-span-5">
                  <LessonCard />
                </div>
                <div className="lg:col-span-7 hidden lg:block">
                  <div className="glass-panel p-6 opacity-50">
                    <p className="text-sm text-text-muted text-center">
                      Пройди урок, чтобы перейти к магазину страховок
                    </p>
                  </div>
                </div>
              </div>
            )}

            {phase === 'insurance-shop' && <InsuranceShop />}

            {phase === 'living' && <LivingPhase />}

            {phase === 'event' && <EventNotification />}

            {phase === 'event-result' && <EventNotification />}

            {phase === 'event-breakdown' && <EventBreakdown />}

            {phase === 'month-summary' && <MonthSummary />}

            {phase === 'bankrupt' && <BankruptScreen />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
