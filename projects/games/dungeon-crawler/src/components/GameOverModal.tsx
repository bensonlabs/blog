import React from 'react';
import { Player, DungeonFloor } from '../types/game';
import { Skull, RotateCcw } from 'lucide-react';

interface GameOverModalProps {
  player: Player;
  floor: DungeonFloor;
  onRestart: () => void;
  onChangeHero?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ player, floor, onRestart, onChangeHero }) => {
  return (
    <div id="modal-gameover-overlay" className="fixed inset-0 z-50 bg-[#050508]/90 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans text-stone-300">
      <div className="bg-[#0c0c14] border-2 border-red-900/80 rounded-xl sm:rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(220,38,38,0.3)] flex flex-col items-center text-center gap-5 animate-in fade-in zoom-in duration-200">
        {/* Skull Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-900/60 flex items-center justify-center text-red-500 shadow-inner">
          <Skull className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-500">Hero Fallen in the Labyrinth</span>
          <h2 className="text-3xl font-serif font-black tracking-wide text-stone-100">MORTAL DEMISE</h2>
          <p className="text-xs text-stone-400 mt-1">
            Your mortal form succumbed to the ancient horrors of Tartarus.
          </p>
        </div>

        {/* Run Statistics */}
        <div className="w-full bg-[#08080c] p-4 rounded-xl border border-stone-800 grid grid-cols-2 gap-3 text-left text-xs font-mono">
          <div className="flex flex-col">
            <span className="text-stone-500 text-[10px] uppercase font-bold">Deepest Floor</span>
            <span className="text-base font-bold text-amber-400">Depth {floor.floorNumber}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-stone-500 text-[10px] uppercase font-bold">Monsters Slain</span>
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
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            id="btn-restart-game"
            onClick={onRestart}
            className="w-full py-3.5 bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-stone-100 font-bold rounded-xl border border-red-600/70 shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center justify-center gap-2 transition active:scale-95 text-xs uppercase tracking-wider cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Embark on a New Journey</span>
          </button>

          {onChangeHero && (
            <button
              id="btn-change-hero"
              onClick={onChangeHero}
              className="w-full py-2.5 bg-[#11111a] hover:bg-[#181824] text-stone-400 hover:text-stone-200 font-semibold rounded-xl border border-stone-800 hover:border-stone-700 flex items-center justify-center gap-2 transition active:scale-95 text-xs uppercase tracking-wider cursor-pointer"
            >
              <span>Choose Different Hero</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

