'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Wallet, CalendarDays, BookOpen, ShoppingCart, MousePointerClick } from 'lucide-react';
import { useGameStore } from '@/hooks/useGame';

const INTRO_KEY = 'risklab_game_tutorial_done';
const SHOP_KEY = 'risklab_shop_tutorial_done';

type TooltipPosition = 'below' | 'above' | 'overlay';

interface SpotlightStep {
  target: string;
  title: string;
  text: string;
  icon: React.FC<{ size?: number; className?: string }>;
  tooltipPosition: TooltipPosition;
  padding: number;
}

const INTRO_STEPS: SpotlightStep[] = [
  {
    target: 'budget',
    title: 'Твой бюджет',
    text: 'Наверху — полоска бюджета: 50 000 руб на 6 месяцев. Если деньги закончатся — игра завершится досрочно.',
    icon: Wallet,
    tooltipPosition: 'below',
    padding: 8,
  },
  {
    target: 'timeline',
    title: 'Месяцы и события',
    text: 'Шкала из 6 месяцев. После каждого — иконка результата: зелёная — страховка сработала, красная — потери.',
    icon: CalendarDays,
    tooltipPosition: 'below',
    padding: 6,
  },
  {
    target: 'content',
    title: 'Начни с урока',
    text: 'Каждый месяц начинается с короткого урока о страховании. Пройди его — и откроется магазин страховок.',
    icon: BookOpen,
    tooltipPosition: 'overlay',
    padding: 8,
  },
];

const SHOP_STEPS: SpotlightStep[] = [
  {
    target: 'shop-grid',
    title: 'Магазин страховок',
    text: 'Здесь 6 видов страховок. На все сразу не хватит — выбирай, от чего защититься в этом месяце. Покрытие у каждой разное.',
    icon: ShoppingCart,
    tooltipPosition: 'overlay',
    padding: 8,
  },
  {
    target: 'shop-go',
    title: 'Прожить месяц',
    text: 'Когда выбрал страховки — жми "Прожить месяц". Случится событие — и ты увидишь, помогла ли страховка.',
    icon: MousePointerClick,
    tooltipPosition: 'above',
    padding: 8,
  },
];

const TOOLTIP_WIDTH = 310;
const TOOLTIP_GAP = 14;
const VIEWPORT_MARGIN = 12;

type Flow = 'intro' | 'shop';

