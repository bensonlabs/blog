import { Item, DivineBoon, Player, ItemRarity, ItemType } from '../types/game';

export const ALL_ITEMS: Item[] = [
  // ==========================================
  // --- WEAPONS ---
  // ==========================================
  {
    id: 'wep_bronze_xiphos',
    name: 'Bronze Xiphos',
    description: 'A standard shortsword forged in the Spartan armory. Reliable and swift.',
    type: 'weapon',
    rarity: 'common',
    icon: 'Sword',
    value: 25,
    stats: { damage: 8, critChance: 0.05 },
  },
  {
    id: 'wep_spartan_spatha',
    name: 'Spartan War Spatha',
    description: 'A balanced broad blade tempered in oil. Delivers heavy cleaving blows.',
    type: 'weapon',
    rarity: 'rare',
    icon: 'Sword',
    value: 65,
    stats: { damage: 16, critChance: 0.1, maxHp: 15 },
  },
  {
    id: 'wep_hephaestus_blade',
    name: 'Blade of Hephaestus',
    description: 'Imbued with the volcanic embers of Mount Etna. Blasts enemies with fiery heat.',
    lore: 'Forged in the deepest molten chamber of the God of the Forge.',
    type: 'weapon',
    rarity: 'epic',
    icon: 'Flame',
    value: 140,
    stats: { damage: 28, critChance: 0.18, maxHp: 35, lifesteal: 0.05 },
  },
  {
    id: 'wep_blade_of_olympus',
    name: 'Blade of Olympus',
    description: 'The legendary greatsword that ended the Great Titan War. Radiates divine golden lightning.',
    lore: 'Wielded by Zeus himself to banish the Titans to the depths of Tartarus.',
    type: 'weapon',
    rarity: 'mythic',
    icon: 'Zap',
    value: 380,
    stats: { damage: 52, critChance: 0.28, lifesteal: 0.15, maxHp: 75, cooldownReduction: 0.1 },
  },
  {
    id: 'wep_perseus_harpe',
    name: 'Harpe of Perseus',
    description: 'Sickle-curved adamantine sword used to sever the head of Medusa.',
    lore: 'Gifted by Hermes with an edge sharp enough to cleave immortal stone.',
    type: 'weapon',
    rarity: 'epic',
    icon: 'Scissors',
    value: 155,
    stats: { damage: 32, critChance: 0.22, speed: 0.3 },
  },
  {
    id: 'wep_labrys_knossos',
    name: 'Labrys of Knossos',
    description: 'Double-bitted sacred battleaxe taken from the heart of the Minotaur\'s labyrinth.',
    type: 'weapon',
    rarity: 'epic',
    icon: 'Axe',
    value: 150,
    stats: { damage: 38, critChance: 0.12, maxHp: 50 },
  },
  {
    id: 'wep_apprentice_staff',
    name: 'Yew Wand of Eleusis',
    description: 'Channels concentrated pulses of arcane energy.',
    type: 'weapon',
    rarity: 'common',
    icon: 'Wand',
    value: 25,
    stats: { damage: 10, maxMana: 25 },
  },
  {
    id: 'wep_caduceus_hermes',
    name: 'Caduceus of the Herald',
    description: 'Twin intertwined serpents amplify spell velocity and reduce casting cooldowns.',
    type: 'weapon',
    rarity: 'rare',
    icon: 'Sparkle',
    value: 70,
    stats: { damage: 18, maxMana: 45, cooldownReduction: 0.1, speed: 0.2 },
  },
  {
    id: 'wep_hecate_stave',
    name: 'Stave of the Triple Goddess',
    description: 'Deep stygian crystal that harnesses lunar tides and arcane devastation.',
    lore: 'Carved with moon runes under the light of a Stygian eclipse.',
    type: 'weapon',
    rarity: 'epic',
    icon: 'Moon',
    value: 160,
    stats: { damage: 34, maxMana: 80, cooldownReduction: 0.2 },
  },
  {
    id: 'wep_trident_oceanus',
    name: 'Trident of Oceanus',
    description: 'Summons tidal surges with every primary strike, drowning mythical beasts.',
    lore: 'Forged by the elder Cyclopes in the primordial ocean abyss.',
    type: 'weapon',
    rarity: 'mythic',
    icon: 'Waves',
    value: 390,
    stats: { damage: 48, maxMana: 100, lifesteal: 0.12, critChance: 0.2 },
  },
  {
    id: 'wep_hunter_bow',
    name: 'Arcadian Composite Bow',
    description: 'Supple recurve bow fashioned from horn and seasoned ash.',
    type: 'weapon',
    rarity: 'common',
    icon: 'Target',
    value: 25,
    stats: { damage: 9, speed: 0.2, critChance: 0.08 },
  },
  {
    id: 'wep_chiron_greatbow',
    name: 'Centaur Greatbow of Chiron',
    description: 'Heavy war bow that pierces armored beast hides with massive force.',
    type: 'weapon',
    rarity: 'rare',
    icon: 'Crosshair',
    value: 75,
    stats: { damage: 20, critChance: 0.16, maxHp: 20 },
  },
  {
    id: 'wep_artemis_longbow',
    name: 'Golden Bow of Artemis',
    description: 'Never misses its mark. Arrows pierce through multiple mythical creatures effortlessly.',
    lore: 'Gifted by the goddess of the hunt to her most devoted woodland stalker.',
    type: 'weapon',
    rarity: 'epic',
    icon: 'Crosshair',
    value: 165,
    stats: { damage: 30, critChance: 0.24, speed: 0.4 },
  },
  {
    id: 'wep_apollo_sunburst',
    name: 'Sunbeam Bow of Apollo',
    description: 'Shoots blazing bolts of pure solar light that erupt in blinding bursts.',
    lore: 'Infused with the fiery chariot wheels of the sun god.',
    type: 'weapon',
    rarity: 'mythic',
    icon: 'Sun',
    value: 400,
    stats: { damage: 50, critChance: 0.3, speed: 0.5, lifesteal: 0.1 },
  },

  // ==========================================
  // --- ARMOR ---
  // ==========================================
  {
    id: 'arm_leather_cuirass',
    name: 'Reinforced Chiton',
    description: 'Simple boiled leather torso armor providing basic dungeon protection.',
    type: 'armor',
    rarity: 'common',
    icon: 'ShieldAlert',
    value: 20,
    stats: { defense: 5, maxHp: 25 },
  },
  {
    id: 'arm_centaur_tunic',
    name: 'Centaurhide Brigandine',
    description: 'Flexible hide armor granting both agility and blunt impact absorption.',
    type: 'armor',
    rarity: 'rare',
    icon: 'Shield',
    value: 65,
    stats: { defense: 10, maxHp: 50, speed: 0.2 },
  },
  {
    id: 'arm_hoplite_breastplate',
    name: 'Corinthian Bronze Plate',
    description: 'Heavy bronze cuirass embossed with the owl crest of Athena.',
    type: 'armor',
    rarity: 'rare',
    icon: 'Shield',
    value: 70,
    stats: { defense: 14, maxHp: 65 },
  },
  {
    id: 'arm_stygian_robe',
    name: 'Shadow Robes of the Underworld',
    description: 'Woven with dark Stygian mist. Reduces spell cooldowns and shields the wearer.',
    type: 'armor',
    rarity: 'epic',
    icon: 'Sparkles',
    value: 145,
    stats: { defense: 16, maxMana: 70, maxHp: 60, cooldownReduction: 0.15 },
  },
  {
    id: 'arm_gorgonscale_mail',
    name: 'Gorgonscale Cuirass',
    description: 'Crafted from iridescent serpent scales. Stiffens under impact, negating heavy damage.',
    lore: 'Harvested from the deepest stone grottoes beneath the Gorgon lair.',
    type: 'armor',
    rarity: 'epic',
    icon: 'ShieldCheck',
    value: 160,
    stats: { defense: 22, maxHp: 90, critChance: 0.08 },
  },
  {
    id: 'arm_aegis_chestplate',
    name: 'Aegis Cuirass of Athena',
    description: 'Impenetrable breastplate adorned with the Gorgon head visage. Reflects crushing blows.',
    lore: 'The very breastplate worn by Athena when commanding the vanguard of Olympus.',
    type: 'armor',
    rarity: 'mythic',
    icon: 'ShieldCheck',
    value: 360,
    stats: { defense: 30, maxHp: 150, maxMana: 60, cooldownReduction: 0.1 },
  },
  {
    id: 'arm_nemean_lion_hide',
    name: 'Pelt of the Nemean Lion',
    description: 'The golden beast skin completely impervious to mortal weapons and claws.',
    lore: 'Slain by Heracles during his legendary First Labor in the Nemean hills.',
    type: 'armor',
    rarity: 'mythic',
    icon: 'ShieldAlert',
    value: 420,
    stats: { defense: 36, maxHp: 200, damageBuff: 0.15 },
  },

  // ==========================================
  // --- RELICS (EQUIPPABLE ACCESSORIES) ---
  // ==========================================
  {
    id: 'rel_hermes_sandals',
    name: 'Hermes\' Talaria',
    description: 'Winged sandals that grant +35% Movement Speed and reduces Dash cooldown by 25%.',
    lore: 'Crafted by Hephaestus from imperishable gold and wind-silk.',
    type: 'relic',
    rarity: 'epic',
    icon: 'Wind',
    value: 120,
    stats: { speed: 0.8, cooldownReduction: 0.12 },
  },
  {
    id: 'rel_hydra_fang',
    name: 'Toxic Hydra Fang',
    description: 'All attacks inject venom, boosting critical strike chance and dealing bonus damage.',
    type: 'relic',
    rarity: 'rare',
    icon: 'Skull',
    value: 80,
    stats: { critChance: 0.12, damage: 8 },
  },
  {
    id: 'rel_golden_fleece',
    name: 'Golden Fleece of Colchis',
    description: 'Radiates life-giving warmth, providing massive HP, defense, and lifesteal.',
    lore: 'The miraculous fleece sought by Jason and the Argonauts across the uncharted seas.',
    type: 'relic',
    rarity: 'mythic',
    icon: 'Sun',
    value: 300,
    stats: { maxHp: 100, defense: 10, lifesteal: 0.1 },
  },
  {
    id: 'rel_eye_of_medusa',
    name: 'Petrified Gorgon Eye',
    description: 'An ancient preserved eye pulsing with eldritch energy that shields and fortifies mana.',
    type: 'relic',
    rarity: 'epic',
    icon: 'Eye',
    value: 125,
    stats: { defense: 8, maxMana: 50, critChance: 0.06 },
  },
  {
    id: 'rel_charon_obol',
    name: 'Charon\'s Stygian Obol',
    description: 'The ferryman\'s coin. Monsters drop 50% more gold and soul shards on death.',
    type: 'relic',
    rarity: 'rare',
    icon: 'Coins',
    value: 75,
    stats: { speed: 0.3, maxHp: 20 },
  },
  {
    id: 'rel_prometheus_spark',
    name: 'Prometheus\' Sacred Spark',
    description: 'Infuses your strikes with primordial fire, greatly elevating raw offensive power.',
    lore: 'A glowing ember from the original fire stolen from Olympus.',
    type: 'relic',
    rarity: 'epic',
    icon: 'Flame',
    value: 140,
    stats: { damage: 16, maxMana: 35, critChance: 0.08 },
  },
  {
    id: 'rel_daedalus_gear',
    name: 'Daedalus\' Chrono-Mechanism',
    description: 'Intricate brass clockwork that accelerates skill cooldown recovery by 18%.',
    type: 'relic',
    rarity: 'rare',
    icon: 'Clock',
    value: 85,
    stats: { cooldownReduction: 0.18, maxMana: 30 },
  },
  {
    id: 'rel_siren_pearl',
    name: 'Siren\'s Abyssal Pearl',
    description: 'A lustrous ocean pearl that grants massive mana capacity and spell potency.',
    type: 'relic',
    rarity: 'epic',
    icon: 'Droplet',
    value: 130,
    stats: { maxMana: 75, damage: 12, speed: 0.2 },
  },
  {
    id: 'rel_apollo_lyre',
    name: 'Golden Lyre of Apollo',
    description: 'Resonates with celestial harmony, granting maximum critical strike damage and haste.',
    type: 'relic',
    rarity: 'mythic',
    icon: 'Music',
    value: 320,
    stats: { critChance: 0.2, damage: 20, cooldownReduction: 0.15, maxHp: 50 },
  },

  // ==========================================
  // --- CONSUMABLES / POTIONS ---
  // ==========================================
  {
    id: 'pot_ambrosia_health',
    name: 'Nectar of Olympus',
    description: 'Restores 75 Health instantly and clears negative poison / bleed debuffs.',
    type: 'potion',
    rarity: 'common',
    icon: 'Heart',
    value: 20,
    effect: { type: 'heal_hp', value: 75 },
  },
  {
    id: 'pot_greater_health',
    name: 'Greater Ambrosia Flask',
    description: 'A concentrated draught that restores 150 Health instantly.',
    type: 'potion',
    rarity: 'rare',
    icon: 'Heart',
    value: 45,
    effect: { type: 'heal_hp', value: 150 },
  },
  {
    id: 'pot_stygian_mana',
    name: 'Elixir of Hecate',
    description: 'Restores 80 Mana instantly to power your spells and mythical skills.',
    type: 'potion',
    rarity: 'common',
    icon: 'Zap',
    value: 20,
    effect: { type: 'restore_mana', value: 80 },
  },
  {
    id: 'pot_greater_mana',
    name: 'Greater Stygian Elixir',
    description: 'Deep purple extract that restores 160 Mana instantly.',
    type: 'potion',
    rarity: 'rare',
    icon: 'Zap',
    value: 45,
    effect: { type: 'restore_mana', value: 160 },
  },
  {
    id: 'pot_speed_draught',
    name: 'Draught of Hermes',
    description: 'Grants +60% movement speed and agility for 15 seconds.',
    type: 'potion',
    rarity: 'rare',
    icon: 'Wind',
    value: 35,
    effect: { type: 'speed_boost', value: 1.6, duration: 15 },
  },
  {
    id: 'pot_ares_wrath',
    name: 'Philter of Ares',
    description: 'Ignites berserk fury, granting +40% Attack Damage for 15 seconds.',
    type: 'potion',
    rarity: 'epic',
    icon: 'Flame',
    value: 60,
    effect: { type: 'damage_buff', value: 1.4, duration: 15 },
  },
  {
    id: 'pot_aegis_ward',
    name: 'Aegis Ward Draught',
    description: 'Creates a shimmering barrier absorbing up to 75 damage for 20 seconds.',
    type: 'potion',
    rarity: 'epic',
    icon: 'Shield',
    value: 65,
    effect: { type: 'ward_shield', value: 75, duration: 20 },
  },
  {
    id: 'pot_golden_panacea',
    name: 'Panacea of Asclepius',
    description: 'The supreme mythical cure. Instantly restores ALL Health and Mana and cleanses all ailments.',
    type: 'potion',
    rarity: 'mythic',
    icon: 'Sparkles',
    value: 120,
    effect: { type: 'full_restore', value: 999 },
  },
];

