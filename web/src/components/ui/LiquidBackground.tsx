'use client';

export default function LiquidBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
      <div
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[100px] opacity-70 animate-float"
        style={{ background: 'var(--blob-1)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-60 animate-float"
        style={{ background: 'var(--blob-2)', animationDelay: '-5s' }}
      />
      <div
        className="absolute top-[40%] left-[30%] w-[35vw] h-[35vw] rounded-full blur-[80px] opacity-55 animate-float"
        style={{ background: 'var(--blob-3)', animationDelay: '-2s' }}
      />
      <div
        className="absolute top-[10%] right-[15%] w-[25vw] h-[25vw] rounded-full blur-[90px] opacity-45 animate-float"
        style={{ background: 'var(--blob-4)', animationDelay: '-8s' }}
      />
      <div
        className="absolute bottom-[5%] left-[-5%] w-[40vw] h-[40vw] rounded-full blur-[110px] opacity-50 animate-float"
        style={{ background: 'var(--blob-5)', animationDelay: '-11s' }}
      />
    </div>
  );
}
