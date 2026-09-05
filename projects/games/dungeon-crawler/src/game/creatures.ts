import { Creature, CreatureAbility, BestiaryEntry } from '../types/game';

export interface CreatureTemplate {
  name: string;
  mythologicalTitle: string;
  lore: string;
  tier: 'minion' | 'elite' | 'boss';
  radius: number;
  maxHp: number;
  damage: number;
  defense: number;
  speed: number;
  expValue: number;
  goldValue: number;
  color: string;
  accentColor: string;
  iconName: string;
  weakness: string;
  abilities: Omit<CreatureAbility, 'currentCooldown' | 'isCasting' | 'castProgress'>[];
  specialTrait?: 'regeneration' | 'split_on_death' | 'reflect' | 'stealth';
  heads?: number;
}

export const CREATURE_TEMPLATES: Record<string, CreatureTemplate> = {
  // --- TIER 1: Crypts & Ruins (Floors 1-2) ---
  goblin_imp: {
    name: 'Goblin Skirmisher',
    mythologicalTitle: 'Scavenger of Tartarus',
    lore: 'Noxious subterranean scavengers that swarm in ancient catacombs with crude bone blades.',
    tier: 'minion',
    radius: 12,
    maxHp: 35,
    damage: 8,
    defense: 2,
    speed: 2.1,
    expValue: 15,
    goldValue: 6,
    color: '#4ade80',
    accentColor: '#15803d',
    iconName: 'goblin',
    weakness: 'Fire and heavy cleaves',
    abilities: [],
  },
  skeleton_hoplite: {
    name: 'Undead Hoplite',
    mythologicalTitle: 'Fallen Soldier of Sparta',
    lore: 'Ancient cursed soldiers bound by eternal martial duty, wielding bronze shields and spears.',
    tier: 'minion',
    radius: 14,
    maxHp: 55,
    damage: 12,
    defense: 6,
    speed: 1.4,
    expValue: 25,
    goldValue: 10,
    color: '#e2e8f0',
    accentColor: '#94a3b8',
    iconName: 'skeleton',
    weakness: 'Blunt force and Holy magic',
    abilities: [],
  },
  satyr_ranger: {
    name: 'Corrupted Satyr',
    mythologicalTitle: 'Woodland Archer of Pan',
    lore: 'Once joyful forest dancers, warped by dungeon miasma into vicious thorn-bow marksmen.',
    tier: 'minion',
    radius: 13,
    maxHp: 40,
    damage: 14,
    defense: 3,
    speed: 1.8,
    expValue: 28,
    goldValue: 12,
    color: '#d97706',
    accentColor: '#78350f',
    iconName: 'satyr',
    weakness: 'Close quarters rushing',
    abilities: [
      {
        name: 'Poison Dart',
        cooldown: 3.5,
        type: 'poison_spit',
        range: 220,
        castTime: 0.8,
      }
    ],
  },
  harpy: {
    name: 'Gale Harpy',
    mythologicalTitle: 'Storm Snatcher',
    lore: 'Winged winged monsters with razor talons that dive upon unsuspecting dungeoneers.',
    tier: 'elite',
    radius: 15,
    maxHp: 85,
    damage: 18,
    defense: 4,
    speed: 2.4,
    expValue: 50,
    goldValue: 20,
    color: '#38bdf8',
    accentColor: '#0284c7',
    iconName: 'harpy',
    weakness: 'Frost and ranged arrows',
    abilities: [
      {
        name: 'Swoop Strike',
        cooldown: 4.0,
        type: 'charge',
        range: 180,
        castTime: 0.6,
      }
    ],
  },

  // --- BOSS 1: Minotaur (Floor 2) ---
  boss_minotaur: {
    name: 'The Minotaur of Knossos',
    mythologicalTitle: 'Terror of the Labyrinth',
    lore: 'A monstrous half-man, half-bull monstrosity imprisoned in the winding stone labyrinth. Its earth-shattering charge pulverizes pillars and adventurers alike.',
    tier: 'boss',
    radius: 26,
    maxHp: 480,
    damage: 26,
    defense: 10,
    speed: 1.6,
    expValue: 250,
    goldValue: 100,
    color: '#b91c1c',
    accentColor: '#fca5a5',
    iconName: 'minotaur',
    weakness: 'Sidestepping charges and baiting into walls',
    abilities: [
      {
        name: 'Bull Rush',
        cooldown: 5.0,
        type: 'charge',
        range: 280,
        castTime: 1.2,
      },
      {
        name: 'Earthquake Stomp',
        cooldown: 7.0,
        type: 'stomp',
        range: 120,
        castTime: 1.0,
      },
      {
        name: 'Labyrinth Cleave',
        cooldown: 3.5,
        type: 'melee_cleave',
        range: 75,
        castTime: 0.5,
      }
    ],
  },

  // --- TIER 2: Gorgon's Lair & Sunken Tombs (Floors 3-4) ---
  wisp: {
    name: 'Cursed Will-o\'-the-Wisp',
    mythologicalTitle: 'Soul Eater',
    lore: 'Luminescent spirits that float through crypts, shocking prey with volatile arcane sparks.',
    tier: 'minion',
    radius: 11,
    maxHp: 50,
    damage: 18,
    defense: 2,
    speed: 2.3,
    expValue: 40,
    goldValue: 18,
    color: '#a855f7',
    accentColor: '#c084fc',
    iconName: 'wisp',
    weakness: 'Physical attacks and lightning immunity',
    abilities: [],
  },
  basilisk: {
    name: 'Emerald Basilisk',
    mythologicalTitle: 'Serpent of Toxic Dread',
    lore: 'Eight-legged reptile whose venom dissolves armor and leaves puddles of bubbling acid.',
    tier: 'minion',
    radius: 16,
    maxHp: 110,
    damage: 22,
    defense: 8,
    speed: 1.7,
    expValue: 60,
    goldValue: 24,
    color: '#10b981',
    accentColor: '#047857',
    iconName: 'basilisk',
    weakness: 'Fire and long-range kiting',
    abilities: [
      {
        name: 'Venom Blast',
        cooldown: 4.5,
        type: 'poison_spit',
        range: 200,
        castTime: 0.9,
      }
    ],
  },
  hellhound: {
    name: 'Infernal Shadowfang',
    mythologicalTitle: 'Beast of the Stygian Gates',
    lore: 'Fierce canines wreathed in dark flame that stalk prey through shadows and leap from distance.',
    tier: 'elite',
    radius: 16,
    maxHp: 140,
    damage: 25,
    defense: 6,
    speed: 2.5,
    expValue: 80,
    goldValue: 35,
    color: '#f97316',
    accentColor: '#7c2d12',
    iconName: 'hellhound',
    weakness: 'Frost magic and shield counters',
    abilities: [
      {
        name: 'Shadow Pounce',
        cooldown: 4.0,
        type: 'leap',
        range: 220,
        castTime: 0.7,
      }
    ],
  },
  stone_golem: {
    name: 'Runic Golem',
    mythologicalTitle: 'Ancient Tomb Guardian',
    lore: 'Massive stone sentinel infused with primal earth magic. Tremendously armored.',
    tier: 'elite',
    radius: 22,
    maxHp: 240,
    damage: 32,
    defense: 16,
    speed: 1.1,
    expValue: 110,
    goldValue: 45,
    color: '#64748b',
    accentColor: '#38bdf8',
    iconName: 'golem',
    weakness: 'Arcane piercing magic and slow mobility',
    abilities: [
      {
        name: 'Seismic Slam',
        cooldown: 6.0,
        type: 'stomp',
        range: 130,
        castTime: 1.2,
      }
    ],
  },

  // --- BOSS 2: Medusa (Floor 4) ---
  boss_medusa: {
    name: 'Medusa the Gorgon Queen',
    mythologicalTitle: 'Sovereign of Petrifying Glare',
    lore: 'Cursed priestess with serpentine hair whose gaze turns mortal flesh to brittle granite. Look away before her ocular beam completes its charge!',
    tier: 'boss',
    radius: 24,
    maxHp: 850,
    damage: 34,
    defense: 12,
    speed: 1.8,
    expValue: 500,
    goldValue: 200,
    color: '#059669',
    accentColor: '#34d399',
    iconName: 'medusa',
    weakness: 'Dodging behind her when she casts Stone Gaze',
    abilities: [
      {
        name: 'Petrifying Gaze',
        cooldown: 6.5,
        type: 'petrify_beam',
        range: 300,
        castTime: 1.4,
      },
      {
        name: 'Viper Swarm',
        cooldown: 4.0,
        type: 'poison_spit',
        range: 240,
        castTime: 0.8,
      },
      {
        name: 'Serpent Slither',
        cooldown: 8.0,
        type: 'charge',
        range: 200,
        castTime: 0.5,
      }
    ],
  },

  // --- TIER 3: Tartarus Abyss (Floors 5-6) ---
  manticore: {
    name: 'Bloodwing Manticore',
    mythologicalTitle: 'Chimera of the Crimson Wastes',
    lore: 'Lion-bodied fiend with bat wings and a scorpion tail that flings deadly venomous needles.',
    tier: 'elite',
    radius: 20,
    maxHp: 220,
    damage: 36,
    defense: 10,
    speed: 2.2,
    expValue: 130,
    goldValue: 60,
    color: '#e11d48',
    accentColor: '#881337',
    iconName: 'manticore',
    weakness: 'Frost Nova and shield parries',
    abilities: [
      {
        name: 'Tail Spine Barrage',
        cooldown: 4.5,
        type: 'poison_spit',
        range: 260,
        castTime: 0.9,
      }
    ],
  },
  cyclops: {
    name: 'One-Eyed Cyclops',
    mythologicalTitle: 'Forge-Breaker of Hephaestus',
    lore: 'Towering one-eyed brute wielding tree-trunk clubs that crush entire battalions.',
    tier: 'elite',
    radius: 24,
    maxHp: 320,
    damage: 42,
    defense: 14,
    speed: 1.3,
    expValue: 160,
    goldValue: 75,
    color: '#ca8a04',
    accentColor: '#fef08a',
    iconName: 'cyclops',
    weakness: 'Blinding attacks and rapid hit-and-run tactics',
    abilities: [
      {
        name: 'Club Smash',
        cooldown: 5.0,
        type: 'stomp',
        range: 140,
        castTime: 1.1,
      }
    ],
  },

  // --- BOSS 3: Cerberus (Floor 6) ---
  boss_cerberus: {
    name: 'Cerberus, Gatekeeper of Hades',
    mythologicalTitle: 'Three-Headed Hound of the Underworld',
    lore: 'The terrifying triple-headed titan beast guarding the river Styx. Each head unleashes torrential flames and Stygian underworld curses.',
    tier: 'boss',
    radius: 32,
    maxHp: 1400,
    damage: 45,
    defense: 18,
    speed: 2.0,
    heads: 3,
    expValue: 900,
    goldValue: 350,
    color: '#ea580c',
    accentColor: '#fed7aa',
    iconName: 'cerberus',
    weakness: 'Water/Frost blessings and attacking flanks',
    abilities: [
      {
        name: 'Triple Inferno Breath',
        cooldown: 5.5,
        type: 'fire_breath',
        range: 280,
        castTime: 1.3,
      },
      {
        name: 'Underworld Pounce',
        cooldown: 7.0,
        type: 'leap',
        range: 300,
        castTime: 1.0,
      },
      {
        name: 'Stygian Howl',
        cooldown: 10.0,
        type: 'stomp',
        range: 160,
        castTime: 0.8,
      }
    ],
  },

  // --- TIER 4: Olympus Sanctum (Floors 7-8) ---
  chimera: {
    name: 'Elder Chimera',
    mythologicalTitle: 'Tri-Beast of Mount Chimaera',
    lore: 'A fire-breathing hybrid of lion, goat, and serpent capable of multifaceted elemental attacks.',
    tier: 'elite',
    radius: 24,
    maxHp: 380,
    damage: 48,
    defense: 16,
    speed: 2.1,
    expValue: 220,
    goldValue: 90,
    color: '#8b5cf6',
    accentColor: '#f43f5e',
    iconName: 'chimera',
    weakness: 'Targeting individual animal aspects',
    abilities: [
      {
        name: 'Chimera Flame',
        cooldown: 4.5,
        type: 'fire_breath',
        range: 240,
        castTime: 0.9,
      }
    ],
  },
  griffin: {
    name: 'Solar Gryphon',
    mythologicalTitle: 'Sun-Chaser of Apollo',
    lore: 'Majestic half-eagle, half-lion predator that sweeps through the air summoning gale-force shockwaves.',
    tier: 'elite',
    radius: 22,
    maxHp: 340,
    damage: 44,
    defense: 14,
    speed: 2.6,
    expValue: 200,
    goldValue: 85,
    color: '#f59e0b',
    accentColor: '#fef3c7',
    iconName: 'griffin',
    weakness: 'Grounded crowd control and lightning',
    abilities: [
      {
        name: 'Wing Gust Charge',
        cooldown: 4.0,
        type: 'charge',
        range: 240,
        castTime: 0.7,
      }
    ],
  },

  // --- BOSS 4: The Hydra (Floor 8) ---
  boss_hydra: {
    name: 'Lernaean Hydra',
    mythologicalTitle: 'The Nine-Headed Serpent of Lerna',
    lore: 'An ancient serpentine titan whose severed heads sprout anew if not cauterized by fire. Spews corrosive acid clouds across the battlefield.',
    tier: 'boss',
    radius: 34,
    maxHp: 2200,
    damage: 55,
    defense: 22,
    speed: 1.7,
    heads: 5,
    specialTrait: 'regeneration',
    expValue: 1500,
    goldValue: 600,
    color: '#047857',
    accentColor: '#10b981',
    iconName: 'hydra',
    weakness: 'Fire damage prevents its head regeneration',
    abilities: [
      {
        name: 'Toxic Bile Deluge',
        cooldown: 5.0,
        type: 'poison_spit',
        range: 320,
        castTime: 1.2,
      },
      {
        name: 'Hydra Frenzy Cleave',
        cooldown: 3.5,
        type: 'melee_cleave',
        range: 110,
        castTime: 0.6,
      },
      {
        name: 'Acid Pool Eruption',
        cooldown: 8.0,
        type: 'stomp',
        range: 180,
        castTime: 1.1,
      }
    ],
  },

  // --- FINAL BOSS: Typhon / Ancient Dragon Titan (Floor 10) ---
  boss_dragon_titan: {
    name: 'Typhon, Father of All Monsters',
    mythologicalTitle: 'Primordial Titan of Tartarus & Storms',
    lore: 'The deadliest titan of ancient mythology. Its colossal serpentine coils and fiery wings can shake the foundations of Mount Olympus.',
    tier: 'boss',
    radius: 42,
    maxHp: 3800,
    damage: 70,
    defense: 28,
    speed: 1.9,
    expValue: 3000,
    goldValue: 1200,
    color: '#7f1d1d',
    accentColor: '#fbbf24',
    iconName: 'dragon',
    weakness: 'Full arsenal of divine god blessings',
    abilities: [
      {
        name: 'Cataclysmic Firestorm',
        cooldown: 6.0,
        type: 'fire_breath',
        range: 360,
        castTime: 1.5,
      },
      {
        name: 'Titan Comet Crash',
        cooldown: 8.5,
        type: 'leap',
        range: 350,
        castTime: 1.3,
      },
      {
        name: 'Tartarean Earth-Shatter',
        cooldown: 5.0,
        type: 'stomp',
        range: 220,
        castTime: 1.0,
      }
    ],
  },
};

