import React, { useState } from 'react';
import { BestiaryEntry } from '../types/game';
import { X, BookOpen, Skull, ShieldAlert, Award, Search } from 'lucide-react';

interface BestiaryModalProps {
  entries: BestiaryEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({ entries, isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(entries[0]?.id || '');

  if (!isOpen) return null;

  const filteredEntries = entries.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.mythologicalTitle.toLowerCase().includes(search.toLowerCase())
  );

  const currentEntry = entries.find(e => e.id === selectedId) || entries[0];

  return (
    <div id="modal-bestiary-overlay" className="fixed inset-0 z-50 bg-[#050508]/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans text-stone-300">
      <div className="bg-[#0c0c14] border border-stone-800 rounded-xl sm:rounded-2xl max-w-3xl w-full p-5 shadow-[0_10px_40px_rgba(0,0,0,0.9)] flex flex-col gap-4 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-serif italic text-stone-100 tracking-wide">Mythical Codex & Bestiary</h2>
          </div>
          <button
            id="btn-close-bestiary"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search mythical creatures and bosses..."
            className="w-full bg-[#08080c] border border-stone-800 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden flex-1">
          {/* Left: Creature List */}
          <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 max-h-[420px]">
            {filteredEntries.map(e => {
              const isSelected = e.id === selectedId;
              const isBoss = e.tier === 'boss';
              const isElite = e.tier === 'elite';

              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#1a1a24] border-amber-500 text-stone-100 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-[#08080c] border-stone-800/80 hover:bg-[#11111a] text-stone-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-serif font-bold tracking-wide">{e.name}</span>
                    <span className="text-[10px] text-stone-500 font-sans">{e.mythologicalTitle}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                      isBoss
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : isElite
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                        : 'bg-[#11111a] border-stone-700 text-stone-400'
                    }`}
                  >
                    {e.tier}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Creature Detailed Dossier */}
          {currentEntry && (
            <div className="md:col-span-2 bg-[#08080c] p-4 rounded-xl border border-stone-800 flex flex-col justify-between overflow-y-auto max-h-[420px]">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-stone-100 tracking-wide">{currentEntry.name}</h3>
                    <div className="text-xs font-semibold text-amber-400">{currentEntry.mythologicalTitle}</div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#11111a] border border-stone-800 px-3 py-1 rounded-lg text-xs font-mono font-bold">
                    <Skull className="w-3.5 h-3.5 text-rose-400" />
                    <span>Slain: {currentEntry.kills}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-amber-500/80 uppercase tracking-[0.2em] mb-1">
                    Ancient Myth & Lore
                  </h4>
                  <p className="text-xs text-stone-300 leading-relaxed bg-[#11111a] p-3 rounded-lg border border-stone-800">
                    {currentEntry.lore}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                    Combat Vulnerability / Tactical Weakness
                  </h4>
                  <div className="text-xs text-cyan-200/90 font-medium bg-cyan-950/20 border border-cyan-800/40 p-2.5 rounded-lg">
                    {currentEntry.weakness}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-[11px] font-mono text-stone-500">
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Recorded in the Archives of Olympus
                </span>
                <span className="font-bold text-stone-300 capitalize">Tier: {currentEntry.tier}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

