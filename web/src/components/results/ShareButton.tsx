'use client';

import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { isTelegramMiniApp, shareResults } from '@/lib/telegram';
import type { GameResults } from '@/engine';

interface ShareButtonProps {
  results: GameResults;
}

export default function ShareButton({ results }: ShareButtonProps) {
  const isTg = isTelegramMiniApp();

  if (isTg) {
    return (
      <motion.button
        onClick={() =>
          shareResults({
            score: results.score,
            grade: results.grade,
            title: results.title,
            budgetRemaining: results.budgetRemaining,
            totalSaved: results.totalSaved,
            totalLost: results.totalLost,
          })
        }
        className="btn-secondary text-sm flex items-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Share2 size={16} />
        Поделиться
      </motion.button>
    );
  }

  // Вне мессенджера делиться нечем, кроме текста: ссылки на бота у сборки нет.
  const shareText = `РискЛаб — ${results.title}: ${results.score} / 100`;

  const shareOutsideMiniApp = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch {
        // Пользователь закрыл системный лист — тихо падаем в буфер обмена.
      }
    }
    await navigator.clipboard?.writeText(shareText);
  };

  return (
    <div className="flex gap-2">
      <motion.button
        onClick={shareOutsideMiniApp}
        className="btn-secondary text-sm flex items-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Share2 size={16} />
        Поделиться
      </motion.button>
    </div>
  );
}
