'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RotateCcw } from 'lucide-react';
import { sendChatMessage } from '@/lib/coach-client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  'Что такое страхование?',
  'Зачем страховать телефон?',
  'Что такое франшиза?',
  'Нужна ли страховка на отдыхе?',
  'Что такое ДМС?',
  'Страховка — это развод?',
];

const MAX_MESSAGES = 20;
const MIN_INTERVAL_MS = 3000;

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);
  const [withoutModel, setWithoutModel] = useState(false);
  const [failed, setFailed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLimitReached = messages.filter((m) => m.role === 'user').length >= MAX_MESSAGES;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping || isLimitReached) return;

      // Rate limiting
      const now = Date.now();
      if (now - lastSentAt < MIN_INTERVAL_MS) return;
      setLastSentAt(now);

      const userMsg: ChatMessage = { role: 'user', content: text.trim() };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput('');
      setIsTyping(true);

      // Ответы без модели приходят с сервера тем же путём: держать вторую
      // копию тех же формулировок на клиенте — значит гарантированно их
      // рассинхронизировать при первой же правке.
      try {
        const { text: reply, mode } = await sendChatMessage(updatedMessages);
        setWithoutModel(mode === 'rules');
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        setFailed(false);
      } catch {
        setFailed(true);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, isTyping, isLimitReached, lastSentAt]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const resetChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-6rem)]">
      {/* Сообщения */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <motion.div
              className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center bg-gradient-to-br from-accent-lavender to-accent-sky"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 150 }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </motion.div>
            <h3 className="text-base font-bold text-text-primary mb-1">
              Привет! Спроси меня про страхование
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              Объясню простым языком, без скучных терминов.
            </p>
            {/* Быстрые вопросы прямо в приветствии */}
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {QUICK_QUESTIONS.slice(0, 6).map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-xs px-3 py-2 rounded-xl bg-white/50 text-text-secondary hover:bg-white/70 transition border border-white/40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                  ? 'text-white rounded-br-lg'
                  : 'glass-panel-sm text-text-primary rounded-bl-lg'
                  }`}
                style={
                  msg.role === 'user'
                    ? { background: 'var(--gradient-accent)' }
                    : undefined
                }
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            className="flex justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="glass-panel-sm px-4 py-3 rounded-2xl rounded-bl-lg flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-accent-lavender"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Лимит сообщений */}
      {isLimitReached && (
        <motion.div
          className="mx-4 mb-2 glass-panel-sm p-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs text-text-secondary mb-2">
            Лимит сообщений достигнут ({MAX_MESSAGES}). Начни новый диалог.
          </p>
          <button
            onClick={resetChat}
            className="text-xs font-semibold text-accent-lavender flex items-center gap-1 mx-auto hover:opacity-80 transition"
          >
            <RotateCcw size={12} />
            Начать заново
          </button>
        </motion.div>
      )}

      {/* Ответ не пришёл: сеть или сервер */}
      {failed && (
        <div className="mx-4 mb-2 glass-panel-sm p-3 text-center" role="alert">
          <p className="text-xs text-text-secondary">
            Ответ не пришёл — сервер не отозвался. Отправь вопрос ещё раз.
          </p>
        </div>
      )}

      {/* Языковая модель не подключена — говорим об этом прямо, а не молчим */}
      {withoutModel && !failed && (
        <p className="mx-4 mb-2 text-[10px] text-text-muted text-center">
          Отвечает встроенный справочник: языковая модель не подключена.
        </p>
      )}

      {/* Быстрые вопросы уже отображаются в приветственном блоке */}

      {/* Ввод */}
      <form onSubmit={handleSubmit} className="p-4 pt-2">
        <div className="glass-panel-sm flex items-center gap-2 p-1.5 pl-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLimitReached ? 'Начни новый диалог' : 'Спроси про страхование...'}
            disabled={isLimitReached}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            aria-label="Отправить сообщение"
            disabled={!input.trim() || isTyping || isLimitReached}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30 transition"
            style={{ background: 'var(--gradient-accent)' }}
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}
