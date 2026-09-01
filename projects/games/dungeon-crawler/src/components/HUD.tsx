import React from 'react';
import { Player, HeroClassConfig, DungeonFloor } from '../types/game';
import { HERO_CLASSES } from '../game/classes';
import { Sparkles, Volume2, VolumeX, BookOpen, Backpack, Shield, Skull, Swords, Wind } from 'lucide-react';

interface HUDProps {
  player: Player;
  floor: DungeonFloor;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenInventory: () => void;
  onOpenBestiary: () => void;
  onUseHealthPotion: () => void;
  onUseManaPotion: () => void;
  onAttack?: () => void;
  onShield?: () => void;
  onDash?: () => void;
  onSkill1?: () => void;
  onSkill2?: () => void;
  onUltimate?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  floor,
  isMuted,
  onToggleMute,
  onOpenInventory,
  onOpenBestiary,
  onUseHealthPotion,
  onUseManaPotion,
  onAttack,
  onShield,
  onDash,
  onSkill1,
  onSkill2,
  onUltimate,
}) => {
  const heroClass: HeroClassConfig = HERO_CLASSES[player.classType];
  const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const manaPct = Math.max(0, Math.min(100, (player.mana / player.maxMana) * 100));
  const staminaPct = Math.max(0, Math.min(100, (player.stamina / player.maxStamina) * 100));
  const expPct = Math.max(0, Math.min(100, (player.exp / player.expToNextLevel) * 100));

  // Find if there is an active boss in the room
  const activeBoss = floor.creatures.find(c => c.tier === 'boss' && c.hp > 0);

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none text-stone-300 font-sans">
      {/* Top Header Bar */}
      <header className="w-full bg-[#0c0c14]/95 backdrop-blur-md border border-stone-800 shadow-[0_4px_30px_rgba(0,0,0,0.8)] rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3 pr-12 sm:pr-14 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        {/* Left: Location & Hero Info */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-500/70 font-bold">Dungeon Location</span>
            <span className="text-sm sm:text-base font-serif text-stone-100 tracking-wide italic">
              {floor.name} — Depth {floor.floorNumber}
            </span>
          </div>

          <div className="hidden sm:block h-7 w-[1px] bg-stone-800"></div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-stone-500">Hero Level</span>
              <span className="text-amber-200 font-mono text-xs sm:text-sm font-bold">LVL {player.level}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-stone-500">Class</span>
              <span className="text-stone-300 font-serif text-xs font-semibold">{heroClass.name}</span>
            </div>
          </div>
        </div>

        {/* Center: Boss Alert (if present) */}
        {activeBoss && (
          <div className="hidden lg:flex items-center gap-3 bg-[#11111a] border border-red-900/60 px-4 py-1.5 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.25)]">
            <Skull className="w-4 h-4 text-red-500 animate-pulse" />
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-4 text-[10px] font-mono">
                <span className="font-serif italic text-red-400 font-bold">{activeBoss.name}</span>
                <span className="text-red-500 font-bold">
                  {Math.round((activeBoss.hp / activeBoss.maxHp) * 100)}%
                </span>
              </div>
              <div className="w-36 h-1.5 bg-stone-950 border border-stone-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-900 to-red-600 transition-all"
                  style={{ width: `${(activeBoss.hp / activeBoss.maxHp) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Right: Vitals Gauges & Menu Controls */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Gauges Cluster */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Vitality (HP) */}
            <div className="w-28 sm:w-36">
              <div className="flex justify-between text-[9px] sm:text-[10px] uppercase mb-1 font-bold tracking-tighter">
                <span className="text-red-500">Vitality</span>
                <span className="text-stone-100 font-mono">{player.hp} / {player.maxHp}</span>
              </div>
              <div className="h-2 bg-stone-900 border border-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-900 to-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)] transition-all duration-150"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            {/* Essence (Mana) */}
            <div className="w-24 sm:w-32">
              <div className="flex justify-between text-[9px] sm:text-[10px] uppercase mb-1 font-bold tracking-tighter">
                <span className="text-cyan-500">Essence</span>
                <span className="text-stone-100 font-mono">{player.mana} / {player.maxMana}</span>
              </div>
              <div className="h-2 bg-stone-900 border border-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-900 to-cyan-600 shadow-[0_0_8px_rgba(8,145,178,0.5)] transition-all duration-150"
                  style={{ width: `${manaPct}%` }}
                />
              </div>
            </div>

            {/* Stamina */}
            <div className="hidden lg:block w-20 sm:w-28">
              <div className="flex justify-between text-[9px] sm:text-[10px] uppercase mb-1 font-bold tracking-tighter">
                <span className="text-emerald-500">Stamina</span>
                <span className="text-stone-100 font-mono">{Math.round(player.stamina)} / {player.maxStamina}</span>
              </div>
              <div className="h-2 bg-stone-900 border border-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-900 to-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-150"
                  style={{ width: `${staminaPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="hidden md:block h-7 w-[1px] bg-stone-800"></div>

          {/* Resources & Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-3 bg-[#08080c] border border-stone-800 rounded-lg px-2.5 py-1 text-xs font-mono">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="text-[10px] text-amber-500/70 uppercase">GOLD</span> {player.gold}
              </span>
              <span className="text-purple-400 font-bold flex items-center gap-1">
                <span className="text-[10px] text-purple-500/70 uppercase">SHARDS</span> {player.soulShards}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#08080c] border border-stone-800 rounded-lg p-1">
              <button
                id="btn-hud-inventory"
                onClick={onOpenInventory}
                title="Inventory (Tab / I)"
                className={`p-1.5 rounded border transition flex items-center gap-1.5 text-[11px] font-bold ${
                  player.inventory.length >= 16
                    ? 'bg-red-950/60 border-red-500 text-red-300 animate-pulse'
                    : 'bg-[#1a1a24] border-stone-700 hover:border-amber-500 text-stone-300 hover:text-amber-400'
                }`}
              >
                <Backpack className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-[10px]">
                  Bag ({player.inventory.length}/16)
                </span>
              </button>
              <button
                id="btn-hud-bestiary"
                onClick={onOpenBestiary}
                title="Mythical Bestiary (B)"
                className="p-1.5 rounded bg-[#1a1a24] border border-stone-700 hover:border-amber-500 text-stone-300 hover:text-cyan-400 transition flex items-center gap-1 text-[11px] font-bold"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xl:inline">Codex</span>
              </button>
              <button
                id="btn-hud-mute"
                onClick={onToggleMute}
                title="Toggle Audio (M)"
                className="p-1.5 rounded bg-[#1a1a24] border border-stone-700 hover:border-amber-500 text-stone-400 hover:text-white transition"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Action / Skill Hotbar styled to the Immersive UI theme */}
      <footer className="w-full max-w-2xl mx-auto flex flex-col items-center gap-1.5 pointer-events-auto">
        {/* Controls Quick Reference Pill */}
        <div className="flex items-center gap-2 sm:gap-3 bg-[#0c0c14]/90 backdrop-blur-sm border border-stone-800 rounded-full px-3 py-1 text-[10px] font-mono text-stone-400 shadow-md">
          <span className="flex items-center gap-1">
            <span className="text-amber-400 font-bold bg-[#1a1a24] px-1 rounded border border-stone-700">↑↓←→</span> Move
          </span>
          <span className="text-stone-700">•</span>
          <span className="flex items-center gap-1">
            <span className="text-amber-400 font-bold bg-[#1a1a24] px-1 rounded border border-stone-700">SPACE</span> Attack
          </span>
          <span className="text-stone-700">•</span>
          <span className="flex items-center gap-1">
            <span className="text-emerald-400 font-bold bg-[#1a1a24] px-1 rounded border border-stone-700">D</span> Dodge
          </span>
          <span className="text-stone-700">•</span>
          <span className="flex items-center gap-1">
            <span className="text-cyan-400 font-bold bg-[#1a1a24] px-1 rounded border border-stone-700">S</span> Shield
          </span>
        </div>

        {/* EXP Bar */}
        <div className="w-full bg-stone-950 border border-stone-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-700 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-200"
            style={{ width: `${expPct}%` }}
          />
        </div>

        {/* Action Hotbar Container */}
        <div className="bg-[#0c0c14]/95 backdrop-blur-md border border-stone-800 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.9)] flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Quick Potions */}
          <div className="flex gap-1.5 sm:gap-2 pr-2 sm:pr-2.5 border-r border-stone-800">
            {/* Health Potion */}
            <button
              id="btn-potion-hp"
              onClick={onUseHealthPotion}
              className="w-11 h-11 sm:w-13 sm:h-13 bg-[#1a1a24] border border-stone-700 hover:border-amber-500 flex flex-col items-center justify-center relative group transition-colors rounded-lg cursor-pointer"
            >
              <span className="text-[9px] text-stone-500 group-hover:text-amber-500 font-mono absolute top-0.5 left-1">1 / Q</span>
              <div className="w-4 h-4 bg-red-600/20 rounded-full border border-red-600/40 flex items-center justify-center mt-1">
                <span className="text-[9px] font-mono font-bold text-red-400">{player.quickPotions.health}</span>
              </div>
              <span className="text-[8px] uppercase tracking-tighter font-bold text-stone-400">HP Pot</span>
            </button>

            {/* Mana Potion */}
            <button
              id="btn-potion-mana"
              onClick={onUseManaPotion}
              className="w-11 h-11 sm:w-13 sm:h-13 bg-[#1a1a24] border border-stone-700 hover:border-amber-500 flex flex-col items-center justify-center relative group transition-colors rounded-lg cursor-pointer"
            >
              <span className="text-[9px] text-stone-500 group-hover:text-amber-500 font-mono absolute top-0.5 left-1">2 / E</span>
              <div className="w-4 h-4 bg-cyan-600/20 rounded-full border border-cyan-600/40 flex items-center justify-center mt-1">
                <span className="text-[9px] font-mono font-bold text-cyan-400">{player.quickPotions.mana}</span>
              </div>
              <span className="text-[8px] uppercase tracking-tighter font-bold text-stone-400">MP Pot</span>
            </button>
          </div>

          {/* Combat Actions Cluster */}
          <div className="flex gap-1.5 sm:gap-2">
            {/* Primary Attack - SPACE BAR */}
            <button
              id="btn-action-attack"
              onClick={onAttack}
              className="w-13 h-13 sm:w-15 sm:h-15 bg-stone-900 border border-amber-500/80 hover:border-amber-400 flex flex-col items-center justify-center gap-0.5 group transition-all relative rounded-lg cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)] active:scale-95"
            >
              <span className="text-[9px] text-amber-400 font-mono absolute top-0.5 left-1 font-bold">[SPACE]</span>
              <Swords className="w-4 h-4 text-amber-300 mt-2" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-100">Attack</span>
            </button>

            {/* Shield Block - S KEY */}
            <button
              id="btn-action-shield"
              onClick={onShield}
              className={`w-13 h-13 sm:w-15 sm:h-15 border flex flex-col items-center justify-center gap-0.5 group transition-all relative rounded-lg cursor-pointer active:scale-95 ${
                player.isShielding
                  ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.5)] scale-105'
                  : 'bg-stone-900 border-cyan-600/70 hover:border-cyan-400 text-stone-300'
              }`}
            >
              <span className="text-[9px] text-cyan-400 font-mono absolute top-0.5 left-1 font-bold">[S]</span>
              <Shield className={`w-4 h-4 mt-2 ${player.isShielding ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-100">
                {player.isShielding ? 'GUARD' : 'Shield'}
              </span>
            </button>

            {/* Dodge - D KEY */}
            <button
              id="btn-action-dodge"
              onClick={onDash}
              className="w-13 h-13 sm:w-15 sm:h-15 bg-stone-900 border border-emerald-600/70 hover:border-emerald-400 flex flex-col items-center justify-center gap-0.5 group transition-all relative rounded-lg cursor-pointer overflow-hidden active:scale-95"
            >
              <span className="text-[9px] text-emerald-400 font-mono absolute top-0.5 left-1 font-bold">[D]</span>
              {player.dashCooldownTimer > 0 && (
                <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-xs flex items-center justify-center font-mono font-bold text-emerald-300 text-xs">
                  {player.dashCooldownTimer.toFixed(1)}s
                </div>
              )}
              <Wind className="w-4 h-4 text-emerald-400 mt-2" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-300">Dodge</span>
            </button>

            {/* Skill 1 */}
            <button
              id="btn-action-skill1"
              onClick={onSkill1}
              className="w-13 h-13 sm:w-15 sm:h-15 bg-stone-900 border border-stone-700 hover:border-cyan-400 flex flex-col items-center justify-center gap-0.5 group transition-all relative rounded-lg cursor-pointer overflow-hidden active:scale-95"
            >
              <span className="text-[9px] text-stone-400 group-hover:text-cyan-400 font-mono absolute top-0.5 left-1">[W]</span>
              {player.skill1CooldownTimer > 0 && (
                <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-xs flex items-center justify-center font-mono font-bold text-amber-300 text-xs">
                  {player.skill1CooldownTimer.toFixed(1)}s
                </div>
              )}
              <span className="text-[9px] font-bold uppercase tracking-wide text-cyan-300 text-center px-1 mt-2 line-clamp-1">
                {heroClass.skill1.name.split(' ')[0]}
              </span>
            </button>

            {/* Skill 2 */}
            <button
              id="btn-action-skill2"
              onClick={onSkill2}
              className="w-13 h-13 sm:w-15 sm:h-15 bg-stone-900 border border-stone-700 hover:border-purple-400 flex flex-col items-center justify-center gap-0.5 group transition-all relative rounded-lg cursor-pointer overflow-hidden active:scale-95"
            >
              <span className="text-[9px] text-stone-400 group-hover:text-purple-400 font-mono absolute top-0.5 left-1">[F]</span>
              {player.skill2CooldownTimer > 0 && (
                <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-xs flex items-center justify-center font-mono font-bold text-amber-300 text-xs">
                  {player.skill2CooldownTimer.toFixed(1)}s
                </div>
              )}
              <span className="text-[9px] font-bold uppercase tracking-wide text-purple-300 text-center px-1 mt-2 line-clamp-1">
                {heroClass.skill2.name.split(' ')[0]}
              </span>
            </button>

            {/* Ultimate Skill */}
            <button
              id="btn-action-ultimate"
              onClick={onUltimate}
              className="w-13 h-13 sm:w-15 sm:h-15 bg-stone-900 border border-amber-500/80 hover:border-amber-400 flex flex-col items-center justify-center gap-0.5 group transition-all relative rounded-lg cursor-pointer overflow-hidden shadow-[0_0_12px_rgba(245,158,11,0.2)] active:scale-95"
            >
              <span className="text-[9px] text-amber-500 font-mono absolute top-0.5 left-1 font-bold">[R]</span>
              {player.ultimateCooldownTimer > 0 && (
                <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-xs flex items-center justify-center font-mono font-bold text-amber-300 text-xs">
                  {player.ultimateCooldownTimer.toFixed(1)}s
                </div>
              )}
              <Sparkles className="w-3.5 h-3.5 text-amber-300 mt-2" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-200 line-clamp-1">
                {heroClass.ultimate.name.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

