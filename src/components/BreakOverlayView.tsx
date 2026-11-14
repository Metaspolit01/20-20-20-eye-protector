import React, { useEffect, useRef } from 'react';
import { Eye, SkipForward, Clock, Sparkles } from 'lucide-react';

interface BreakOverlayViewProps {
  remainingSeconds: number;
  onSkip: () => void;
  onSnooze: () => void;
}

export const BreakOverlayView: React.FC<BreakOverlayViewProps> = ({
  remainingSeconds,
  onSkip,
  onSnooze,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subtle floating light particles on HTML5 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = canvas.offsetWidth);
    const height = (canvas.height = canvas.offsetHeight);

    const particles = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 1,
      alpha: Math.random() * 0.45 + 0.15,
      speedY: -(Math.random() * 0.35 + 0.15),
      speedX: (Math.random() - 0.5) * 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(103, 232, 249, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const formattedTime = `00:${remainingSeconds.toString().padStart(2, '0')}`;

  return (
    <div
      role="region"
      aria-label="Full-Screen Eye Break Overlay"
      className="absolute inset-0 z-50 flex flex-col justify-between p-6 bg-gradient-to-b from-[#031024] via-[#09254a] to-[#020b18] text-white animate-fade-in overflow-hidden select-none"
    >
      {/* Floating Canvas Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Radial soft glow behind central eye */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-cyan-500/15 rounded-full blur-3xl pointer-events-none z-0 animate-pulse" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex justify-center pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-[11px] font-semibold tracking-wider uppercase shadow-lg shadow-cyan-950/50">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>20-20-20 Rule in Effect</span>
        </div>
      </div>

      {/* Center Cluster: Eye Visual, Headline, Big Monotonic Countdown, Subtexts */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto space-y-5">
        {/* Breathing Eye Element */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-ping opacity-30" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-900/60 to-blue-600/40 border-2 border-cyan-400/60 flex items-center justify-center shadow-xl shadow-cyan-950/60">
            <div className="relative flex items-center justify-center animate-pulse">
              <Eye className="w-12 h-12 text-cyan-300 transition-transform duration-1000 ease-in-out" />
              {/* Glowing pupil center */}
              <div className="absolute w-3.5 h-3.5 rounded-full bg-cyan-100 shadow-[0_0_12px_#38bdf8]" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5 px-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-white drop-shadow-md">
            Time for an Eye Break
          </h1>
          <p className="text-sm font-semibold text-cyan-100/90 leading-snug">
            Look at something 20 feet away for 20 seconds.
          </p>
          <p className="text-xs text-slate-400">
            Give your eyes a little rest.
          </p>
        </div>

        {/* Big Monotonic Countdown Display */}
        <div className="relative px-8 py-3 rounded-2xl bg-slate-900/70 border border-cyan-400/40 shadow-2xl backdrop-blur-md">
          <span className="font-mono text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-cyan-400 to-sky-300">
            {formattedTime}
          </span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-800/80 text-[10px] text-cyan-300 font-mono">
            SEC REMAINING
          </div>
        </div>
      </div>

      {/* Bottom Controls: Snooze 5 min & Skip */}
      <div className="relative z-10 flex items-center gap-3 pt-2">
        <button
          onClick={onSnooze}
          type="button"
          aria-label="Snooze break for 5 minutes"
          className="flex-1 flex items-center justify-center gap-1.5 py-3.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/60 text-slate-200 text-xs font-bold transition-all active:scale-[0.98] shadow-md hover:shadow-cyan-950/40"
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Snooze 5 min</span>
        </button>

        <button
          onClick={onSkip}
          type="button"
          aria-label="Skip eye break"
          className="flex-1 flex items-center justify-center gap-1.5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/50 text-white text-xs font-bold transition-all active:scale-[0.98] shadow-lg shadow-cyan-900/50"
        >
          <SkipForward className="w-4 h-4 text-white" />
          <span>Skip</span>
        </button>
      </div>
    </div>
  );
};
