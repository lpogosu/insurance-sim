'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import type { GameResults } from '@/engine';
import { getAIReview } from '@/lib/coach-client';

interface AIReviewProps {
  results: GameResults;
  playerName: string;
}

export default function AIReview({ results, playerName }: AIReviewProps) {
  const [review, setReview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isFallback, setIsFallback] = useState(false);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Ответ прошлой попытки может прийти после нажатия «Повторить» —
    // флаг гарантирует, что в состояние попадёт только актуальный разбор.
    let ignore = false;

    getAIReview(results, playerName)
      .then(({ text, mode }) => {
        if (ignore) return;
        setReview(text);
        // Сервер сообщает, кто написал текст. Разбор из чисел и разбор от
        // модели различаются по стилю, и подменять один другим молча нельзя.
        setIsFallback(mode === 'rules');
        setLoading(false);
      })
      .catch(() => {
        if (ignore) return;
        setFailed(true);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [results, playerName, attempt]);

  const retry = () => {
    setLoading(true);
    setFailed(false);
    setDisplayedText('');
    setAttempt((n) => n + 1);
  };

  // Typewriter effect
  useEffect(() => {
    if (!review) return;
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(review.slice(0, i + 1));
      i++;
      if (i >= review.length) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [review]);

  return (
    <motion.div
      className="bg-white border-2 border-accent-brand rounded-2xl p-5 mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-accent-brand flex items-center justify-center text-white">
          <ClipboardList size={16} aria-hidden />
        </div>
        <div>
          <h3 className="text-[14px] font-display font-extrabold text-text-primary">Разбор партии</h3>
          {isFallback && (
            <span className="text-[10px] text-text-muted leading-none">
              собран из чисел партии — языковая модель не подключена
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-accent-brand"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
          <span className="text-xs text-text-muted ml-2">Анализирую стратегию...</span>
        </div>
      ) : failed ? (
        <div className="py-2">
          <p className="text-[13px] text-text-secondary leading-[1.7] mb-3">
            Разбор не загрузился — сервер не ответил. Числа выше посчитаны на твоём устройстве и от
            этого не зависят.
          </p>
          <button type="button" onClick={retry} className="btn-secondary text-sm">
            Повторить
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-[13px] text-text-secondary leading-[1.7] whitespace-pre-line">
            {displayedText}
            {displayedText.length < review.length && (
              <motion.span
                className="inline-block w-[2px] h-[1em] bg-accent-brand ml-1 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
