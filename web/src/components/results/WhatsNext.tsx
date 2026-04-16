'use client';

import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { REAL_SOURCES } from '@/content/glossary';

export default function WhatsNext() {
  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg font-bold text-text-primary mb-2">Что дальше?</h3>
      <p className="text-sm text-text-secondary mb-4">
        Ты узнал основы. Вот где можно углубиться в тему:
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {REAL_SOURCES.map((source, i) => (
          <motion.a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel-sm p-4 flex items-start justify-between gap-3 hover:bg-white/60 transition group"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
                {source.tag}
              </span>
              <h4 className="text-sm font-semibold text-text-primary mt-0.5">
                {source.title}
              </h4>
              <p className="text-xs text-text-secondary mt-1">
                {source.description}
              </p>
            </div>
            <ExternalLink
              size={16}
              className="text-text-muted group-hover:text-accent-brand transition shrink-0 mt-1"
            />
          </motion.a>
        ))}
      </div>
    </div>
  );
}
