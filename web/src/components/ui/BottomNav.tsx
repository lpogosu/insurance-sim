'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Gamepad2, Compass, MessageCircle } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Игра', icon: Gamepad2 },
  { path: '/explore', label: 'Исследуй', icon: Compass },
  { path: '/chat', label: 'Чат', icon: MessageCircle },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Не показываем навигацию на главной (там свои кнопки) и во время игры
  if (pathname === '/' || pathname === '/game') return null;

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.5 }}
    >
      <div className="w-full max-w-[430px] lg:max-w-[700px] mx-auto px-4 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="glass-panel-sm flex items-center justify-around py-2 px-2 mb-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === '/'
                ? pathname === '/' || pathname === '/results'
                : pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                  isActive ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-white/50"
                    layoutId="bottomNavIndicator"
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  />
                )}
                <Icon
                  size={20}
                  className={`relative ${isActive ? 'text-accent-brand' : ''}`}
                />
                <span className={`relative text-[10px] font-medium ${isActive ? 'text-text-primary' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
