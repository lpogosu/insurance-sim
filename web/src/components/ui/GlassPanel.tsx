'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  small?: boolean;
}

export default function GlassPanel({
  children,
  className = '',
  small,
  ...props
}: GlassPanelProps) {
  return (
    <motion.div
      className={`${small ? 'glass-panel-sm' : 'glass-panel'} ${className}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
