'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Confetti from '@/components/ui/Confetti';
import ScoreCard from '@/components/results/ScoreCard';
import RiskProfile from '@/components/results/RiskProfile';
import Achievements from '@/components/results/Achievements';
import LearningOutcomes from '@/components/results/LearningOutcomes';
import AIReview from '@/components/results/AIReview';
import WhatsNext from '@/components/results/WhatsNext';
import ShareButton from '@/components/results/ShareButton';
import { useGameStore, useGameHydrated } from '@/hooks/useGame';
import { getResults, generateLearningOutcomes, getRiskProfile } from '@/engine';
import CertificateDownload from '@/components/results/CertificateDownload';
import {
  ACHIEVEMENTS,
  getEarnedAchievements,
  saveAchievements,
} from '@/engine/achievements';

export default function ResultsPage() {
  const router = useRouter();
  const gameState = useGameStore();
  const hydrated = useGameHydrated();
  const [showConfetti, setShowConfetti] = useState(false);

  const results = useMemo(() => getResults(gameState), [gameState]);
  const outcomes = useMemo(() => generateLearningOutcomes(gameState), [gameState]);
  const riskProfile = useMemo(() => getRiskProfile(gameState), [gameState]);
  const earnedAchievements = useMemo(
    () => getEarnedAchievements(gameState),
    [gameState]
  );

  useEffect(() => {
    if (earnedAchievements.length > 0) {
      saveAchievements(earnedAchievements.map((a) => a.id));
    }
  }, [earnedAchievements]);

  // Confetti при хорошем результате
  useEffect(() => {
    if (gameState.monthHistory.length > 0 && results.score >= 60) {
      const timer = setTimeout(() => setShowConfetti(true), 800);
      return () => clearTimeout(timer);
    }
  }, [gameState.monthHistory.length, results.score]);

  // До подъёма сохранённой партии история пуста у всех — показывать
  // «игры не было» в этот момент нельзя.
  if (!hydrated) return null;

  // Если нет истории — значит, игра не пройдена
  if (gameState.monthHistory.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 text-center max-w-sm">
          <h2 className="text-xl font-bold text-text-primary mb-3">
            Сначала пройди игру
          </h2>
          <p className="text-sm text-text-secondary mb-5">
            Чтобы увидеть результаты, нужно завершить все 6 месяцев симуляции.
          </p>
          <button onClick={() => router.push('/')} className="btn-primary text-sm">
            На главную
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      <Confetti show={showConfetti} />

      <div className="w-full max-w-[430px] mx-auto lg:max-w-[900px] px-4 pt-8 space-y-6">
        {/* Шапка */}
        <motion.div
          className="text-center mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-sm text-text-muted">
            {gameState.playerName}, твои результаты
          </span>
        </motion.div>

        {/* Счёт и грейд */}
        <ScoreCard results={results} />

        {/* Профиль рисков */}
        <RiskProfile profile={riskProfile} />

        {/* Сертификат — крупная карточка сразу после профиля */}
        <CertificateDownload
          variant="card"
          playerName={gameState.playerName}
          playerAvatar={gameState.avatar}
          results={results}
          achievements={earnedAchievements.map((a) => a.title)}
        />

        {/* AI-разбор */}
        <AIReview results={results} playerName={gameState.playerName} />

        {/* Достижения */}
        <Achievements earned={earnedAchievements} all={ACHIEVEMENTS} />

        {/* Чему научился */}
        <LearningOutcomes outcomes={outcomes} />

        {/* Что дальше */}
        <WhatsNext />

        {/* Кнопки */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <button
            onClick={() => {
              useGameStore.getState().resetGame();
              router.push('/');
            }}
            className="btn-primary text-sm"
          >
            Играть снова
          </button>
          <button
            onClick={() => router.push('/explore')}
            className="btn-secondary text-sm"
          >
            Исследуй темы
          </button>
          <ShareButton results={results} />
        </motion.div>
      </div>
    </main>
  );
}
