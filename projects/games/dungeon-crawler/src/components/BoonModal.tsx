import React from 'react';
import { DivineBoon } from '../types/game';
import { Sparkles, Zap, Shield, Waves, Wind, Sun, Skull, Target, Sword } from 'lucide-react';

interface BoonModalProps {
  boons: DivineBoon[];
  isOpen: boolean;
  onSelectBoon: (boon: DivineBoon) => void;
}

export const BoonModal: React.FC<BoonModalProps> = ({ boons, isOpen, onSelectBoon }) => {
  if (!isOpen || boons.length === 0) return null;

  const getGodIcon = (god: string) => {
    switch (god) {
      case 'Zeus': return Zap;
      case 'Ares': return Sword;
      case 'Athena': return Shield;
      case 'Poseidon': return Waves;
      case 'Hermes': return Wind;
      case 'Apollo': return Sun;
      case 'Hades': return Skull;
      case 'Artemis': return Target;
      default: return Sparkles;
    }
  };

  return (
    <div id="modal-boon-overlay" className="fixed inset-0 z-50 bg-[#050508]/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans text-stone-300">
      <div className="bg-[#0c0c14] border-2 border-amber-500/80 rounded-xl sm:rounded-2xl max-w-2xl w-full p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-1.5 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2 text-amber-500 text-[10px] font-bold uppercase tracking-[0.25em] bg-[#11111a] px-3.5 py-1 rounded-full border border-stone-800">
            <Sparkles className="w-3.5 h-3.5" />
            Altar of Mount Olympus
          </div>
          <h2 className="text-2xl font-serif font-black text-stone-100 tracking-wide">Divine Favor Bestowed</h2>
          <p className="text-xs text-stone-400 max-w-md">
            The Olympian deities gaze down upon your valor. Select a mythical blessing to empower your hero:
          </p>
        </div>

        {/* Boon Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {boons.map(boon => {
            const Icon = getGodIcon(boon.god);
            const rarityColor = boon.rarity === 'mythic' ? 'border-amber-400 text-amber-300' : boon.rarity === 'epic' ? 'border-purple-400 text-purple-300' : 'border-cyan-400 text-cyan-300';

            return (
              <div
                key={boon.id}
                id={`boon-card-${boon.id}`}
                onClick={() => onSelectBoon(boon)}
                className="group cursor-pointer bg-[#08080c] hover:bg-[#11111a] border border-stone-800 hover:border-amber-500 rounded-xl p-4 flex flex-col justify-between gap-3 transition-all duration-150 active:scale-95 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#11111a] border ${rarityColor}`}>
                      {boon.god}
                    </span>
                  </div>

                  <h3 className="text-sm font-serif font-bold text-stone-100 group-hover:text-amber-300 transition mb-1 tracking-wide">
                    {boon.name}
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed">{boon.description}</p>
                </div>

                <button className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 group-hover:from-amber-500 group-hover:to-amber-600 text-stone-950 font-bold rounded-lg text-xs uppercase tracking-wider transition border border-amber-400 shadow">
                  Accept Boon
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

