'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
  rotation: number;
  duration: number;
  driftMid: number;
  driftEnd: number;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFB088', '#74B9FF',
  '#A29BFE', '#FD79A8', '#55EFC4', '#FFEAA7',
];

// Все случайные величины разыгрываются здесь, один раз на залп. Раньше
// длительность и снос считались прямо в пропсах анимации и пересчитывались
// на каждом рендере — частицы дёргались посреди полёта.
function makeParticles(): Particle[] {
  return Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
    duration: 2.5 + Math.random(),
    driftMid: (Math.random() - 0.5) * 100,
    driftEnd: (Math.random() - 0.5) * 150,
  }));
}

function Burst() {
  const [particles] = useState(makeParticles);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (done) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, rotate: p.rotation, opacity: 1 }}
          animate={{
            y: '110vh',
            rotate: p.rotation + 720,
            opacity: [1, 1, 0.8, 0],
            x: [0, p.driftMid, p.driftEnd],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}
    </div>
  );
}

/**
 * Залп — это отдельный монтаж `Burst`: набор частиц разыгрывается в
 * инициализаторе состояния и живёт ровно столько, сколько живёт компонент.
 */
export default function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  return <Burst />;
}
