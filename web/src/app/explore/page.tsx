'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Flame } from 'lucide-react';
import CategoryCard from '@/components/explore/CategoryCard';
import CategoryModal from '@/components/explore/CategoryModal';
import Glossary from '@/components/explore/Glossary';
import QuizSection from '@/components/explore/QuizSection';
import MythsVsFacts from '@/components/explore/MythsVsFacts';
import { updateStreak, subscribeToStreak, getStreak, getServerStreak } from '@/lib/streak';
import type { InsuranceType } from '@/engine';

type Tab = 'categories' | 'glossary' | 'quiz' | 'myths';

const CATEGORIES: {
  type: InsuranceType;
  title: string;
  subtitle: string;
  color: string;
}[] = [
  { type: 'device', title: 'Электроника', subtitle: 'Телефоны, ноутбуки, наушники', color: '#3B82F6' },
  { type: 'travel', title: 'Путешествия', subtitle: 'Рейсы, багаж, здоровье за границей', color: '#10B981' },
  { type: 'sports', title: 'Спорт', subtitle: 'Травмы, экстрим, дворовые игры', color: '#F59E0B' },
  { type: 'event', title: 'Мероприятия', subtitle: 'Концерты, фестивали, матчи', color: '#8B5CF6' },
  { type: 'digital', title: 'Цифровые активы', subtitle: 'Аккаунты, подписки, кибер', color: '#EC4899' },
  { type: 'health', title: 'Здоровье', subtitle: 'Медицина, стоматология, ДМС', color: '#EF4444' },
];

type CategoryInfo = (typeof CATEGORIES)[number];

export default function ExplorePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('categories');
  const streak = useSyncExternalStore(subscribeToStreak, getStreak, getServerStreak);
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null);

  // Засчитываем визит; новое значение прилетит через подписку на хранилище.
  useEffect(() => {
    updateStreak();
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'categories', label: 'Категории' },
    { id: 'quiz', label: 'Квиз' },
    { id: 'myths', label: 'Мифы' },
    { id: 'glossary', label: 'Глоссарий' },
  ];

  return (
    <main className="min-h-screen pb-24">

      <div className="w-full max-w-[430px] mx-auto lg:max-w-[900px] px-4 pt-6">
        {/* Шапка */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/')}
            aria-label="На главную"
            className="w-10 h-10 rounded-xl glass-panel-sm flex items-center justify-center hover:bg-white/60 transition"
          >
            <ArrowLeft size={18} className="text-text-primary" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Исследуй</h1>
            <p className="text-xs text-text-secondary">Всё о страховании простым языком</p>
          </div>
          {streak > 1 && (
            <div className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200">
              <Flame size={14} className="text-orange-500" />
              <span className="text-xs font-bold text-orange-600">{streak}</span>
            </div>
          )}
        </div>

        {/* Табы */}
        <div className="glass-panel-sm p-1 flex gap-0.5 mb-6 overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap px-2 ${
                tab === t.id
                  ? 'bg-white/70 text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Контент */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'categories' && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                  {CATEGORIES.map((cat) => (
                    <CategoryCard
                      key={cat.type}
                      {...cat}
                      onDesktopClick={() => setSelectedCategory(cat)}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {selectedCategory && (
                    <CategoryModal
                      type={selectedCategory.type}
                      title={selectedCategory.title}
                      subtitle={selectedCategory.subtitle}
                      color={selectedCategory.color}
                      onClose={() => setSelectedCategory(null)}
                    />
                  )}
                </AnimatePresence>
                {/* Статистический блок */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  {[
                    { value: '18', label: 'реальных сценариев', sub: 'из жизни подростков' },
                    { value: 'до 40 000 \u20BD', label: 'типичные потери', sub: 'без страховки' },
                    { value: 'от 1 200 \u20BD/мес', label: 'стоимость защиты', sub: 'цена спокойствия' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="glass-panel-sm p-5 text-center"
                    >
                      <p className="font-display text-xl font-bold text-text-primary">
                        {stat.value}
                      </p>
                      <p className="text-sm font-medium text-text-secondary mt-1">
                        {stat.label}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {stat.sub}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === 'quiz' && <QuizSection />}

            {tab === 'myths' && <MythsVsFacts />}

            {tab === 'glossary' && <Glossary />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
