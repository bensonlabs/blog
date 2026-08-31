export type Direction = 'up' | 'down' | 'left' | 'right';

export type TileType = 
  | 'wall' 
  | 'floor' 
  | 'corridor' 
  | 'door' 
  | 'stairs_down' 
  | 'stairs_up' 
  | 'water' 
  | 'chest' 
  | 'fountain' 
  | 'shrine' 
  | 'trap' 
  | 'pillar';

export interface Tile {
  type: TileType;
  walkable: boolean;
  transparent: boolean;
  discovered: boolean;
  visible: boolean;
  variant: number;
  decoration?: 'torch' | 'moss' | 'blood' | 'bones' | 'rune' | 'pot';
  interacted?: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Room extends Rect {
  type: 'spawn' | 'normal' | 'treasure' | 'shrine' | 'boss';
  connected: boolean;
  doors: { x: number; y: number }[];
  center: { x: number; y: number };
}

export type DamageType = 'physical' | 'fire' | 'frost' | 'poison' | 'arcane' | 'lightning';

export interface StatusEffect {
  type: 'burn' | 'freeze' | 'poison' | 'stun' | 'stone' | 'bleed' | 'speed' | 'shield' | 'berserk';
  duration: number; // in seconds
  value: number; // damage per second or magnitude
  source: 'player' | 'enemy' | 'shrine';
}

export type CreatureTier = 'minion' | 'elite' | 'boss';

export interface CreatureAbility {
  name: string;
  cooldown: number;
  currentCooldown: number;
  type: 'melee_cleave' | 'charge' | 'petrify_beam' | 'fire_breath' | 'poison_spit' | 'summon' | 'stomp' | 'leap';
  range: number;
  castTime: number; // telegraph time
  isCasting: boolean;
  castProgress: number;
  targetPos?: { x: number; y: number };
  targetAngle?: number;
}

export interface Creature {
  id: string;
  name: string;
  mythologicalTitle: string;
  lore: string;
  tier: CreatureTier;
  x: number;
  y: number;
  radius: number;
  maxHp: number;
  hp: number;
  damage: number;
  defense: number;
  speed: number;
  expValue: number;
  goldValue: number;
  color: string;
  accentColor: string;
  iconName: string; // for rendering features
  abilities: CreatureAbility[];
  statuses: StatusEffect[];
  facingAngle: number;
  state: 'idle' | 'patrol' | 'chase' | 'casting' | 'charging' | 'stunned' | 'hit';
  stateTimer: number;
  chargeVelocity?: { vx: number; vy: number };
  targetPlayer: boolean;
  specialTrait?: 'regeneration' | 'split_on_death' | 'reflect' | 'stealth';
  heads?: number; // for hydra/cerberus
  maxHeads?: number;
}

export type HeroClassType = 'warrior' | 'mage' | 'ranger';

export interface HeroClassConfig {
  id: HeroClassType;
  name: string;
  title: string;
  description: string;
  avatarColor: string;
  baseHp: number;
  baseMana: number;
  baseStamina: number;
  baseSpeed: number;
  baseAttackDamage: number;
  baseDefense: number;
  weaponType: 'sword' | 'staff' | 'bow';
  skill1: {
    name: string;
    description: string;
    cooldown: number;
    manaCost: number;
    icon: string;
  };
  skill2: {
    name: string;
    description: string;
    cooldown: number;
    manaCost: number;
    icon: string;
  };
  ultimate: {
    name: string;
    description: string;
    cooldown: number;
    manaCost: number;
    icon: string;
  };
}

export type ItemRarity = 'common' | 'rare' | 'epic' | 'mythic';
export type ItemType = 'weapon' | 'armor' | 'relic' | 'potion' | 'gold';

export const MAX_INVENTORY_CAPACITY = 16;
export const MAX_RELIC_SLOTS = 3;

export interface Item {
  id: string;
  name: string;
  description: string;
  lore?: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;
  value: number;
  stats?: {
    damage?: number;
    defense?: number;
    maxHp?: number;
    maxMana?: number;
    speed?: number;
    critChance?: number;
    lifesteal?: number;
    cooldownReduction?: number;
    damageBuff?: number;
  };
  effect?: {
    type: 'heal_hp' | 'restore_mana' | 'speed_boost' | 'invincibility' | 'damage_buff' | 'ward_shield' | 'full_restore' | 'antidote';
    value: number;
    duration?: number;
  };
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  classType: HeroClassType;
  name: string;
  level: number;
  exp: number;
  expToNextLevel: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
  gold: number;
  soulShards: number;
  facingAngle: number;
  isDashing: boolean;
  dashTime: number;
  dashDuration: number;
  dashCooldown: number;
  dashCooldownTimer: number;
  dashVelocity: { vx: number; vy: number };
  isShielding: boolean;
  shieldActiveTimer: number;
  attackCooldownTimer: number;
  skill1CooldownTimer: number;
  skill2CooldownTimer: number;
  ultimateCooldownTimer: number;
  statuses: StatusEffect[];
  equipment: {
    weapon: Item | null;
    armor: Item | null;
    relics: Item[];
  };
  inventory: Item[];
  quickPotions: {
    health: number;
    mana: number;
  };
  stats: {
    strength: number;
    arcane: number;
    dexterity: number;
    vitality: number;
  };
  totalKills: number;
  damageDealt: number;
  damageTaken: number;
  bossesSlain: number;
}

export interface Projectile {
  id: string;
  source: 'player' | 'enemy';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  damageType: DamageType;
  color: string;
  trailColor: string;
  lifetime: number;
  piercing?: boolean;
  piercedIds?: string[];
  explosionRadius?: number;
  statusOnHit?: StatusEffect;
  homing?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'blood' | 'rune' | 'feather';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  lifetime: number;
  maxLifetime: number;
  isCritical?: boolean;
}

export interface TelegraphArea {
  id: string;
  type: 'circle' | 'cone' | 'line';
  x: number;
  y: number;
  radius?: number;
  angle?: number;
  spreadAngle?: number;
  length?: number;
  width?: number;
  progress: number; // 0 to 1
  color: string;
  label?: string;
}

export interface DivineBoon {
  id: string;
  god: 'Zeus' | 'Ares' | 'Poseidon' | 'Athena' | 'Hades' | 'Apollo' | 'Artemis' | 'Hermes';
  name: string;
  description: string;
  rarity: ItemRarity;
  icon: string;
  apply: (player: Player) => void;
}

export interface BestiaryEntry {
  id: string;
  name: string;
  mythologicalTitle: string;
  lore: string;
  tier: CreatureTier;
  kills: number;
  encountered: boolean;
  weakness: string;
}

export interface DungeonFloor {
  floorNumber: number;
  name: string;
  theme: 'crypt' | 'labyrinths' | 'gorgon_cave' | 'tartarus_abyss' | 'olympus_sanctum';
  width: number;
  height: number;
  tiles: Tile[][];
  rooms: Room[];
  creatures: Creature[];
  projectiles: Projectile[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  telegraphs: TelegraphArea[];
  droppedItems: { id: string; item: Item; x: number; y: number }[];
  stairsDownPos: { x: number; y: number };
  stairsUpPos: { x: number; y: number };
  isBossFloor: boolean;
  bossDefeated: boolean;
  ambientLight: number; // 0.05 to 0.4
}

export type GameScreen = 'hero_select' | 'playing' | 'inventory' | 'boon_select' | 'bestiary' | 'game_over' | 'victory';
