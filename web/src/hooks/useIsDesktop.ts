'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Ширина экрана читается через `useSyncExternalStore`, а не через
 * `useEffect` + `setState`: иначе первый кадр на десктопе всегда рисуется
 * мобильной вёрсткой и перескакивает после гидратации.
 */
export function useIsDesktop(breakpoint = 1024): boolean {
  const query = `(min-width: ${breakpoint}px)`;

  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  // На сервере ширины нет — разметка рендерится мобильной, как и раньше.
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
