import React, { useState } from 'react';
import { Player, Item, ItemType, MAX_INVENTORY_CAPACITY, MAX_RELIC_SLOTS } from '../types/game';
import {
  X,
  Shield,
  Sword,
  Sparkles,
  Heart,
  Zap,
  Flame,
  Wind,
  Trash2,
  ArrowDownCircle,
  RotateCcw,
  Layers,
  Info,
} from 'lucide-react';
import { calculateItemSalvageValue } from '../game/items';
import { sound } from '../game/audio';

interface InventoryModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onEquipItem: (item: Item, relicSlotIndex?: number) => void;
  onUnequipItem: (slot: 'weapon' | 'armor' | 'relic', relicIndex?: number) => void;
  onUseItem: (item: Item) => void;
  onDropItem: (item: Item) => void;
  onSalvageItem: (item: Item) => void;
  onSortInventory: () => void;
  onAssignQuickSlot?: (item: Item) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  player,
  isOpen,
  onClose,
  onEquipItem,
  onUnequipItem,
  onUseItem,
  onDropItem,
  onSalvageItem,
  onSortInventory,
  onAssignQuickSlot,
}) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [filterType, setFilterType] = useState<'all' | ItemType>('all');

  if (!isOpen) return null;

  // Calculate Character Derived Stats
  let totalAttack = 10 + player.stats.strength * 2.5;
  if (player.equipment.weapon?.stats?.damage) totalAttack += player.equipment.weapon.stats.damage;
  player.equipment.relics.forEach(r => {
    if (r.stats?.damage) totalAttack += r.stats.damage;
  });

  let totalDefense = player.stats.vitality * 1.5;
  if (player.equipment.armor?.stats?.defense) totalDefense += player.equipment.armor.stats.defense;
  player.equipment.relics.forEach(r => {
    if (r.stats?.defense) totalDefense += r.stats.defense;
  });

  let critChance = 10 + player.stats.dexterity * 1.5;
  if (player.equipment.weapon?.stats?.critChance) critChance += player.equipment.weapon.stats.critChance * 100;
  player.equipment.relics.forEach(r => {
    if (r.stats?.critChance) critChance += r.stats.critChance * 100;
  });

  let lifesteal = 0;
  if (player.equipment.weapon?.stats?.lifesteal) lifesteal += player.equipment.weapon.stats.lifesteal * 100;
  player.equipment.relics.forEach(r => {
    if (r.stats?.lifesteal) lifesteal += r.stats.lifesteal * 100;
  });

  let cooldownReduction = 0;
  if (player.equipment.weapon?.stats?.cooldownReduction) cooldownReduction += player.equipment.weapon.stats.cooldownReduction * 100;
  if (player.equipment.armor?.stats?.cooldownReduction) cooldownReduction += player.equipment.armor.stats.cooldownReduction * 100;
  player.equipment.relics.forEach(r => {
    if (r.stats?.cooldownReduction) cooldownReduction += r.stats.cooldownReduction * 100;
  });

  // Filter items in backpack
  const filteredItems = player.inventory.filter(item => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  // Calculate Capacity Ratio
  const capacityUsed = player.inventory.length;
  const isFull = capacityUsed >= MAX_INVENTORY_CAPACITY;
  const capacityColor = isFull ? 'text-red-400' : capacityUsed >= MAX_INVENTORY_CAPACITY * 0.75 ? 'text-amber-400' : 'text-cyan-400';

  // Rarity color helpers
  const getRarityBadge = (rarity: Item['rarity']) => {
    switch (rarity) {
      case 'mythic':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'epic':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'rare':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      default:
        return 'text-stone-400 bg-stone-500/10 border-stone-700';
    }
  };

  const getRarityBorder = (rarity: Item['rarity'], isSelected: boolean) => {
    if (isSelected) return 'ring-2 ring-amber-400 border-amber-400 bg-[#1e1b2e]';
    switch (rarity) {
      case 'mythic':
        return 'border-amber-500/80 hover:border-amber-400 bg-amber-950/20';
      case 'epic':
        return 'border-purple-500/80 hover:border-purple-400 bg-purple-950/20';
      case 'rare':
        return 'border-cyan-500/70 hover:border-cyan-400 bg-cyan-950/20';
      default:
        return 'border-stone-700/80 hover:border-stone-500 bg-[#11111a]';
    }
  };

  const getItemIcon = (icon: string) => {
    switch (icon) {
      case 'Sword':
      case 'Scissors':
      case 'Axe':
        return <Sword className="w-4 h-4" />;
      case 'Shield':
      case 'ShieldCheck':
      case 'ShieldAlert':
        return <Shield className="w-4 h-4" />;
      case 'Heart':
        return <Heart className="w-4 h-4 text-red-400" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'Flame':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'Wind':
        return <Wind className="w-4 h-4 text-emerald-400" />;
      case 'Sun':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div
      id="modal-inventory-overlay"
      className="fixed inset-0 z-50 bg-[#050508]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none font-sans text-stone-300"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0c0c14] border border-stone-800 rounded-xl sm:rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-[0_10px_50px_rgba(0,0,0,0.95)] flex flex-col gap-4 relative max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif italic text-stone-100 tracking-wide">
                Hero Equipment & Inventory
              </h2>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-stone-500">Backpack Capacity:</span>
                <span className={`font-bold ${capacityColor}`}>
                  {capacityUsed} / {MAX_INVENTORY_CAPACITY} Slots
                </span>
                {isFull && (
                  <span className="text-[10px] text-red-400 font-bold uppercase bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800 animate-pulse">
                    Bag Full
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-sort-inventory"
              onClick={() => {
                sound.playEquip();
                onSortInventory();
              }}
              title="Auto-Sort items by Rarity & Type"
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-[#1a1a24] border border-stone-700 hover:border-amber-500 text-stone-300 hover:text-amber-400 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sort</span>
            </button>
            <button
              id="btn-close-inventory"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto pr-1">
          {/* Left Column: Equipped Gear & Combat Attributes (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3.5">
            {/* Equipped Slots Container */}
            <div className="bg-[#08080c] p-3.5 rounded-xl border border-stone-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-amber-500/80 uppercase tracking-[0.2em]">
                  Equipped Loadout
                </h3>
                <span className="text-[10px] text-stone-500 font-mono">Click gear to unequip</span>
              </div>

              {/* Weapon Slot */}
              <div
                onClick={() => {
                  if (player.equipment.weapon) {
                    if (isFull) {
                      sound.playInventoryFull();
                      return;
                    }
                    onUnequipItem('weapon');
                  }
                }}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition cursor-pointer ${
                  player.equipment.weapon
                    ? getRarityBorder(player.equipment.weapon.rarity, false)
                    : 'bg-[#11111a] border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sword className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-100">
                      {player.equipment.weapon ? player.equipment.weapon.name : 'Starter Blade'}
                    </div>
                    <div className="text-[10px] font-mono text-stone-400 flex items-center gap-2">
                      <span>+{player.equipment.weapon?.stats?.damage || 8} DMG</span>
                      {player.equipment.weapon?.stats?.critChance && (
                        <span className="text-amber-400">
                          +{Math.round(player.equipment.weapon.stats.critChance * 100)}% Crit
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] uppercase font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Weapon
                  </span>
                  {player.equipment.weapon && (
                    <span className="text-[9px] font-mono text-stone-500 hover:text-red-400">
                      Unequip
                    </span>
                  )}
                </div>
              </div>

              {/* Armor Slot */}
              <div
                onClick={() => {
                  if (player.equipment.armor) {
                    if (isFull) {
                      sound.playInventoryFull();
                      return;
                    }
                    onUnequipItem('armor');
                  }
                }}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition cursor-pointer ${
                  player.equipment.armor
                    ? getRarityBorder(player.equipment.armor.rarity, false)
                    : 'bg-[#11111a] border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-100">
                      {player.equipment.armor ? player.equipment.armor.name : 'Boiled Leather'}
                    </div>
                    <div className="text-[10px] font-mono text-stone-400 flex items-center gap-2">
                      <span>+{player.equipment.armor?.stats?.defense || 4} DEF</span>
                      {player.equipment.armor?.stats?.maxHp && (
                        <span className="text-emerald-400">+{player.equipment.armor.stats.maxHp} HP</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] uppercase font-mono font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                    Armor
                  </span>
                  {player.equipment.armor && (
                    <span className="text-[9px] font-mono text-stone-500 hover:text-red-400">
                      Unequip
                    </span>
                  )}
                </div>
              </div>

              {/* Relic Slots (3 discrete slots) */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                  <span>Mythical Relics ({player.equipment.relics.length}/{MAX_RELIC_SLOTS})</span>
                  <span className="text-[8px] font-mono text-stone-500">Max 3 Relics</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: MAX_RELIC_SLOTS }).map((_, rIdx) => {
                    const relic = player.equipment.relics[rIdx];
                    return (
                      <div
                        key={rIdx}
                        onClick={() => {
                          if (relic) {
                            if (isFull) {
                              sound.playInventoryFull();
                              return;
                            }
                            onUnequipItem('relic', rIdx);
                          }
                        }}
                        title={relic ? `${relic.name}\n${relic.description}\n(Click to unequip)` : 'Empty Relic Slot'}
                        className={`h-16 rounded-lg border p-1.5 flex flex-col justify-between transition cursor-pointer relative group ${
                          relic
                            ? getRarityBorder(relic.rarity, false)
                            : 'bg-[#11111a]/40 border-dashed border-stone-800 hover:border-stone-700 flex items-center justify-center'
                        }`}
                      >
                        {relic ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-mono text-amber-400">R{rIdx + 1}</span>
                              <span className="text-[7px] uppercase font-mono px-1 py-0.2 rounded bg-stone-900 text-stone-400">
                                {relic.rarity.slice(0, 3)}
                              </span>
                            </div>
                            <div className="text-[10px] font-bold text-stone-100 truncate w-full leading-tight">
                              {relic.name.split(' ')[0]}
                            </div>
                            <span className="text-[8px] font-mono text-stone-500 group-hover:text-red-400">
                              Unequip
                            </span>
                          </>
                        ) : (
                          <div className="text-[9px] font-mono text-stone-600 text-center">
                            Relic {rIdx + 1}
                            <div className="text-[8px] text-stone-700">Empty</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Total Hero Combat Stats Breakdown */}
            <div className="bg-[#08080c] p-3.5 rounded-xl border border-stone-800 flex flex-col gap-2">
              <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em]">
                Total Hero Attributes
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex items-center justify-between p-1.5 bg-[#11111a] rounded border border-stone-800/80">
                  <span className="text-stone-400">Total Attack:</span>
                  <span className="font-bold text-amber-400">{Math.round(totalAttack)}</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#11111a] rounded border border-stone-800/80">
                  <span className="text-stone-400">Total Defense:</span>
                  <span className="font-bold text-cyan-400">{Math.round(totalDefense)}</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#11111a] rounded border border-stone-800/80">
                  <span className="text-stone-400">Critical Rate:</span>
                  <span className="font-bold text-yellow-300">{Math.round(critChance)}%</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#11111a] rounded border border-stone-800/80">
                  <span className="text-stone-400">Lifesteal:</span>
                  <span className="font-bold text-emerald-400">{Math.round(lifesteal)}%</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#11111a] rounded border border-stone-800/80">
                  <span className="text-stone-400">Cooldown Rec.:</span>
                  <span className="font-bold text-purple-400">{Math.round(cooldownReduction)}%</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#11111a] rounded border border-stone-800/80">
                  <span className="text-stone-400">Monsters Slain:</span>
                  <span className="font-bold text-red-400">{player.totalKills}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Backpack Grid, Filter Tabs & Inspector (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1">
              <div className="flex gap-1 overflow-x-auto">
                {(['all', 'weapon', 'armor', 'relic', 'potion'] as const).map(tab => {
                  const count =
                    tab === 'all'
                      ? player.inventory.length
                      : player.inventory.filter(i => i.type === tab).length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setFilterType(tab)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase font-bold transition flex items-center gap-1 ${
                        filterType === tab
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-[#11111a] text-stone-400 hover:text-white border border-stone-800'
                      }`}
                    >
                      <span>{tab}</span>
                      <span className="text-[10px] opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] font-mono text-stone-500">
                Limit: {MAX_INVENTORY_CAPACITY}
              </span>
            </div>

            {/* 4x4 Backpack Item Grid (16 slots) */}
            <div className="grid grid-cols-4 gap-2 bg-[#08080c] p-3 rounded-xl border border-stone-800 min-h-[220px]">
              {filteredItems.map(item => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      sound.playEquip();
                      setSelectedItem(item);
                    }}
                    className={`h-16 rounded-lg border p-1.5 flex flex-col justify-between text-left transition relative active:scale-95 group ${getRarityBorder(
                      item.rarity,
                      isSelected
                    )}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] text-stone-400">{getItemIcon(item.icon)}</span>
                      <span
                        className={`text-[8px] font-mono font-bold uppercase px-1 py-0.2 rounded border ${getRarityBadge(
                          item.rarity
                        )}`}
                      >
                        {item.rarity.slice(0, 3)}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-stone-100 truncate w-full leading-tight">
                      {item.name}
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-stone-400">
                      <span className="capitalize">{item.type}</span>
                      <span>{item.value}g</span>
                    </div>
                  </button>
                );
              })}

              {/* Render Empty Capacity Slots */}
              {Array.from({
                length: Math.max(0, MAX_INVENTORY_CAPACITY - filteredItems.length),
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="h-16 rounded-lg border border-dashed border-stone-800/80 bg-[#08080c]/40 flex flex-col items-center justify-center text-stone-700 text-[10px] font-mono"
                >
                  <span>Slot {filteredItems.length + i + 1}</span>
                  <span className="text-[8px] text-stone-800">Empty</span>
                </div>
              ))}
            </div>

            {/* Selected Item Inspector & Action Controls */}
            {selectedItem ? (
              <div className="bg-[#08080c] p-4 rounded-xl border border-stone-800 flex flex-col gap-2.5">
                {/* Item Top Title & Rarity Badge */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#11111a] border border-stone-700">
                      {getItemIcon(selectedItem.icon)}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-stone-100 text-sm tracking-wide">
                        {selectedItem.name}
                      </h4>
                      <span className="text-[10px] font-mono text-stone-400 capitalize">
                        {selectedItem.type} • Value: {selectedItem.value} Gold
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded border ${getRarityBadge(
                      selectedItem.rarity
                    )}`}
                  >
                    {selectedItem.rarity}
                  </span>
                </div>

                {/* Description & Lore */}
                <p className="text-xs text-stone-300 leading-relaxed">{selectedItem.description}</p>
                {selectedItem.lore && (
                  <p className="text-[11px] font-serif text-amber-300/80 italic border-l-2 border-amber-500/40 pl-2.5 py-0.5">
                    "{selectedItem.lore}"
                  </p>
                )}

                {/* Stats & Comparison Delta Block */}
                <div className="bg-[#11111a] p-2.5 rounded-lg border border-stone-800 flex flex-col gap-1 text-xs font-mono">
                  {selectedItem.type === 'weapon' && (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Weapon Damage:</span>
                      <span className="font-bold text-amber-400">
                        +{selectedItem.stats?.damage || 0} DMG
                        {player.equipment.weapon && (
                          <span className="text-[10px] ml-1.5 font-normal text-stone-400">
                            (
                            {(selectedItem.stats?.damage || 0) -
                              (player.equipment.weapon.stats?.damage || 8) >=
                            0
                              ? `+${
                                  (selectedItem.stats?.damage || 0) -
                                  (player.equipment.weapon.stats?.damage || 8)
                                }`
                              : `${
                                  (selectedItem.stats?.damage || 0) -
                                  (player.equipment.weapon.stats?.damage || 8)
                                }`}{' '}
                            vs equipped)
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {selectedItem.type === 'armor' && (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Armor Defense:</span>
                      <span className="font-bold text-cyan-400">
                        +{selectedItem.stats?.defense || 0} DEF
                        {player.equipment.armor && (
                          <span className="text-[10px] ml-1.5 font-normal text-stone-400">
                            (
                            {(selectedItem.stats?.defense || 0) -
                              (player.equipment.armor.stats?.defense || 4) >=
                            0
                              ? `+${
                                  (selectedItem.stats?.defense || 0) -
                                  (player.equipment.armor.stats?.defense || 4)
                                }`
                              : `${
                                  (selectedItem.stats?.defense || 0) -
                                  (player.equipment.armor.stats?.defense || 4)
                                }`}{' '}
                            vs equipped)
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {selectedItem.stats?.maxHp && (
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Max Vitality:</span>
                      <span className="font-bold">+{selectedItem.stats.maxHp} HP</span>
                    </div>
                  )}
                  {selectedItem.stats?.maxMana && (
                    <div className="flex items-center justify-between text-cyan-400">
                      <span>Max Essence:</span>
                      <span className="font-bold">+{selectedItem.stats.maxMana} MP</span>
                    </div>
                  )}
                  {selectedItem.stats?.critChance && (
                    <div className="flex items-center justify-between text-yellow-300">
                      <span>Critical Strike:</span>
                      <span className="font-bold">
                        +{Math.round(selectedItem.stats.critChance * 100)}%
                      </span>
                    </div>
                  )}
                  {selectedItem.stats?.speed && (
                    <div className="flex items-center justify-between text-emerald-300">
                      <span>Movement Speed:</span>
                      <span className="font-bold">+{Math.round(selectedItem.stats.speed * 100)}%</span>
                    </div>
                  )}
                  {selectedItem.stats?.cooldownReduction && (
                    <div className="flex items-center justify-between text-purple-300">
                      <span>Cooldown Haste:</span>
                      <span className="font-bold">
                        +{Math.round(selectedItem.stats.cooldownReduction * 100)}%
                      </span>
                    </div>
                  )}
                  {selectedItem.stats?.lifesteal && (
                    <div className="flex items-center justify-between text-red-300">
                      <span>Vampiric Lifesteal:</span>
                      <span className="font-bold">
                        +{Math.round(selectedItem.stats.lifesteal * 100)}%
                      </span>
                    </div>
                  )}
                  {selectedItem.effect && (
                    <div className="flex items-center justify-between text-amber-300">
                      <span>Consumable Effect:</span>
                      <span className="font-bold capitalize">
                        {selectedItem.effect.type.replace('_', ' ')} (+{selectedItem.effect.value})
                      </span>
                    </div>
                  )}
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {/* Primary Action Button */}
                  {selectedItem.type === 'weapon' || selectedItem.type === 'armor' ? (
                    <button
                      id="btn-equip-item"
                      onClick={() => {
                        sound.playEquip();
                        onEquipItem(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold rounded-lg text-xs uppercase tracking-wider transition border border-amber-400 flex items-center justify-center gap-1.5"
                    >
                      <Sword className="w-3.5 h-3.5" />
                      <span>Equip {selectedItem.type}</span>
                    </button>
                  ) : selectedItem.type === 'relic' ? (
                    <button
                      id="btn-equip-relic"
                      onClick={() => {
                        sound.playEquip();
                        onEquipItem(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition border border-purple-400 flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Equip Relic Slot</span>
                    </button>
                  ) : (
                    <div className="flex-1 flex gap-2">
                      <button
                        id="btn-use-consumable"
                        onClick={() => {
                          onUseItem(selectedItem);
                          setSelectedItem(null);
                        }}
                        className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-stone-950 font-bold rounded-lg text-xs uppercase tracking-wider transition border border-emerald-400 flex items-center justify-center gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span>Use Consumable</span>
                      </button>

                      {onAssignQuickSlot &&
                        (selectedItem.id.includes('health') || selectedItem.id.includes('mana')) && (
                          <button
                            id="btn-add-quick-slot"
                            onClick={() => {
                              sound.playPotion();
                              onAssignQuickSlot(selectedItem);
                              setSelectedItem(null);
                            }}
                            className="px-3 py-2 bg-[#1a1a24] hover:bg-[#252535] text-stone-200 font-mono text-xs rounded-lg border border-stone-700 transition"
                            title="Add directly to Quick Slot (Q/E)"
                          >
                            + Quick Slot
                          </button>
                        )}
                    </div>
                  )}

                  {/* Drop to Ground Button */}
                  <button
                    id="btn-drop-item"
                    onClick={() => {
                      sound.playDrop();
                      onDropItem(selectedItem);
                      setSelectedItem(null);
                    }}
                    title="Drop item to current dungeon floor tile"
                    className="px-3 py-2 bg-[#1a1a24] hover:bg-stone-800 text-stone-400 hover:text-amber-400 rounded-lg text-xs font-mono border border-stone-700 transition flex items-center gap-1.5"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    <span>Drop</span>
                  </button>

                  {/* Salvage Item for Gold & Shards */}
                  {(() => {
                    const salvage = calculateItemSalvageValue(selectedItem);
                    return (
                      <button
                        id="btn-salvage-item"
                        onClick={() => {
                          sound.playDismantle();
                          onSalvageItem(selectedItem);
                          setSelectedItem(null);
                        }}
                        title={`Dismantle item for ${salvage.gold} Gold + ${salvage.soulShards} Soul Shards`}
                        className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-lg text-xs font-mono border border-red-800/80 transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Salvage (+{salvage.gold}g)</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-500 italic p-4 text-center bg-[#08080c] rounded-xl border border-stone-800 flex items-center justify-center gap-2">
                <Info className="w-4 h-4 text-stone-600" />
                <span>Select an item in your bag to inspect stats, equip, use, drop, or salvage.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
