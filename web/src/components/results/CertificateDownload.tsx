'use client';

import { useState } from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import type { GameResults } from '@/engine';
import { formatMoney, getGrade } from '@/engine';

interface Props {
  playerName: string;
  playerAvatar: string;
  results: GameResults;
  achievements: string[];
  variant?: 'button' | 'card';
}

/* Colors matching the site */
const BG = '#f7f5f0';
const WHITE = '#ffffff';
const BORDER = '#e5e7eb';
const TEXT = '#1a1a2e';
const TEXT_DIM = '#6b7280';
const TEXT_MUTED = '#9ca3af';
const MINT = '#58cc02';
const MINT_DARK = '#4caf00';
const BRAND = '#1e56e0';
const CORAL = '#ff4b4b';
const SKY = '#00b8d9';

const W = 1190;
const H = 842;
const S = 2; // scale factor for retina quality
const CX = W / 2; // center X

/* Helper: draw rounded rect */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* Helper: load image as promise */
function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function CertificateDownload({ playerName, playerAvatar, results, achievements, variant = 'button' }: Props) {
  const [generating, setGenerating] = useState(false);

  const download = async () => {
    if (generating) return;
    setGenerating(true);

    try {
      /* Load fonts */
      await document.fonts.load('900 36px Nunito');
      await document.fonts.load('700 14px Nunito');
      await document.fonts.load('600 12px "DM Sans"');
      await document.fonts.ready;

      const grade = getGrade(results.score);

      /* Create canvas */
      const canvas = document.createElement('canvas');
      canvas.width = W * S;
      canvas.height = H * S;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(S, S);

      /* ── Background ── */
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      /* Green top accent */
      ctx.fillStyle = MINT;
      ctx.fillRect(0, 0, W, 4);

      /* Border frame */
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      roundRect(ctx, 14, 14, W - 28, H - 28, 16);
      ctx.stroke();

      /* ── Header ── */
      ctx.textBaseline = 'middle';

      // РискЛаб
      ctx.font = '900 20px Nunito';
      ctx.fillStyle = TEXT;
      ctx.textAlign = 'left';
      ctx.fillText('Риск', 44, 44);
      const riskW = ctx.measureText('Риск').width;
      ctx.fillStyle = MINT;
      ctx.fillText('Лаб', 44 + riskW, 44);

      /* ── Title ── */
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      ctx.font = '900 36px Nunito';
      ctx.fillStyle = TEXT;
      ctx.fillText('СЕРТИФИКАТ', CX, 105);

      ctx.font = '600 12px "DM Sans"';
      ctx.fillStyle = TEXT_DIM;
      ctx.fillText('СИМУЛЯЦИЯ СТРАХОВАНИЯ', CX, 125);

      /* ── Avatar ── */
      const avatarY = 170;
      if (playerAvatar) {
        try {
          const img = await loadImg(playerAvatar);
          const r = 26;
          ctx.save();
          ctx.beginPath();
          ctx.arc(CX, avatarY, r + 3, 0, Math.PI * 2);
          ctx.fillStyle = WHITE;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(CX, avatarY, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, CX - r, avatarY - r, r * 2, r * 2);
          ctx.restore();
        } catch {
          /* avatar failed to load, skip */
        }
      }

      /* ── Name ── */
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = '900 38px Nunito';
      ctx.fillStyle = TEXT;
      ctx.fillText(playerName, CX, 235);

      /* Divider line */
      const divW = 40;
      ctx.fillStyle = BORDER;
      ctx.fillRect(CX - divW, 248, divW * 2, 2);
      ctx.fillStyle = MINT;
      ctx.beginPath();
      ctx.arc(CX, 249, 3, 0, Math.PI * 2);
      ctx.fill();

      /* ── Grade card ── */
      const gradeCardW = 240;
      const gradeCardH = 90;
      const gradeCardX = CX - gradeCardW / 2;
      const gradeCardY = 270;

      // Card background
      ctx.fillStyle = WHITE;
      roundRect(ctx, gradeCardX, gradeCardY, gradeCardW, gradeCardH, 16);
      ctx.fill();
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      roundRect(ctx, gradeCardX, gradeCardY, gradeCardW, gradeCardH, 16);
      ctx.stroke();

      // Grade title
      ctx.textAlign = 'center';
      ctx.font = '800 13px Nunito';
      ctx.fillStyle = grade.color;
      ctx.fillText(grade.title.toUpperCase(), CX, gradeCardY + 30);

      // Score badge
      const badgeW = 140;
      const badgeH = 36;
      const badgeX = CX - badgeW / 2;
      const badgeY = gradeCardY + 42;

      ctx.fillStyle = MINT;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
      ctx.fill();
      // 3D bottom border
      ctx.fillStyle = MINT_DARK;
      roundRect(ctx, badgeX, badgeY + badgeH - 4, badgeW, 4, 0);
      ctx.fill();

      ctx.font = '900 22px Nunito';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${results.score} / 100`, CX, badgeY + 23);

      /* ── Stat cards ── */
      const statsData = [
        { label: 'Бюджет', value: formatMoney(results.budgetRemaining), color: BRAND },
        { label: 'Сохранено', value: formatMoney(results.totalSaved), color: MINT },
        { label: 'На страховки', value: formatMoney(results.totalSpent), color: SKY },
        { label: 'Потеряно', value: formatMoney(results.totalLost), color: CORAL },
      ];

      const cardW = 220;
      const cardH = 65;
      const cardGap = 16;
      const totalCardsW = cardW * 4 + cardGap * 3;
      const cardsStartX = CX - totalCardsW / 2;
      const cardsY = 390;

      statsData.forEach((stat, i) => {
        const x = cardsStartX + i * (cardW + cardGap);

        // Card bg
        ctx.fillStyle = WHITE;
        roundRect(ctx, x, cardsY, cardW, cardH, 12);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Shadow (subtle)
        ctx.strokeStyle = '#e8e8ec';
        ctx.lineWidth = 1;
        roundRect(ctx, x, cardsY, cardW, cardH, 12);
        ctx.stroke();

        // Left accent border
        ctx.fillStyle = stat.color;
        roundRect(ctx, x, cardsY + 8, 4, cardH - 16, 2);
        ctx.fill();

        // Label
        ctx.textAlign = 'center';
        ctx.font = '700 11px "DM Sans"';
        ctx.fillStyle = TEXT_DIM;
        ctx.fillText(stat.label, x + cardW / 2, cardsY + 24);

        // Value
        ctx.font = '900 20px Nunito';
        ctx.fillStyle = stat.color;
        ctx.fillText(stat.value, x + cardW / 2, cardsY + 50);
      });

      /* ── Achievements ── */
      if (achievements.length > 0) {
        const achY = 485;
        const achGap = 10;

        // Measure total width
        ctx.font = '800 12px Nunito';
        const achWidths = achievements.map((a) => ctx.measureText(a).width + 28);
        const totalAchW = achWidths.reduce((s, w) => s + w, 0) + achGap * (achievements.length - 1);
        let achX = CX - totalAchW / 2;

        achievements.forEach((a, i) => {
          const bw = achWidths[i];

          // Badge bg
          ctx.fillStyle = WHITE;
          roundRect(ctx, achX, achY, bw, 28, 10);
          ctx.fill();
          ctx.strokeStyle = BORDER;
          ctx.lineWidth = 1.5;
          roundRect(ctx, achX, achY, bw, 28, 10);
          ctx.stroke();

          // Badge text
          ctx.textAlign = 'center';
          ctx.font = '800 12px Nunito';
          ctx.fillStyle = TEXT_DIM;
          ctx.fillText(a, achX + bw / 2, achY + 18);

          achX += bw + achGap;
        });
      }

      /* ── Footer ── */
      const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

      ctx.textBaseline = 'alphabetic';
      ctx.font = '500 11px "DM Sans"';
      ctx.fillStyle = TEXT_DIM;
      ctx.textAlign = 'left';
      ctx.fillText(today, 44, H - 24);

      ctx.textAlign = 'right';
      ctx.fillStyle = TEXT_MUTED;
      ctx.font = '500 10px "DM Sans"';
      ctx.fillText('Интерактивный симулятор страхования', W - 44, H - 24);

      /* ── Export to PDF ── */
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [W, H],
      });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, W, H);
      pdf.save(`risklab-${playerName}.pdf`);

    } catch (e) {
      console.error('PDF error:', e);
    } finally {
      setGenerating(false);
    }
  };

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', damping: 25, stiffness: 200 }}
        className="glass-panel p-5"
      >
        <div className="flex items-center gap-3 mb-3 sm:mb-0 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-accent-mint/10 flex items-center justify-center shrink-0">
            <FileText size={24} className="text-accent-mint" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base font-bold text-text-primary leading-tight">
              Сертификат о&nbsp;прохождении
            </h3>
            <p className="text-xs text-text-secondary mt-1 leading-snug">
              Твой персональный PDF с&nbsp;результатами
            </p>
          </div>
          <button
            onClick={download}
            disabled={generating}
            className="btn-primary text-xs items-center gap-1.5 !px-4 !py-2.5 shrink-0 hidden sm:inline-flex"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {generating ? 'Создаю' : 'Скачать'}
          </button>
        </div>
        {/* Кнопка на всю ширину — только на мобилке */}
        <button
          onClick={download}
          disabled={generating}
          className="btn-primary text-sm inline-flex items-center justify-center gap-2 w-full sm:hidden"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {generating ? 'Создаю...' : 'Скачать сертификат'}
        </button>
      </motion.div>
    );
  }

  return (
    <button
      onClick={download}
      disabled={generating}
      className="btn-secondary text-sm inline-flex items-center gap-2"
    >
      {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
      {generating ? 'Создаю...' : 'Скачать сертификат'}
    </button>
  );
}