export const GOD_BOONS: DivineBoon[] = [
  {
    id: 'boon_zeus_thunder',
    god: 'Zeus',
    name: 'Thunderous Smite',
    description: 'All attacks call down chain lightning, dealing +20 damage to 2 nearby creatures.',
    rarity: 'epic',
    icon: 'Zap',
    apply: (p: Player) => {
      p.stats.arcane += 3;
      p.stats.strength += 2;
    },
  },
  {
    id: 'boon_ares_bloodlust',
    god: 'Ares',
    name: 'Blood of the Colosseum',
    description: '+25% Base Weapon Damage and +10% Lifesteal on all critical hits.',
    rarity: 'epic',
    icon: 'Sword',
    apply: (p: Player) => {
      p.stats.strength += 5;
    },
  },
  {
    id: 'boon_athena_phalanx',
    god: 'Athena',
    name: 'Goddess\'s Aegis Guard',
    description: '+12 Defense and gain a protective shield barrier absorbing up to 50 damage each floor.',
    rarity: 'rare',
    icon: 'ShieldCheck',
    apply: (p: Player) => {
      p.stats.vitality += 4;
      p.maxHp += 30;
      p.hp = Math.min(p.maxHp, p.hp + 30);
    },
  },
  {
    id: 'boon_poseidon_tide',
    god: 'Poseidon',
    name: 'Tidal Surge',
    description: 'Dashing unleashes a tidal wave that pushes back monsters and deals 30 water damage.',
    rarity: 'rare',
    icon: 'Waves',
    apply: (p: Player) => {
      p.stats.vitality += 2;
      p.stats.dexterity += 3;
    },
  },
  {
    id: 'boon_hermes_windstride',
    god: 'Hermes',
    name: 'Windstride Mastery',
    description: '+25% Movement Speed and reduces Dash cooldown by 30%.',
    rarity: 'rare',
    icon: 'Wind',
    apply: (p: Player) => {
      p.stats.dexterity += 5;
    },
  },
  {
    id: 'boon_apollo_sunburst',
    god: 'Apollo',
    name: 'Solar Radiance',
    description: 'Your attacks blind enemies for 2 seconds and have +15% increased Critical Strike chance.',
    rarity: 'epic',
    icon: 'Sun',
    apply: (p: Player) => {
      p.stats.dexterity += 3;
      p.stats.arcane += 3;
    },
  },
  {
    id: 'boon_hades_shadow_grasp',
    god: 'Hades',
    name: 'Stygian Soul Harvest',
    description: 'Defeating mythical creatures restores 6 HP and 5 Mana.',
    rarity: 'epic',
    icon: 'Skull',
    apply: (p: Player) => {
      p.stats.vitality += 3;
      p.stats.arcane += 3;
    },
  },
  {
    id: 'boon_artemis_true_aim',
    god: 'Artemis',
    name: 'Pressure Points',
    description: '+20% Critical Strike Chance and Critical Strikes deal 2.5x damage.',
    rarity: 'mythic',
    icon: 'Target',
    apply: (p: Player) => {
      p.stats.dexterity += 6;
    },
  },
];

