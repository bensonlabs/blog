import React, { useEffect, useRef } from 'react';
import { Player, DungeonFloor } from '../types/game';
import { Crown, Sparkles, RotateCcw, Swords } from 'lucide-react';

interface VictoryModalProps {
  player: Player;
  floor: DungeonFloor;
  onRestart: () => void;
  onChangeHero?: () => void;
  onContinueEndless: () => void;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  alpha: number;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  player,
  floor,
  onRestart,
  onChangeHero,
  onContinueEndless,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#fbbf24', '#f59e0b', '#38bdf8', '#a855f7', '#34d399', '#f43f5e'];
    const particles: ConfettiPiece[] = [];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width * 0.5 + (Math.random() * 200 - 100),
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        alpha: 1,
      });
    }

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98;
        p.rotation += p.vRot;
        if (p.y > canvas.height * 0.4) {
          p.alpha = Math.max(0, p.alpha - 0.008);
        }

        if (p.alpha > 0) {
          alive++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      if (alive > 0) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div id="modal-victory-overlay" className="fixed inset-0 z-50 bg-[#050508]/90 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans text-stone-300">
      {/* Celebration canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

      <div className="relative z-20 bg-[#0c0c14] border-2 border-amber-500/90 rounded-xl sm:rounded-2xl max-w-md w-full p-6 shadow-[0_0_60px_rgba(245,158,11,0.35)] flex flex-col items-center text-center gap-5 animate-in fade-in zoom-in duration-200">
        {/* Crown Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
          <Crown className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-500 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Legendary Champion of Olympus
          </span>
          <h2 className="text-3xl font-serif font-black tracking-wide text-stone-100">MYTHIC VICTORY!</h2>
          <p className="text-xs text-stone-400 mt-1">
            You have vanquished the ancient Titan Typhon and freed Mount Olympus from eternal darkness!
          </p>
        </div>

        {/* Hero Final Stats */}
        <div className="w-full bg-[#08080c] p-4 rounded-xl border border-stone-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left text-xs font-mono">
          <div className="flex flex-col">
            <span className="text-stone-500 text-[10px] uppercase font-bold">Floors Cleared</span>
            <span className="text-base font-bold text-amber-400">{floor.floorNumber}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-stone-500 text-[10px] uppercase font-bold">Hero Level</span>
            <span className="text-base font-bold text-amber-400">LVL {player.level}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-stone-500 text-[10px] uppercase font-bold">Total Kills</span>
            <span className="text-base font-bold text-red-400">{player.totalKills}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-stone-500 text-[10px] uppercase font-bold">Damage Dealt</span>
            <span className="text-base font-bold text-cyan-400">{player.damageDealt.toLocaleString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-stone-500 text-[10px] uppercase font-bold">Bosses Slain</span>
            <span className="text-base font-bold text-yellow-400">{player.bossesSlain}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-stone-500 text-[10px] uppercase font-bold">Gold Collected</span>
            <span className="text-base font-bold text-amber-300">{player.gold}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            id="btn-continue-endless"
            onClick={onContinueEndless}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold rounded-xl border border-amber-400 shadow-lg flex items-center justify-center gap-2 transition active:scale-95 text-xs uppercase tracking-wider cursor-pointer"
          >
            <Swords className="w-4 h-4" />
            <span>Descend into Infinite Tartarus</span>
          </button>
          <button
            id="btn-restart-victory"
            onClick={onRestart}
            className="w-full py-2.5 bg-[#11111a] hover:bg-[#1a1a24] text-stone-300 hover:text-stone-100 font-bold rounded-xl border border-stone-700 flex items-center justify-center gap-2 transition active:scale-95 text-xs uppercase tracking-wider cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Embark on a New Journey</span>
          </button>
          {onChangeHero && (
            <button
              id="btn-change-hero-victory"
              onClick={onChangeHero}
              className="w-full py-2 bg-transparent hover:bg-[#11111a] text-stone-400 hover:text-stone-200 font-medium rounded-xl border border-stone-800 flex items-center justify-center gap-2 transition active:scale-95 text-xs uppercase tracking-wider cursor-pointer"
            >
              <span>Choose Different Hero</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
