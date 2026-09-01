import React, { useRef, useState } from 'react';
import { Wind, Zap, Sparkles, Shield, Swords } from 'lucide-react';

interface TouchControlsProps {
  onMove: (dx: number, dy: number) => void;
  onAttack: () => void;
  onShield: () => void;
  onSkill1: () => void;
  onSkill2: () => void;
  onUltimate: () => void;
  onDash: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onAttack,
  onShield,
  onSkill1,
  onSkill2,
  onUltimate,
  onDash,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateJoystick(e.touches[0]);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    updateJoystick(e.touches[0]);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const updateJoystick = (touch: React.Touch) => {
    const base = joystickBaseRef.current;
    if (!base) return;

    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2 - 10;

    if (dist <= maxRadius) {
      setKnobPos({ x: dx, y: dy });
      onMove(dx / maxRadius, dy / maxRadius);
    } else {
      const angle = Math.atan2(dy, dx);
      const clampedX = Math.cos(angle) * maxRadius;
      const clampedY = Math.sin(angle) * maxRadius;
      setKnobPos({ x: clampedX, y: clampedY });
      onMove(Math.cos(angle), Math.sin(angle));
    }
  };

  return (
    <div id="touch-controls-layer" className="md:hidden fixed inset-0 pointer-events-none z-30 flex justify-between items-end p-5 select-none font-sans">
      {/* Virtual Joystick */}
      <div
        ref={joystickBaseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-28 h-28 rounded-full bg-[#0c0c14]/80 border-2 border-stone-700/80 backdrop-blur-md relative pointer-events-auto flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
      >
        <div
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] absolute pointer-events-none transition-transform duration-75"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>

      {/* Action Buttons Cluster */}
      <div className="flex flex-col gap-2.5 items-end pointer-events-auto">
        <div className="flex gap-2">
          {/* Skill 1 */}
          <button
            onTouchStart={e => { e.preventDefault(); onSkill1(); }}
            className="w-11 h-11 rounded-full bg-[#11111a]/90 border border-cyan-500/80 text-cyan-300 flex items-center justify-center shadow-lg active:scale-90"
          >
            <Zap className="w-4 h-4" />
          </button>
          {/* Skill 2 */}
          <button
            onTouchStart={e => { e.preventDefault(); onSkill2(); }}
            className="w-11 h-11 rounded-full bg-[#11111a]/90 border border-purple-500/80 text-purple-300 flex items-center justify-center shadow-lg active:scale-90"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          {/* Ultimate */}
          <button
            onTouchStart={e => { e.preventDefault(); onUltimate(); }}
            className="w-11 h-11 rounded-full bg-[#11111a]/90 border border-amber-400 text-amber-300 flex items-center justify-center shadow-lg active:scale-90"
          >
            <span className="text-[9px] font-mono font-bold">ULT</span>
          </button>
        </div>

        <div className="flex gap-2.5 items-center">
          {/* Shield Button */}
          <button
            onTouchStart={e => { e.preventDefault(); onShield(); }}
            className="w-12 h-12 rounded-full bg-[#11111a]/90 border border-cyan-500/80 text-cyan-300 flex items-center justify-center shadow-lg active:scale-90"
            title="Shield"
          >
            <Shield className="w-5 h-5" />
          </button>
          {/* Dash */}
          <button
            onTouchStart={e => { e.preventDefault(); onDash(); }}
            className="w-12 h-12 rounded-full bg-[#11111a]/90 border border-emerald-500/80 text-emerald-400 flex items-center justify-center shadow-lg active:scale-90"
            title="Dodge"
          >
            <Wind className="w-5 h-5" />
          </button>
          {/* Primary Attack Button */}
          <button
            onTouchStart={e => { e.preventDefault(); onAttack(); }}
            className="w-15 h-15 rounded-full bg-gradient-to-tr from-amber-600 to-amber-700 border-2 border-amber-400 text-stone-950 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-90"
            title="Attack"
          >
            <Swords className="w-6 h-6 fill-stone-950" />
          </button>
        </div>
      </div>
    </div>
  );
};

