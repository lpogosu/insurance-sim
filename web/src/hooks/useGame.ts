'use client';

/**
 * Хранилище партии.
 *
 * Компоненты как вызывали `useGameStore()`, так и вызывают — снаружи ничего
 * не изменилось. Изменилось внутри: раньше каждое действие само правило
 * состояние через `get()` и `set()`, и проверить арифметику можно было только
 * кликами по экрану. Теперь действие — это отправка события в чистый редьюсер
 * (`@/engine/reducer`), а zustand отвечает ровно за две вещи: подписку React
 * и сохранение в localStorage.
 *
 * Побочный эффект такого разделения — `scripts/simulate.ts`, который играет
 * тысячи партий тем же кодом, ничего не зная про React.
 */

import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameAction } from '@/engine/actions';
import { EMPTY_STATE, reduce } from '@/engine/reducer';
import { seedFromString } from '@/engine/rng';
import type { GamePhase, GameState, InsuranceOption } from '@/engine/types';

interface GameActions {
  startGame: (name: string, avatar: string) => void;
  completeLesson: () => void;
  skipLesson: () => void;
  buyInsurance: (option: InsuranceOption) => void;
  finishShopping: () => void;
  finishLiving: () => void;
  acknowledgeEvent: () => void;
  finishBreakdown: () => void;
  nextMonth: () => void;
  resetGame: () => void;
  setPhase: (phase: GamePhase) => void;
}

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>()(
  persist(
    (set) => {
      const send = (action: GameAction): void => {
        set((state) => reduce(state as GameState, action));
      };

      return {
        ...EMPTY_STATE,

        startGame: (name, avatar) =>
          send({
            type: 'start',
            playerName: name,
            avatar,
            // Seed из имени и времени: две партии одного игрока различаются,
            // но любую конкретную можно воспроизвести, зная её seed.
            seed: seedFromString(`${name}:${Date.now()}`),
          }),

        completeLesson: () => send({ type: 'completeLesson' }),
        skipLesson: () => send({ type: 'skipLesson' }),
        buyInsurance: (option) => send({ type: 'buy', option }),
        finishShopping: () => send({ type: 'finishShopping' }),
        finishLiving: () => send({ type: 'live' }),
        acknowledgeEvent: () => send({ type: 'acknowledge' }),
        finishBreakdown: () => send({ type: 'finishBreakdown' }),
        nextMonth: () => send({ type: 'nextMonth' }),
        resetGame: () => send({ type: 'reset' }),

        // Прямая установка фазы нужна только обучающему оверлею, который
        // показывает экраны вне обычного порядка.
        setPhase: (phase) => set({ phase }),
      };
    },
    {
      name: 'risklab-game',
      // Функции в localStorage не кладём: при восстановлении они пришли бы
      // как undefined и молча сломали бы половину кнопок.
      partialize: (store) => {
        const { ...state } = store;
        const actions: (keyof GameActions)[] = [
          'startGame',
          'completeLesson',
          'skipLesson',
          'buyInsurance',
          'finishShopping',
          'finishLiving',
          'acknowledgeEvent',
          'finishBreakdown',
          'nextMonth',
          'resetGame',
          'setPhase',
        ];
        for (const key of actions) delete (state as Partial<GameStore>)[key];
        return state as GameState;
      },
    },
  ),
);

/**
 * Готово ли хранилище к чтению.
 *
 * `persist` поднимает партию из localStorage уже после первого рендера, и
 * до этого момента состояние пустое. Экраны игры и результатов раньше
 * принимали это за «игры не было» и выкидывали игрока на главную при любой
 * перезагрузке страницы посреди партии.
 */
export function useGameHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useGameStore.persist.onFinishHydration(onChange),
    () => useGameStore.persist.hasHydrated(),
    () => false,
  );
}
