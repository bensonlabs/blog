import React, { useState } from 'react';
import { HeroClassType } from '../types/game';
import { HERO_CLASSES } from '../game/classes';
import { Shield, Zap, Target, Sparkles, ChevronRight, Play, Swords } from 'lucide-react';

interface HeroSelectProps {
  onStartGame: (classType: HeroClassType) => void;
}

export const HeroSelect: React.FC<HeroSelectProps> = ({ onStartGame }) => {
  const [selectedClass, setSelectedClass] = useState<HeroClassType>('warrior');
  const classList = Object.values(HERO_CLASSES);
  const currentClass = HERO_CLASSES[selectedClass];

  return (
    <div id="hero-select-screen" className="fixed inset-0 z-50 bg-[#050508]/98 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans text-stone-300">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-[#050508] to-[#050508] pointer-events-none" />

      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center text-center gap-6">
        {/* Title Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1 bg-[#11111a] border border-stone-800 rounded-full text-amber-500/90 text-[10px] font-bold tracking-[0.25em] uppercase">
            <Swords className="w-3.5 h-3.5 text-amber-500" />
            Mythological Action Roguelike
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-stone-100 tracking-wide drop-shadow-[0_0_25px_rgba(245,158,11,0.2)]">
            MYTHIC DUNGEON CRAWLER
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm max-w-lg leading-relaxed">
            Descend into the shifting labyrinth of antiquity, defeat legendary mythical beasts, and harness divine god blessings.
          </p>
        </div>

        {/* Character Archetype Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
          {classList.map(cls => {
            const isSelected = cls.id === selectedClass;
            const Icon = cls.id === 'warrior' ? Shield : cls.id === 'mage' ? Zap : Target;

            return (
              <div
                key={cls.id}
                id={`card-hero-${cls.id}`}
                onClick={() => setSelectedClass(cls.id)}
                className={`relative cursor-pointer rounded-xl sm:rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#11111a] border-amber-500/90 shadow-[0_0_30px_rgba(245,158,11,0.2)] scale-[1.02]'
                    : 'bg-[#0c0c14]/80 border-stone-800 hover:border-stone-700 hover:bg-[#11111a]/60 opacity-80 hover:opacity-100'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-100 font-bold shadow-md border border-stone-700"
                      style={{ backgroundColor: cls.avatarColor }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {cls.weaponType}
                    </span>
                  </div>

                  <h3 className="text-lg font-serif font-bold text-stone-100 mb-0.5 tracking-wide">{cls.name}</h3>
                  <div className="text-xs font-semibold text-stone-500 mb-3">{cls.title}</div>
                  <p className="text-xs text-stone-300 leading-relaxed mb-4">{cls.description}</p>
                </div>

                {/* Base Stat Bars */}
                <div className="flex flex-col gap-2 pt-3 border-t border-stone-800 text-[11px] font-mono text-stone-400">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">VITALITY / HP:</span>
                    <span className="text-red-400 font-bold">{cls.baseHp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">ESSENCE / MANA:</span>
                    <span className="text-cyan-400 font-bold">{cls.baseMana}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">BASE ATTACK:</span>
                    <span className="text-amber-400 font-bold">{cls.baseAttackDamage}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">AGILITY SPEED:</span>
                    <span className="text-emerald-400 font-bold">{cls.baseSpeed.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Hero Ability Showcase */}
        <div className="w-full bg-[#0c0c14]/95 border border-stone-800 rounded-xl sm:rounded-2xl p-4 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Special Class Abilities
            </span>
            <div className="flex flex-wrap gap-2 text-xs font-mono text-stone-300 mt-1">
              <div className="bg-[#11111a] px-3 py-1 rounded-lg border border-stone-800">
                <strong className="text-cyan-400">Skill 1 [W]:</strong> {currentClass.skill1.name}
              </div>
              <div className="bg-[#11111a] px-3 py-1 rounded-lg border border-stone-800">
                <strong className="text-purple-400">Skill 2 [F]:</strong> {currentClass.skill2.name}
              </div>
              <div className="bg-[#11111a] px-3 py-1 rounded-lg border border-stone-800">
                <strong className="text-amber-400">Ultimate [R]:</strong> {currentClass.ultimate.name}
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <button
            id="btn-embark-dungeon"
            onClick={() => onStartGame(selectedClass)}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-black rounded-xl border border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 transition active:scale-95 text-sm uppercase tracking-wider cursor-pointer"
          >
            <Play className="w-4 h-4 fill-stone-950" />
            <span>Enter the Labyrinth</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Controls Scheme Reference Banner */}
        <div className="w-full bg-[#0c0c14]/80 border border-stone-800/80 rounded-xl p-3 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-stone-400">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-[#1a1a24] border border-amber-500/50 text-amber-400 rounded font-bold text-[11px]">↑ ↓ ← →</span>
            <span>Move</span>
          </div>
          <span className="text-stone-700">•</span>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-[#1a1a24] border border-amber-500/50 text-amber-400 rounded font-bold text-[11px]">SPACE</span>
            <span>Attack</span>
          </div>
          <span className="text-stone-700">•</span>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-[#1a1a24] border border-emerald-500/50 text-emerald-400 rounded font-bold text-[11px]">D</span>
            <span>Dodge</span>
          </div>
          <span className="text-stone-700">•</span>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-[#1a1a24] border border-cyan-500/50 text-cyan-400 rounded font-bold text-[11px]">S</span>
            <span>Shield Guard</span>
          </div>
          <span className="text-stone-700">•</span>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-[#1a1a24] border border-stone-700 text-stone-300 rounded font-bold text-[11px]">1 / 2</span>
            <span>Potions</span>
          </div>
          <span className="text-stone-700">•</span>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-[#1a1a24] border border-stone-700 text-stone-300 rounded font-bold text-[11px]">TAB / I</span>
            <span>Inventory</span>
          </div>
        </div>
      </div>
    </div>
  );
};

