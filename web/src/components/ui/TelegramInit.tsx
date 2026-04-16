'use client';

import { useEffect } from 'react';
import { initTelegram } from '@/lib/telegram';

export function TelegramInit() {
  useEffect(() => {
    initTelegram();
  }, []);
  return null;
}
