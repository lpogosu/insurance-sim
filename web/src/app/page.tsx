'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Shield, Zap, BookOpen, ArrowRight, Smartphone, Plane } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { useGameStore } from '@/hooks/useGame';
import {
  subscribeToTelegramUser,
  getTelegramUserName,
  getServerTelegramUserName,
} from '@/lib/telegram';
import { AVATARS } from '@/lib/avatars';
import { updateStreak } from '@/lib/streak';

export default function HomePage() {
  const router = useRouter();
  const { startGame } = useGameStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Имя из Telegram — только значение по умолчанию: как только игрок начал
  // печатать, поле принадлежит ему.
  const telegramName = useSyncExternalStore(
    subscribeToTelegramUser,
    getTelegramUserName,
    getServerTelegramUserName
  );
  const [typedName, setTypedName] = useState<string | null>(null);
  const name = typedName ?? telegramName;
  const [avatar, setAvatar] = useState(AVATARS[0].id);

  // Счётчик визитов подряд читается на экране «Изучай»; здесь он только пишется.
  useEffect(() => {
    updateStreak();
  }, []);

  const handleStart = () => {
    if (!name.trim()) return;
    const selectedAvatar = AVATARS.find((a) => a.id === avatar);
    startGame(name.trim(), selectedAvatar?.src ?? AVATARS[0].src);
    router.push('/game');
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 pb-20">

      <div className="w-full max-w-[430px] lg:max-w-[1100px]">
        {!showOnboarding ? (
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            {/* Left — text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 150 }}
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div
                className="inline-flex items-center gap-2 glass-panel-sm px-4 py-1.5 mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-2 h-2 rounded-full bg-accent-mint animate-pulse" />
                <span className="text-xs font-medium text-text-secondary">
                  Интерактивный симулятор
                </span>
              </motion.div>

              <motion.h1
                className="font-display text-4xl lg:text-6xl font-extrabold text-text-primary mb-4 leading-[1.1] tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Риск<span className="gradient-text-hero">Лаб</span>
              </motion.h1>

              <motion.p
                className="text-base lg:text-lg text-text-secondary mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                У тебя 50 000 рублей и 6 месяцев. Телефон разобьётся, концерт отменят, на скейте упадёшь
                — справишься без страховки?
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="btn-primary text-sm inline-flex items-center justify-center gap-2"
                >
                  Начать игру
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => router.push('/explore')}
                  className="btn-secondary text-sm"
                >
                  Исследуй темы
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div
                className="grid grid-cols-3 gap-2 sm:gap-4 mt-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {[
                  { icon: Shield, value: '6', label: 'видов страховок', color: 'text-accent-brand', bg: 'bg-accent-brand/10' },
                  { icon: Zap, value: '18', label: 'реальных событий', color: 'text-accent-mint', bg: 'bg-accent-mint/10' },
                  { icon: BookOpen, value: '6', label: 'интерактивных уроков', color: 'text-accent-lavender', bg: 'bg-accent-lavender/10' },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    className="glass-panel-sm p-3 sm:p-4 lg:p-5 text-center overflow-hidden"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                  >
                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                      <s.icon size={20} className={s.color} />
                    </div>
                    <p className="font-display text-2xl font-bold text-text-primary">{s.value}</p>
                    <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5 leading-tight">{s.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — hero logo (desktop only) */}
            <HeroVisual />
          </div>
        ) : (
          <motion.div
            className="max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassPanel className="p-8">
              <div className="text-center mb-6">
                <h2 className="font-display text-xl font-bold text-text-primary">
                  Как тебя зовут?
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  Это имя будет использоваться в игре
                </p>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Введи имя"
                maxLength={20}
                className="w-full bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-5 py-3 text-base text-text-primary placeholder:text-text-muted outline-none focus:border-accent-brand/50 focus:ring-2 focus:ring-accent-brand/20 transition mb-5"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />

              <div className="mb-6">
                <p className="text-xs text-text-muted text-center mb-3">
                  Выбери аватар
                </p>
                <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
                  {AVATARS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAvatar(a.id)}
                      aria-pressed={avatar === a.id}
                      className={`w-[80px] h-[80px] rounded-2xl flex flex-col items-center justify-center overflow-hidden transition ${
                        avatar === a.id
                          ? 'bg-white/80 ring-2 ring-accent-brand/50 scale-105'
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                    >
                      {/* Локальные PNG 200x200 из public: оптимизатор next/image
                          здесь не даёт выигрыша, только лишний маршрут. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.src}
                        alt={a.label}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <span className="text-[9px] text-text-muted mt-0.5 leading-none">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="btn-secondary text-sm flex-1"
                >
                  Назад
                </button>
                <button
                  onClick={handleStart}
                  disabled={!name.trim()}
                  className="btn-primary text-sm flex-1 disabled:opacity-40"
                >
                  Начать
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </div>
    </main>
  );
}

/* =========================================
   Hero Visual — Desktop: превью игровых событий
   ========================================= */
const PREVIEW_EVENTS = [
  { month: 'Январь', icon: Smartphone, label: 'Разбитый экран', amount: '7 000', insured: true },
  { month: 'Февраль', icon: Plane, label: 'Отмена рейса', amount: '15 000', insured: false },
  { month: 'Март', icon: Zap, label: 'Кража телефона', amount: '21 000', insured: false },
];

function HeroVisual() {
  return (
    <div className="hidden lg:flex items-center justify-center">
      <motion.div
        className="w-[440px]"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, type: 'spring', damping: 25 }}
      >
        <div className="space-y-3">
          {PREVIEW_EVENTS.map((evt, i) => (
            <motion.div
              key={evt.month}
              className="glass-panel p-4 flex items-center gap-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.25, type: 'spring', damping: 25 }}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                evt.insured ? 'bg-accent-mint/10' : 'bg-accent-coral/10'
              }`}>
                <evt.icon size={20} className={evt.insured ? 'text-accent-mint' : 'text-accent-coral'} />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="text-sm font-semibold text-text-primary">{evt.label}</span>
                  <span className="text-xs text-text-muted">{evt.month}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-text-primary">-{evt.amount} {'\u20BD'}</span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                    evt.insured
                      ? 'bg-accent-mint/12 text-accent-mint'
                      : 'bg-accent-coral/12 text-accent-coral'
                  }`}>
                    {evt.insured ? 'Страховка покрыла' : 'Из своего кармана'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-center text-sm text-text-muted mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          Это реальные события из игры. Справишься лучше?
        </motion.p>
      </motion.div>
    </div>
  );
}
