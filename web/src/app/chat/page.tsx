'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatPage() {
  const router = useRouter();

  return (
    <main className="h-[100dvh] flex flex-col pb-16">

      <div className="w-full max-w-[430px] mx-auto lg:max-w-[700px] flex flex-col h-full">
        {/* Шапка */}
        <div className="flex items-center gap-3 px-4 pt-6 pb-3">
          <button
            onClick={() => router.push('/')}
            aria-label="На главную"
            className="w-10 h-10 rounded-xl glass-panel-sm flex items-center justify-center hover:bg-white/60 transition"
          >
            <ArrowLeft size={18} className="text-text-primary" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-text-primary">Задай вопрос</h1>
            <p className="text-xs text-text-secondary">Спроси про страхование</p>
          </div>
        </div>

        {/* Чат */}
        <div className="flex-1 min-h-0">
          <ChatWindow />
        </div>
      </div>
    </main>
  );
}