export function createCreature(templateKey: string, x: number, y: number, floorNumber: number): Creature {
  const t = CREATURE_TEMPLATES[templateKey] || CREATURE_TEMPLATES.goblin_imp;
  
  // Floor scaling factor
  const hpScale = 1 + (floorNumber - 1) * 0.22;
  const dmgScale = 1 + (floorNumber - 1) * 0.16;

  const abilities: CreatureAbility[] = t.abilities.map(a => ({
    ...a,
    currentCooldown: Math.random() * (a.cooldown * 0.5), // staggered initial cooldowns
    isCasting: false,
    castProgress: 0,
  }));

  return {
    id: `mob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: t.name,
    mythologicalTitle: t.mythologicalTitle,
    lore: t.lore,
    tier: t.tier,
    x,
    y,
    radius: t.radius,
    maxHp: Math.round(t.maxHp * hpScale),
    hp: Math.round(t.maxHp * hpScale),
    damage: Math.round(t.damage * dmgScale),
    defense: t.defense,
    speed: t.speed,
    expValue: Math.round(t.expValue * (1 + floorNumber * 0.1)),
    goldValue: Math.round(t.goldValue * (1 + floorNumber * 0.15)),
    color: t.color,
    accentColor: t.accentColor,
    iconName: t.iconName,
    abilities,
    statuses: [],
    facingAngle: Math.random() * Math.PI * 2,
    state: 'idle',
    stateTimer: 0,
    targetPlayer: false,
    specialTrait: t.specialTrait,
    heads: t.heads,
    maxHeads: t.heads,
  };
}

export function getAllBestiaryEntries(): BestiaryEntry[] {
  return Object.keys(CREATURE_TEMPLATES).map(key => {
    const t = CREATURE_TEMPLATES[key];
    return {
      id: key,
      name: t.name,
      mythologicalTitle: t.mythologicalTitle,
      lore: t.lore,
      tier: t.tier,
      kills: 0,
      encountered: false,
      weakness: t.weakness,
    };
  });
}
