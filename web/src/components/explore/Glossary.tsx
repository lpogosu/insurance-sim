'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GLOSSARY } from '@/content/glossary';

export default function Glossary() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (term: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(term)) {
        next.delete(term);
      } else {
        next.add(term);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {GLOSSARY.map((item, i) => {
        const isOpen = expanded.has(item.term);
        const panelId = `glossary-term-${i}`;
        return (
          <motion.div
            key={item.term}
            className="glass-panel-sm overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', damping: 25, stiffness: 200 }}
          >
            <button
              onClick={() => toggle(item.term)}
              className="w-full p-4 text-left flex items-center justify-between"
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className="text-sm font-semibold text-text-primary">
                {item.term}
              </span>
              <motion.span
                className="text-text-muted text-xs"
                animate={{ rotate: isOpen ? 45 : 0 }}
                aria-hidden="true"
              >
                +
              </motion.span>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  id={panelId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2">
                    <p className="text-sm text-text-secondary">
                      {item.definition}
                    </p>
                    <p className="text-xs text-text-muted italic">
                      Пример: {item.example}
                    </p>
                    {item.relatedTerms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.relatedTerms.map((rt) => (
                          <button
                            key={rt}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(rt);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-accent-sky/15 text-accent-sky hover:bg-accent-sky/25 transition"
                          >
                            {rt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
