declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
    WebApp?: TelegramWebApp; // MAX messenger (API-совместим)
  }
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  colorScheme: 'light' | 'dark';
  /**
   * Подписанная строка от Telegram. В отличие от `initDataUnsafe`, её можно
   * проверить на сервере — этим занимается `@/server/telegram`.
   */
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
  };
  platform: string;
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  // Telegram
  if (window.Telegram?.WebApp) return window.Telegram.WebApp;
  // MAX (совместимый API)
  if (window.WebApp?.initDataUnsafe?.user) return window.WebApp;
  return null;
}

export function isTelegramMiniApp(): boolean {
  return getTelegramWebApp() !== null;
}

export function getTelegramUser(): { name: string; id: number } | null {
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe?.user) {
    return {
      name: tg.initDataUnsafe.user.first_name,
      id: tg.initDataUnsafe.user.id,
    };
  }
  return null;
}

export function shareResults(results: {
  score: number;
  grade: string;
  title: string;
  budgetRemaining: number;
  totalSaved: number;
  totalLost: number;
}): void {
  const wa = getTelegramWebApp();
  if (wa && typeof wa.sendData === 'function') {
    wa.sendData(
      JSON.stringify({
        type: 'share_results',
        ...results,
      })
    );
  }
}

export function initTelegram(): void {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
  }
}

// Haptic feedback
export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): void {
  const tg = getTelegramWebApp();
  if (tg && 'HapticFeedback' in tg) {
    (tg as Record<string, unknown> & { HapticFeedback: { impactOccurred: (s: string) => void } }).HapticFeedback.impactOccurred(style);
  }
}

export function hapticNotification(type: 'success' | 'warning' | 'error' = 'success'): void {
  const tg = getTelegramWebApp();
  if (tg && 'HapticFeedback' in tg) {
    (tg as Record<string, unknown> & { HapticFeedback: { notificationOccurred: (t: string) => void } }).HapticFeedback.notificationOccurred(type);
  }
}

export function hapticSelection(): void {
  const tg = getTelegramWebApp();
  if (tg && 'HapticFeedback' in tg) {
    (tg as Record<string, unknown> & { HapticFeedback: { selectionChanged: () => void } }).HapticFeedback.selectionChanged();
  }
}

/**
 * SDK подключён со `strategy="beforeInteractive"`, поэтому к моменту
 * гидратации объект уже на месте и больше не меняется. Подписка ничего не
 * слушает — она нужна только для сигнатуры `useSyncExternalStore`, который
 * позволяет прочитать имя прямо в рендере, а не досылать его через эффект.
 */
export function subscribeToTelegramUser(): () => void {
  return () => {};
}

export function getTelegramUserName(): string {
  return getTelegramUser()?.name ?? '';
}

/** На сервере Telegram-пользователя нет: поле рендерится пустым. */
export function getServerTelegramUserName(): string {
  return '';
}