/**
 * Calculates gold and soul shard scrap value when salvaging an item.
 */
export function calculateItemSalvageValue(item: Item): { gold: number; soulShards: number } {
  const rarityMultiplier: Record<ItemRarity, { gold: number; shards: number }> = {
    common: { gold: 12, shards: 1 },
    rare: { gold: 35, shards: 3 },
    epic: { gold: 80, shards: 8 },
    mythic: { gold: 200, shards: 20 },
  };

  const mult = rarityMultiplier[item.rarity] || { gold: 10, shards: 1 };
  const gold = Math.max(5, Math.round(item.value * 0.4) + mult.gold);
  const soulShards = mult.shards;

  return { gold, soulShards };
}

/**
 * Sorts inventory items by rarity, type, then name.
 */
export function sortInventoryItems(items: Item[]): Item[] {
  const rarityOrder: Record<ItemRarity, number> = {
    mythic: 4,
    epic: 3,
    rare: 2,
    common: 1,
  };

  const typeOrder: Record<ItemType, number> = {
    weapon: 1,
    armor: 2,
    relic: 3,
    potion: 4,
    gold: 5,
  };

  return [...items].sort((a, b) => {
    const rDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
    if (rDiff !== 0) return rDiff;

    const tDiff = (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
    if (tDiff !== 0) return tDiff;

    return a.name.localeCompare(b.name);
  });
}

/**
 * Generate a random loot drop scaled by dungeon floor depth and optional type filter.
 */
export function getRandomLootItem(floorNumber: number, typeFilter?: ItemType): Item {
  const roll = Math.random();
  let pool = ALL_ITEMS;

  if (typeFilter) {
    pool = pool.filter(i => i.type === typeFilter);
  }

  if (floorNumber >= 5) {
    if (roll < 0.3) {
      const highTier = pool.filter(i => i.rarity === 'mythic' || i.rarity === 'epic');
      if (highTier.length > 0) pool = highTier;
    } else if (roll < 0.75) {
      const midTier = pool.filter(i => i.rarity === 'rare' || i.rarity === 'epic');
      if (midTier.length > 0) pool = midTier;
    }
  } else if (floorNumber >= 3) {
    if (roll < 0.45) {
      const rareTier = pool.filter(i => i.rarity === 'rare');
      if (rareTier.length > 0) pool = rareTier;
    }
  }

  if (pool.length === 0) pool = ALL_ITEMS;
  const item = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...item,
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };
}