export default function GameTutorial() {
  const { phase } = useGameStore();
  const [activeFlow, setActiveFlow] = useState<Flow | null>(null);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewportH, setViewportH] = useState(0);
  const rafRef = useRef(0);
  const scrollingRef = useRef(false);

  // useMemo, а не выражение: массив пересоздавался на каждый рендер и тянул
  // за собой measure(), который перевешивал ResizeObserver в бесконечном цикле.
  const steps = useMemo(
    () => (activeFlow === 'intro' ? INTRO_STEPS : activeFlow === 'shop' ? SHOP_STEPS : []),
    [activeFlow],
  );

  // Trigger intro on first load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(INTRO_KEY)) return;
    const timer = setTimeout(() => {
      setActiveFlow('intro');
      setStep(0);
      setViewportH(window.innerHeight);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Trigger shop tutorial when first entering shop phase
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (phase !== 'insurance-shop') return;
    if (localStorage.getItem(SHOP_KEY)) return;
    if (activeFlow === 'intro') return; // don't interrupt intro
    const timer = setTimeout(() => {
      setActiveFlow('shop');
      setStep(0);
      setViewportH(window.innerHeight);
    }, 600);
    return () => clearTimeout(timer);
  }, [phase, activeFlow]);

  const measure = useCallback(() => {
    if (!steps[step]) return;
    const el = document.querySelector(`[data-tutorial="${steps[step].target}"]`);
    if (!el) return;

    const r = el.getBoundingClientRect();
    const margin = 80;
    const offscreen = r.top < margin || r.bottom > window.innerHeight - margin;

    if (offscreen) {
      scrollingRef.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const r2 = el.getBoundingClientRect();
        setRect(r2);
        setViewportH(window.innerHeight);
        scrollingRef.current = false;
      }, 500);
      return;
    }

    setRect(r);
    setViewportH(window.innerHeight);
  }, [step, steps]);

  useEffect(() => {
    if (!activeFlow) return;
    const timer = setTimeout(measure, 200);

    const handleResize = () => {
      if (scrollingRef.current) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [activeFlow, step, measure]);

  useEffect(() => {
    if (!activeFlow || !steps[step]) return;
    const el = document.querySelector(`[data-tutorial="${steps[step].target}"]`);
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeFlow, step, measure, steps]);

  const finish = useCallback(() => {
    if (activeFlow === 'intro') localStorage.setItem(INTRO_KEY, 'true');
    if (activeFlow === 'shop') localStorage.setItem(SHOP_KEY, 'true');
    setActiveFlow(null);
    setRect(null);
  }, [activeFlow]);

  const next = useCallback(() => {
    if (step + 1 >= steps.length) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }, [step, steps.length, finish]);

  if (!activeFlow || steps.length === 0) return null;

  const current = steps[step];
  if (!current) return null;

  const Icon = current.icon;
  const isLast = step + 1 >= steps.length;
  const pad = current.padding;
  const pos = current.tooltipPosition;

  // Tooltip positioning
  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect) return { opacity: 0, position: 'fixed', zIndex: 101 };

    const centerX = rect.x + rect.width / 2;
    let left = centerX - TOOLTIP_WIDTH / 2;
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN));

    if (pos === 'overlay') {
      return {
        position: 'fixed',
        top: Math.max(VIEWPORT_MARGIN, rect.y + 24),
        left,
        width: TOOLTIP_WIDTH,
        zIndex: 101,
      };
    }

    if (pos === 'below') {
      return {
        position: 'fixed',
        top: rect.bottom + pad + TOOLTIP_GAP,
        left,
        width: TOOLTIP_WIDTH,
        zIndex: 101,
      };
    }

    return {
      position: 'fixed',
      bottom: viewportH - rect.top + pad + TOOLTIP_GAP,
      left,
      width: TOOLTIP_WIDTH,
      zIndex: 101,
    };
  };

  const getArrowLeft = (): number => {
    if (!rect) return TOOLTIP_WIDTH / 2;
    const centerX = rect.x + rect.width / 2;
    let tooltipLeft = centerX - TOOLTIP_WIDTH / 2;
    tooltipLeft = Math.max(VIEWPORT_MARGIN, Math.min(tooltipLeft, window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN));
    return Math.max(20, Math.min(centerX - tooltipLeft, TOOLTIP_WIDTH - 20));
  };

  const showArrow = pos !== 'overlay';

  return (
    <AnimatePresence>
      {activeFlow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Click blocker */}
          <div className="fixed inset-0 z-[99]" />

          {/* Spotlight cutout */}
          {rect && (
            <motion.div
              className="fixed z-[100] pointer-events-none"
              style={{
                borderRadius: 16,
                border: '2px solid rgba(30, 86, 224, 0.3)',
                boxShadow: `
                  0 0 0 9999px rgba(0, 0, 0, 0.35),
                  0 0 30px rgba(30, 86, 224, 0.12)
                `,
              }}
              initial={false}
              animate={{
                x: rect.x - pad,
                y: rect.y - pad,
                width: rect.width + pad * 2,
                height: rect.height + pad * 2,
              }}
              transition={{
                type: 'spring',
                damping: 28,
                stiffness: 200,
              }}
            />
          )}

          {/* Tooltip */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeFlow}-${step}`}
              style={getTooltipStyle()}
              initial={{ opacity: 0, y: pos === 'above' ? 8 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: pos === 'above' ? 8 : -8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250, delay: 0.12 }}
            >
              <div className="relative bg-white rounded-2xl border-2 border-border-light border-b-[3px] shadow-lg">
                {/* Arrow */}
                {showArrow && pos === 'below' && (
                  <div
                    className="absolute -top-[7px] w-0 h-0"
                    style={{
                      left: getArrowLeft(),
                      transform: 'translateX(-50%)',
                      borderLeft: '7px solid transparent',
                      borderRight: '7px solid transparent',
                      borderBottom: '7px solid white',
                      filter: 'drop-shadow(0 -1px 0 rgba(0,0,0,0.08))',
                    }}
                  />
                )}
                {showArrow && pos === 'above' && (
                  <div
                    className="absolute -bottom-[7px] w-0 h-0"
                    style={{
                      left: getArrowLeft(),
                      transform: 'translateX(-50%)',
                      borderLeft: '7px solid transparent',
                      borderRight: '7px solid transparent',
                      borderTop: '7px solid white',
                      filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.08))',
                    }}
                  />
                )}

                <div className="p-4">
                  {/* Header: icon + counter + close */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-accent-brand/10 flex items-center justify-center">
                        <Icon size={16} className="text-accent-brand" />
                      </div>
                      <span className="text-[11px] text-text-muted font-medium">
                        {step + 1} / {steps.length}
                      </span>
                    </div>
                    <button
                      onClick={finish}
                      aria-label="Закрыть подсказку"
                      className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-gray-200 transition"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Content */}
                  <h3 className="text-sm font-bold text-text-primary mb-1">
                    {current.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed mb-3">
                    {current.text}
                  </p>

                  {/* Dots + button */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {steps.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === step
                              ? 'w-4 bg-accent-brand'
                              : i < step
                                ? 'w-1.5 bg-accent-brand/40'
                                : 'w-1.5 bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={next}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition hover:opacity-90"
                      style={{ background: '#1e56e0' }}
                    >
                      {isLast ? 'Понятно' : 'Далее'}
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
