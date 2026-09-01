import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Player,
  HeroClassType,
  GameScreen,
  DungeonFloor,
  BestiaryEntry,
  DivineBoon,
  Item,
  MAX_INVENTORY_CAPACITY,
  MAX_RELIC_SLOTS,
} from './types/game';
import { HERO_CLASSES } from './game/classes';
import { generateFloor, updateFOV, TILE_SIZE } from './game/dungeonGenerator';
import { getAllBestiaryEntries } from './game/creatures';
import {
  GOD_BOONS,
  ALL_ITEMS,
  getRandomLootItem,
  calculateItemSalvageValue,
  sortInventoryItems,
} from './game/items';
import { sound } from './game/audio';
import { updateCreatureAI, damageCreature, damagePlayer, isWalkable } from './game/combat';
import { renderGame } from './game/renderer';

import { HUD } from './components/HUD';
import { Minimap } from './components/Minimap';
import { HeroSelect } from './components/HeroSelect';
import { InventoryModal } from './components/InventoryModal';
import { BoonModal } from './components/BoonModal';
import { BestiaryModal } from './components/BestiaryModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { TouchControls } from './components/TouchControls';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States
  const [screen, setScreen] = useState<GameScreen>('hero_select');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [isBestiaryOpen, setIsBestiaryOpen] = useState<boolean>(false);
  const [availableBoons, setAvailableBoons] = useState<DivineBoon[]>([]);
  const [bestiary, setBestiary] = useState<BestiaryEntry[]>(getAllBestiaryEntries());

  // Core Game Refs
  const playerRef = useRef<Player | null>(null);
  const floorRef = useRef<DungeonFloor | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchMoveVector = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const screenShakeRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const lastTimeRef = useRef<number>(performance.now());
  const reqAnimFrameRef = useRef<number | null>(null);

  // UI state trigger for React re-render of HUD
  const [, setTick] = useState<number>(0);

  // Initialize a new game run with chosen hero class
  const handleStartGame = (classType: HeroClassType) => {
    const config = HERO_CLASSES[classType];

    // Reset controls, modals, and screen effects
    keysRef.current = {};
    touchMoveVector.current = { x: 0, y: 0 };
    screenShakeRef.current = { x: 0, y: 0, time: 0 };
    lastTimeRef.current = performance.now();
    setIsInventoryOpen(false);
    setIsBestiaryOpen(false);
    setAvailableBoons([]);
    
    // Create initial player
    const newPlayer: Player = {
      x: 0,
      y: 0,
      radius: 14,
      classType,
      name: config.name,
      level: 1,
      exp: 0,
      expToNextLevel: 100,
      hp: config.baseHp,
      maxHp: config.baseHp,
      mana: config.baseMana,
      maxMana: config.baseMana,
      stamina: config.baseStamina,
      maxStamina: config.baseStamina,
      gold: 50,
      soulShards: 0,
      facingAngle: 0,
      isDashing: false,
      dashTime: 0,
      dashDuration: 0.18,
      dashCooldown: 1.2,
      dashCooldownTimer: 0,
      dashVelocity: { vx: 0, vy: 0 },
      isShielding: false,
      shieldActiveTimer: 0,
      attackCooldownTimer: 0,
      skill1CooldownTimer: 0,
      skill2CooldownTimer: 0,
      ultimateCooldownTimer: 0,
      statuses: [],
      equipment: {
        weapon: ALL_ITEMS.find(i => i.id.startsWith('wep_bronze')) || null,
        armor: ALL_ITEMS.find(i => i.id.startsWith('arm_leather')) || null,
        relics: [],
      },
      inventory: [
        ALL_ITEMS.find(i => i.id === 'pot_ambrosia_health')!,
        ALL_ITEMS.find(i => i.id === 'pot_stygian_mana')!,
      ].filter(Boolean),
      quickPotions: {
        health: 2,
        mana: 2,
      },
      stats: {
        strength: 5,
        arcane: 5,
        dexterity: 5,
        vitality: 5,
      },
      totalKills: 0,
      damageDealt: 0,
      damageTaken: 0,
      bossesSlain: 0,
    };

    // Generate Floor 1
    const newFloor = generateFloor(1);
    newPlayer.x = newFloor.stairsUpPos.x;
    newPlayer.y = newFloor.stairsUpPos.y;

    playerRef.current = newPlayer;
    floorRef.current = newFloor;

    // Update initial FOV
    updateFOV(newFloor.tiles, newPlayer.x, newPlayer.y);

    setScreen('playing');
    sound.startDungeonAmbience(newFloor.isBossFloor);
  };

  // Switch / Descend Floor
  const handleDescendFloor = useCallback(() => {
    const player = playerRef.current;
    const floor = floorRef.current;
    if (!player || !floor) return;

    sound.playStairs();
    const nextFloorNum = floor.floorNumber + 1;

    // Check Victory condition on floor 10 boss clear
    if (floor.floorNumber >= 10 && floor.bossDefeated) {
      setScreen('victory');
      sound.stopDungeonAmbience();
      return;
    }

    const nextFloor = generateFloor(nextFloorNum);
    player.x = nextFloor.stairsUpPos.x;
    player.y = nextFloor.stairsUpPos.y;

    // Floor restore bonuses
    player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.35));
    player.mana = Math.min(player.maxMana, player.mana + Math.round(player.maxMana * 0.5));

    floorRef.current = nextFloor;
    updateFOV(nextFloor.tiles, player.x, player.y);

    sound.startDungeonAmbience(nextFloor.isBossFloor);
  }, []);

  // Primary Attack
  const handlePrimaryAttack = useCallback(() => {
    const player = playerRef.current;
    const floor = floorRef.current;
    if (!player || !floor || player.attackCooldownTimer > 0 || player.hp <= 0) return;

    const angle = player.facingAngle;
    player.attackCooldownTimer = 0.35; // 0.35s attack rate

    // Calculate attack damage
    let baseDmg = HERO_CLASSES[player.classType].baseAttackDamage + player.stats.strength * 2.5;
    if (player.equipment.weapon?.stats?.damage) baseDmg += player.equipment.weapon.stats.damage;
    player.equipment.relics.forEach(r => {
      if (r.stats?.damage) baseDmg += r.stats.damage;
    });
    if (player.statuses.some(s => s.type === 'berserk')) {
      baseDmg = Math.round(baseDmg * 1.4);
    }

    let critChance = 0.1 + (player.stats.dexterity * 0.015);
    if (player.equipment.weapon?.stats?.critChance) critChance += player.equipment.weapon.stats.critChance;
    player.equipment.relics.forEach(r => {
      if (r.stats?.critChance) critChance += r.stats.critChance;
    });

    const isCrit = Math.random() < critChance;
    const finalDmg = Math.round(baseDmg * (isCrit ? 2.0 : 1.0));

    if (player.classType === 'warrior') {
      sound.playSwing();
      // Melee Arc Cleave
      const cleaveRange = 68;
      const cleaveArc = Math.PI * 0.75;

      // Cleave particle slash
      for (let p = 0; p < 12; p++) {
        const pAngle = angle - cleaveArc / 2 + (p / 12) * cleaveArc;
        floor.particles.push({
          x: player.x + Math.cos(pAngle) * (cleaveRange * 0.7),
          y: player.y + Math.sin(pAngle) * (cleaveRange * 0.7),
          vx: Math.cos(pAngle) * 3,
          vy: Math.sin(pAngle) * 3,
          size: 4,
          color: isCrit ? '#facc15' : '#f87171',
          alpha: 1,
          lifetime: 0,
          maxLifetime: 0.25,
          shape: 'spark',
        });
      }

      // Check hit against creatures
      floor.creatures.forEach(c => {
        if (c.hp <= 0) return;
        const dist = Math.hypot(c.x - player.x, c.y - player.y);
        if (dist <= cleaveRange + c.radius) {
          const aToMob = Math.atan2(c.y - player.y, c.x - player.x);
          const diff = Math.abs((aToMob - angle + Math.PI * 3) % (Math.PI * 2) - Math.PI);
          if (diff <= cleaveArc / 2) {
            damageCreature(c, finalDmg, 'physical', player, floor.floatingTexts, floor.particles, isCrit);
          }
        }
      });

    } else if (player.classType === 'mage') {
      sound.playSpellCast('arcane');
      // Arcane Energy Bolt
      floor.projectiles.push({
        id: `proj_bolt_${Date.now()}`,
        source: 'player',
        x: player.x + Math.cos(angle) * 16,
        y: player.y + Math.sin(angle) * 16,
        vx: Math.cos(angle) * 8.5,
        vy: Math.sin(angle) * 8.5,
        radius: 7,
        damage: finalDmg,
        damageType: 'arcane',
        color: isCrit ? '#facc15' : '#a855f7',
        trailColor: '#c084fc',
        lifetime: 1.5,
      });

    } else if (player.classType === 'ranger') {
      sound.playSwing();
      // Piercing Arrow
      floor.projectiles.push({
        id: `proj_arrow_${Date.now()}`,
        source: 'player',
        x: player.x + Math.cos(angle) * 16,
        y: player.y + Math.sin(angle) * 16,
        vx: Math.cos(angle) * 11.0,
        vy: Math.sin(angle) * 11.0,
        radius: 5,
        damage: finalDmg,
        damageType: 'physical',
        color: isCrit ? '#facc15' : '#34d399',
        trailColor: '#10b981',
        lifetime: 1.6,
        piercing: true,
        piercedIds: [],
      });
    }
  }, []);

  // Class Skill 1
  const handleCastSkill1 = useCallback(() => {
    const player = playerRef.current;
    const floor = floorRef.current;
    if (!player || !floor || player.skill1CooldownTimer > 0) return;

    const heroConfig = HERO_CLASSES[player.classType];
    if (player.mana < heroConfig.skill1.manaCost) return;

    player.mana -= heroConfig.skill1.manaCost;
    player.skill1CooldownTimer = heroConfig.skill1.cooldown;

    if (player.classType === 'warrior') {
      // Shield Rush
      sound.playDash();
      player.isDashing = true;
      player.dashTime = 0.25;
      player.dashVelocity = {
        vx: Math.cos(player.facingAngle) * 9.5,
        vy: Math.sin(player.facingAngle) * 9.5,
      };

      // Stun & Damage surrounding mobs
      floor.creatures.forEach(c => {
        if (c.hp <= 0) return;
        const dist = Math.hypot(c.x - player.x, c.y - player.y);
        if (dist <= 100) {
          damageCreature(c, 40 + player.stats.strength * 2, 'physical', player, floor.floatingTexts, floor.particles, true);
          c.statuses.push({ type: 'stun', duration: 1.4, value: 0, source: 'player' });
        }
      });
    } else if (player.classType === 'mage') {
      // Frost Nova
      sound.playSpellCast('frost');
      const novaRadius = 140;
      floor.creatures.forEach(c => {
        if (c.hp <= 0) return;
        const dist = Math.hypot(c.x - player.x, c.y - player.y);
        if (dist <= novaRadius) {
          damageCreature(c, 35 + player.stats.arcane * 3, 'frost', player, floor.floatingTexts, floor.particles, false);
          c.statuses.push({ type: 'freeze', duration: 2.5, value: 0, source: 'player' });
        }
      });

      // Ice Nova Particles
      for (let p = 0; p < 32; p++) {
        const pAngle = (p / 32) * Math.PI * 2;
        floor.particles.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(pAngle) * 6,
          vy: Math.sin(pAngle) * 6,
          size: 5,
          color: '#38bdf8',
          alpha: 1,
          lifetime: 0,
          maxLifetime: 0.35,
          shape: 'spark',
        });
      }
    } else if (player.classType === 'ranger') {
      // Shadow Decoy Dash
      sound.playDash();
      player.isDashing = true;
      player.dashTime = 0.2;
      player.dashVelocity = {
        vx: -Math.cos(player.facingAngle) * 8.0,
        vy: -Math.sin(player.facingAngle) * 8.0,
      };

      // Decoy blast
      floor.floatingTexts.push({
        id: `txt_decoy_${Date.now()}`,
        x: player.x,
        y: player.y - 20,
        text: 'SHADOW DECOY!',
        color: '#34d399',
        size: 14,
        lifetime: 0,
        maxLifetime: 0.8,
      });
    }
  }, []);

  // Class Skill 2
  const handleCastSkill2 = useCallback(() => {
    const player = playerRef.current;
    const floor = floorRef.current;
    if (!player || !floor || player.skill2CooldownTimer > 0) return;

    const heroConfig = HERO_CLASSES[player.classType];
    if (player.mana < heroConfig.skill2.manaCost) return;

    player.mana -= heroConfig.skill2.manaCost;
    player.skill2CooldownTimer = heroConfig.skill2.cooldown;

    if (player.classType === 'warrior') {
      // Whirlwind Cleave
      sound.playSwing();
      const spinRadius = 90;
      floor.creatures.forEach(c => {
        if (c.hp <= 0) return;
        const dist = Math.hypot(c.x - player.x, c.y - player.y);
        if (dist <= spinRadius + c.radius) {
          damageCreature(c, 55 + player.stats.strength * 3, 'physical', player, floor.floatingTexts, floor.particles, true);
        }
      });

      // Spin particles
      for (let p = 0; p < 24; p++) {
        const pAngle = (p / 24) * Math.PI * 2;
        floor.particles.push({
          x: player.x + Math.cos(pAngle) * 30,
          y: player.y + Math.sin(pAngle) * 30,
          vx: Math.cos(pAngle) * 4,
          vy: Math.sin(pAngle) * 4,
          size: 4,
          color: '#f97316',
          alpha: 1,
          lifetime: 0,
          maxLifetime: 0.3,
          shape: 'spark',
        });
      }
    } else if (player.classType === 'mage') {
      // Aether Blink
      sound.playSpellCast('lightning');
      const blinkDist = 160;
      const targetX = player.x + Math.cos(player.facingAngle) * blinkDist;
      const targetY = player.y + Math.sin(player.facingAngle) * blinkDist;

      if (isWalkable(floor.tiles, targetX, targetY, player.radius)) {
        player.x = targetX;
        player.y = targetY;
        updateFOV(floor.tiles, player.x, player.y);
      }
    } else if (player.classType === 'ranger') {
      // Arrow Volley (5 spread arrows)
      sound.playSwing();
      for (let i = -2; i <= 2; i++) {
        const a = player.facingAngle + i * 0.16;
        floor.projectiles.push({
          id: `proj_volley_${Date.now()}_${i}`,
          source: 'player',
          x: player.x,
          y: player.y,
          vx: Math.cos(a) * 10.0,
          vy: Math.sin(a) * 10.0,
          radius: 5,
          damage: 35 + player.stats.dexterity * 2,
          damageType: 'physical',
          color: '#34d399',
          trailColor: '#059669',
          lifetime: 1.5,
          piercing: true,
          piercedIds: [],
        });
      }
    }
  }, []);

  // Class Ultimate Ability
  const handleCastUltimate = useCallback(() => {
    const player = playerRef.current;
    const floor = floorRef.current;
    if (!player || !floor || player.ultimateCooldownTimer > 0) return;

    const heroConfig = HERO_CLASSES[player.classType];
    if (player.mana < heroConfig.ultimate.manaCost) return;

    player.mana -= heroConfig.ultimate.manaCost;
    player.ultimateCooldownTimer = heroConfig.ultimate.cooldown;
    sound.playLevelUp();

    screenShakeRef.current = { x: 0, y: 0, time: 0.4 };

    if (player.classType === 'warrior') {
      // Spartan Wrath
      player.statuses.push({
        type: 'berserk',
        duration: 8.0,
        value: 1.5,
        source: 'player',
      });
      floor.floatingTexts.push({
        id: `txt_ult_${Date.now()}`,
        x: player.x,
        y: player.y - 30,
        text: 'SPARTAN WRATH ACTIVATED!',
        color: '#ef4444',
        size: 18,
        lifetime: 0,
        maxLifetime: 1.2,
        isCritical: true,
      });
    } else if (player.classType === 'mage') {
      // Meteor Cataclysm
      sound.playSpellCast('fire');
      floor.creatures.forEach(c => {
        if (c.hp <= 0) return;
        damageCreature(c, 130 + player.stats.arcane * 5, 'fire', player, floor.floatingTexts, floor.particles, true);
        c.statuses.push({ type: 'burn', duration: 4.0, value: 12, source: 'player' });
      });
      floor.floatingTexts.push({
        id: `txt_ult_${Date.now()}`,
        x: player.x,
        y: player.y - 30,
        text: 'METEOR CATACLYSM!',
        color: '#fbbf24',
        size: 18,
        lifetime: 0,
        maxLifetime: 1.2,
        isCritical: true,
      });
    } else if (player.classType === 'ranger') {
      // Moonlight Rain
      floor.creatures.forEach(c => {
        if (c.hp <= 0) return;
        damageCreature(c, 110 + player.stats.dexterity * 4, 'physical', player, floor.floatingTexts, floor.particles, true);
        c.statuses.push({ type: 'poison', duration: 5.0, value: 10, source: 'player' });
      });
      floor.floatingTexts.push({
        id: `txt_ult_${Date.now()}`,
        x: player.x,
        y: player.y - 30,
        text: 'MOONLIGHT BARRAGE!',
        color: '#38bdf8',
        size: 18,
        lifetime: 0,
        maxLifetime: 1.2,
        isCritical: true,
      });
    }
  }, []);

  // Dash / Dodge Roll (D Key)
  const handleDash = useCallback(() => {
    const player = playerRef.current;
    if (!player || player.dashCooldownTimer > 0 || player.stamina < 25) return;

    player.stamina -= 25;
    player.isDashing = true;
    player.dashTime = player.dashDuration;
    player.dashCooldownTimer = player.dashCooldown;

    // Check if player is holding arrow keys to dodge in that direction
    let dodgeAngle = player.facingAngle;
    let moveX = 0;
    let moveY = 0;
    if (keysRef.current['arrowup']) moveY -= 1;
    if (keysRef.current['arrowdown']) moveY += 1;
    if (keysRef.current['arrowleft']) moveX -= 1;
    if (keysRef.current['arrowright']) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
      dodgeAngle = Math.atan2(moveY, moveX);
      player.facingAngle = dodgeAngle;
    }

    const speed = 10.5;
    player.dashVelocity = {
      vx: Math.cos(dodgeAngle) * speed,
      vy: Math.sin(dodgeAngle) * speed,
    };

    sound.playDash();
  }, []);

  // Shield Guard (S Key)
  const handleShield = useCallback(() => {
    const player = playerRef.current;
    const floor = floorRef.current;
    if (!player || !floor || player.hp <= 0 || player.stamina < 6) return;

    player.isShielding = true;
    player.shieldActiveTimer = 0.65; // Quick guard activation window
    player.stamina = Math.max(0, player.stamina - 6);
    sound.playShieldRaise();

    floor.floatingTexts.push({
      id: `txt_shield_${Date.now()}`,
      x: player.x,
      y: player.y - 28,
      text: '🛡️ SHIELD GUARD',
      color: '#38bdf8',
      size: 14,
      lifetime: 0,
      maxLifetime: 0.5,
    });
  }, []);

  // Potion Consumption
  const handleUseHealthPotion = useCallback(() => {
    const player = playerRef.current;
    const floor = floorRef.current;
    if (!player || !floor || player.quickPotions.health <= 0 || player.hp >= player.maxHp) return;

    player.quickPotions.health--;
    player.hp = Math.min(player.maxHp, player.hp + 75);
    player.statuses = player.statuses.filter(s => s.type !== 'poison' && s.type !== 'bleed');
    sound.playPotion();

    floor.floatingTexts.push({
      id: `txt_heal_${Date.now()}`,
      x: player.x,
      y: player.y - 25,
      text: '+75 HP',
      color: '#22c55e',
      size: 16,
      lifetime: 0,
      maxLifetime: 0.8,
    });
  }, []);

  const handleUseManaPotion = useCallback(() => {
    const player = playerRef.current;
    const floor = floorRef.current;
    if (!player || !floor || player.quickPotions.mana <= 0 || player.mana >= player.maxMana) return;

    player.quickPotions.mana--;
    player.mana = Math.min(player.maxMana, player.mana + 80);
    sound.playPotion();

    floor.floatingTexts.push({
      id: `txt_mana_${Date.now()}`,
      x: player.x,
      y: player.y - 25,
      text: '+80 Mana',
      color: '#38bdf8',
      size: 16,
      lifetime: 0,
      maxLifetime: 0.8,
    });
  }, []);

  // Equipment & Consumables handlers
  const handleEquipItem = (item: Item, relicSlotIndex?: number) => {
    const player = playerRef.current;
    if (!player) return;

    if (item.type === 'weapon') {
      const oldWep = player.equipment.weapon;
      player.equipment.weapon = item;
      player.inventory = player.inventory.filter(i => i.id !== item.id);
      if (oldWep) player.inventory.push(oldWep);
    } else if (item.type === 'armor') {
      const oldArm = player.equipment.armor;
      player.equipment.armor = item;
      player.inventory = player.inventory.filter(i => i.id !== item.id);
      if (oldArm) player.inventory.push(oldArm);
    } else if (item.type === 'relic') {
      // If player already has max relics, replace selected slot or oldest
      if (player.equipment.relics.length >= MAX_RELIC_SLOTS) {
        const replaceIdx = relicSlotIndex !== undefined ? relicSlotIndex : 0;
        const oldRelic = player.equipment.relics[replaceIdx];
        if (oldRelic?.stats?.maxHp) {
          player.maxHp -= oldRelic.stats.maxHp;
          player.hp = Math.min(player.hp, player.maxHp);
        }
        if (oldRelic?.stats?.maxMana) {
          player.maxMana -= oldRelic.stats.maxMana;
          player.mana = Math.min(player.mana, player.maxMana);
        }

        player.equipment.relics[replaceIdx] = item;
        player.inventory = player.inventory.filter(i => i.id !== item.id);
        if (oldRelic) player.inventory.push(oldRelic);
      } else {
        player.equipment.relics.push(item);
        player.inventory = player.inventory.filter(i => i.id !== item.id);
      }

      // Apply new relic stats
      if (item.stats?.maxHp) {
        player.maxHp += item.stats.maxHp;
        player.hp += item.stats.maxHp;
      }
      if (item.stats?.maxMana) {
        player.maxMana += item.stats.maxMana;
        player.mana += item.stats.maxMana;
      }
    }
  };

  const handleUnequipItem = (slot: 'weapon' | 'armor' | 'relic', relicIndex?: number) => {
    const player = playerRef.current;
    if (!player) return;

    // Check capacity limit
    if (player.inventory.length >= MAX_INVENTORY_CAPACITY) {
      sound.playInventoryFull();
      return;
    }

    if (slot === 'weapon' && player.equipment.weapon) {
      const old = player.equipment.weapon;
      player.equipment.weapon = null;
      player.inventory.push(old);
      sound.playUnequip();
    } else if (slot === 'armor' && player.equipment.armor) {
      const old = player.equipment.armor;
      player.equipment.armor = null;
      player.inventory.push(old);
      sound.playUnequip();
    } else if (slot === 'relic' && relicIndex !== undefined && player.equipment.relics[relicIndex]) {
      const [removed] = player.equipment.relics.splice(relicIndex, 1);
      if (removed) {
        if (removed.stats?.maxHp) {
          player.maxHp -= removed.stats.maxHp;
          player.hp = Math.min(player.hp, player.maxHp);
        }
        if (removed.stats?.maxMana) {
          player.maxMana -= removed.stats.maxMana;
          player.mana = Math.min(player.mana, player.maxMana);
        }
        player.inventory.push(removed);
        sound.playUnequip();
      }
    }
  };

  const handleUseItem = (item: Item) => {
    const player = playerRef.current;
    const floor = floorRef.current;
    if (!player || !floor) return;

    if (item.effect?.type === 'heal_hp') {
      player.hp = Math.min(player.maxHp, player.hp + item.effect.value);
      player.statuses = player.statuses.filter(s => s.type !== 'poison' && s.type !== 'bleed');
      sound.playPotion();
      floor.floatingTexts.push({
        id: `txt_use_${Date.now()}`,
        x: player.x,
        y: player.y - 25,
        text: `+${item.effect.value} HP`,
        color: '#22c55e',
        size: 16,
        lifetime: 0,
        maxLifetime: 0.8,
      });
    } else if (item.effect?.type === 'restore_mana') {
      player.mana = Math.min(player.maxMana, player.mana + item.effect.value);
      sound.playPotion();
      floor.floatingTexts.push({
        id: `txt_use_${Date.now()}`,
        x: player.x,
        y: player.y - 25,
        text: `+${item.effect.value} Mana`,
        color: '#38bdf8',
        size: 16,
        lifetime: 0,
        maxLifetime: 0.8,
      });
    } else if (item.effect?.type === 'speed_boost') {
      player.statuses.push({
        type: 'speed',
        duration: item.effect.duration || 12,
        value: item.effect.value,
        source: 'player',
      });
      sound.playPotion();
      floor.floatingTexts.push({
        id: `txt_use_${Date.now()}`,
        x: player.x,
        y: player.y - 25,
        text: 'HERMES SPEED BOOST!',
        color: '#34d399',
        size: 15,
        lifetime: 0,
        maxLifetime: 1.0,
      });
    } else if (item.effect?.type === 'damage_buff') {
      player.statuses.push({
        type: 'berserk',
        duration: item.effect.duration || 15,
        value: item.effect.value,
        source: 'player',
      });
      sound.playPotion();
      floor.floatingTexts.push({
        id: `txt_use_${Date.now()}`,
        x: player.x,
        y: player.y - 25,
        text: 'ARES BERSERK RAGE!',
        color: '#f97316',
        size: 15,
        lifetime: 0,
        maxLifetime: 1.0,
      });
    } else if (item.effect?.type === 'ward_shield') {
      player.hp = Math.min(player.maxHp + item.effect.value, player.hp + item.effect.value);
      sound.playPotion();
      floor.floatingTexts.push({
        id: `txt_use_${Date.now()}`,
        x: player.x,
        y: player.y - 25,
        text: `+${item.effect.value} AEGIS WARD!`,
        color: '#eab308',
        size: 15,
        lifetime: 0,
        maxLifetime: 1.0,
      });
    } else if (item.effect?.type === 'full_restore') {
      player.hp = player.maxHp;
      player.mana = player.maxMana;
      player.statuses = [];
      sound.playLevelUp();
      floor.floatingTexts.push({
        id: `txt_use_${Date.now()}`,
        x: player.x,
        y: player.y - 25,
        text: 'PANACEA FULL RESTORATION!',
        color: '#fbbf24',
        size: 17,
        lifetime: 0,
        maxLifetime: 1.2,
      });
    }

    player.inventory = player.inventory.filter(i => i.id !== item.id);
  };

  const handleDropItem = (item: Item) => {
    const player = playerRef.current;
    const floor = floorRef.current;
    if (!player || !floor) return;

    player.inventory = player.inventory.filter(i => i.id !== item.id);
    floor.droppedItems.push({
      id: `drop_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      item,
      x: player.x,
      y: player.y,
    });

    floor.floatingTexts.push({
      id: `txt_drop_${Date.now()}`,
      x: player.x,
      y: player.y - 20,
      text: `Dropped ${item.name}`,
      color: '#94a3b8',
      size: 13,
      lifetime: 0,
      maxLifetime: 0.8,
    });
  };

  const handleSalvageItem = (item: Item) => {
    const player = playerRef.current;
    const floor = floorRef.current;
    if (!player || !floor) return;

    const { gold, soulShards } = calculateItemSalvageValue(item);
    player.gold += gold;
    player.soulShards += soulShards;
    player.inventory = player.inventory.filter(i => i.id !== item.id);

    // Particle spark at hero position
    for (let p = 0; p < 12; p++) {
      const angle = (p / 12) * Math.PI * 2;
      floor.particles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 3.5,
        vy: Math.sin(angle) * 3.5,
        size: 4,
        color: '#fbbf24',
        alpha: 1,
        lifetime: 0,
        maxLifetime: 0.4,
        shape: 'spark',
      });
    }

    floor.floatingTexts.push({
      id: `txt_salv_${Date.now()}`,
      x: player.x,
      y: player.y - 25,
      text: `+${gold} Gold  +${soulShards} Shards`,
      color: '#fbbf24',
      size: 14,
      lifetime: 0,
      maxLifetime: 1.0,
    });
  };

  const handleSortInventory = () => {
    const player = playerRef.current;
    if (!player) return;
    player.inventory = sortInventoryItems(player.inventory);
  };

  const handleAssignQuickSlot = (item: Item) => {
    const player = playerRef.current;
    const floor = floorRef.current;
    if (!player || !floor) return;

    if (item.id.includes('health')) {
      player.quickPotions.health++;
    } else {
      player.quickPotions.mana++;
    }

    player.inventory = player.inventory.filter(i => i.id !== item.id);
    floor.floatingTexts.push({
      id: `txt_qslot_${Date.now()}`,
      x: player.x,
      y: player.y - 20,
      text: '+1 Quick Potion',
      color: '#38bdf8',
      size: 13,
      lifetime: 0,
      maxLifetime: 0.7,
    });
  };

  // Boon selection callback
  const handleSelectBoon = (boon: DivineBoon) => {
    const player = playerRef.current;
    if (!player) return;

    boon.apply(player);
    sound.playLevelUp();
    setAvailableBoons([]);
    setScreen('playing');
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return;
      const key = e.key.toLowerCase();
      keysRef.current[key] = true;

      // Prevent scrolling on movement and combat keys
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'space'].includes(key)) {
        e.preventDefault();
      }

      if (screen !== 'playing') return;

      // Attack: Space bar
      if (key === ' ' || key === 'space') handlePrimaryAttack();

      // Dodge: D key
      if (key === 'd') handleDash();

      // Shield: S key
      if (key === 's') handleShield();

      // Potions
      if (key === '1' || key === 'q') handleUseHealthPotion();
      if (key === '2' || key === 'e') handleUseManaPotion();

      // Hero Skills
      if (key === 'w') handleCastSkill1();
      if (key === 'f') handleCastSkill2();
      if (key === 'r') handleCastUltimate();

      // UI Overlays
      if (key === 'tab' || key === 'i') setIsInventoryOpen(prev => !prev);
      if (key === 'b') setIsBestiaryOpen(prev => !prev);
      if (key === 'm') {
        const muted = sound.toggleMute();
        setIsMuted(muted);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.key) return;
      const key = e.key.toLowerCase();
      keysRef.current[key] = false;

      // Lower shield on S release if pulse timer expired
      if (key === 's' && playerRef.current) {
        if (playerRef.current.shieldActiveTimer <= 0) {
          playerRef.current.isShielding = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    screen,
    handlePrimaryAttack,
    handleDash,
    handleShield,
    handleUseHealthPotion,
    handleUseManaPotion,
    handleCastSkill1,
    handleCastSkill2,
    handleCastUltimate,
  ]);

  // Main Game Loop
  useEffect(() => {
    if (screen !== 'playing') return;

    const loop = (currentTime: number) => {
      const dt = Math.min(0.064, (currentTime - lastTimeRef.current) / 1000);
      lastTimeRef.current = currentTime;

      const player = playerRef.current;
      const floor = floorRef.current;
      const canvas = canvasRef.current;

      if (player && floor && canvas) {
        // --- 1. Player Timers & Regeneration ---
        player.stamina = Math.min(player.maxStamina, player.stamina + 30 * dt);
        player.mana = Math.min(player.maxMana, player.mana + 4 * dt);
        player.dashCooldownTimer = Math.max(0, player.dashCooldownTimer - dt);
        player.attackCooldownTimer = Math.max(0, player.attackCooldownTimer - dt);
        player.skill1CooldownTimer = Math.max(0, player.skill1CooldownTimer - dt);
        player.skill2CooldownTimer = Math.max(0, player.skill2CooldownTimer - dt);
        player.ultimateCooldownTimer = Math.max(0, player.ultimateCooldownTimer - dt);

        // Player Status Effects Tick
        for (let i = player.statuses.length - 1; i >= 0; i--) {
          const st = player.statuses[i];
          st.duration -= dt;
          if (st.type === 'poison' || st.type === 'burn' || st.type === 'bleed') {
            player.hp = Math.max(0, player.hp - (st.value || 8) * dt);
          }
          if (st.duration <= 0) {
            player.statuses.splice(i, 1);
          }
        }

        // Screen Shake decay
        if (screenShakeRef.current.time > 0) {
          screenShakeRef.current.time -= dt;
          screenShakeRef.current.x = (Math.random() * 2 - 1) * 6;
          screenShakeRef.current.y = (Math.random() * 2 - 1) * 6;
        } else {
          screenShakeRef.current.x = 0;
          screenShakeRef.current.y = 0;
        }

        // Shield Guard State Maintenance (S Key)
        if (player.hp > 0) {
          if ((keysRef.current['s'] || player.shieldActiveTimer > 0) && player.stamina > 4) {
            player.isShielding = true;
            if (keysRef.current['s']) {
              player.stamina = Math.max(0, player.stamina - 12 * dt);
            }
            if (player.shieldActiveTimer > 0) {
              player.shieldActiveTimer -= dt;
            }
          } else {
            player.isShielding = false;
            player.shieldActiveTimer = 0;
          }
        }

        // Attack: continuous attack while Space Bar is held
        if (keysRef.current[' '] || keysRef.current['space']) {
          handlePrimaryAttack();
        }

        // --- 2. Player Movement Input (Arrow Keys Only) ---
        if (player.isDashing) {
          player.dashTime -= dt;
          const nextX = player.x + player.dashVelocity.vx;
          const nextY = player.y + player.dashVelocity.vy;
          if (isWalkable(floor.tiles, nextX, nextY, player.radius)) {
            player.x = nextX;
            player.y = nextY;
          }
          if (player.dashTime <= 0) {
            player.isDashing = false;
          }
        } else {
          let moveX = 0;
          let moveY = 0;

          // STRICTLY ARROW KEYS ONLY FOR MOVEMENT
          if (keysRef.current['arrowup']) moveY -= 1;
          if (keysRef.current['arrowdown']) moveY += 1;
          if (keysRef.current['arrowleft']) moveX -= 1;
          if (keysRef.current['arrowright']) moveX += 1;

          // Touch joystick input
          if (touchMoveVector.current.x !== 0 || touchMoveVector.current.y !== 0) {
            moveX = touchMoveVector.current.x;
            moveY = touchMoveVector.current.y;
          }

          if (moveX !== 0 || moveY !== 0) {
            // Update facing angle in the direction of movement
            player.facingAngle = Math.atan2(moveY, moveX);

            const mag = Math.hypot(moveX, moveY) || 1;
            let speed = HERO_CLASSES[player.classType].baseSpeed + player.stats.dexterity * 0.08;
            if (player.statuses.some(s => s.type === 'speed')) speed *= 1.35;
            if (player.statuses.some(s => s.type === 'freeze')) speed *= 0.5;
            if (player.isShielding) {
              speed *= 0.65; // Shield guard movement speed
            }
            player.equipment.relics.forEach(r => {
              if (r.stats?.speed) speed += r.stats.speed;
            });

            const vx = (moveX / mag) * speed * 60 * dt;
            const vy = (moveY / mag) * speed * 60 * dt;

            if (isWalkable(floor.tiles, player.x + vx, player.y, player.radius)) {
              player.x += vx;
            }
            if (isWalkable(floor.tiles, player.x, player.y + vy, player.radius)) {
              player.y += vy;
            }
          }
        }

        // --- 3. FOV & Tile Updates ---
        updateFOV(floor.tiles, player.x, player.y);

        // --- 4. Interactables Check ---
        const pTileX = Math.floor(player.x / TILE_SIZE);
        const pTileY = Math.floor(player.y / TILE_SIZE);
        if (pTileY >= 0 && pTileY < floor.height && pTileX >= 0 && pTileX < floor.width) {
          const currentTile = floor.tiles[pTileY][pTileX];

          // Stairs down
          if (currentTile.type === 'stairs_down') {
            handleDescendFloor();
          }

          // Chest interaction
          if (currentTile.type === 'chest' && !currentTile.interacted) {
            currentTile.interacted = true;
            sound.playChestOpen();
            const loot = getRandomLootItem(floor.floorNumber);
            player.gold += 25 + Math.round(Math.random() * 20);

            if (loot.type === 'potion' && (loot.id.includes('health') || loot.id.includes('mana'))) {
              if (loot.id.includes('health')) player.quickPotions.health++;
              else player.quickPotions.mana++;
              floor.floatingTexts.push({
                id: `txt_chest_${Date.now()}`,
                x: player.x,
                y: player.y - 30,
                text: `FOUND: ${loot.name}! (+1 Quick Potion)`,
                color: '#fbbf24',
                size: 15,
                lifetime: 0,
                maxLifetime: 1.0,
              });
            } else {
              if (player.inventory.length < MAX_INVENTORY_CAPACITY) {
                player.inventory.push(loot);
                floor.floatingTexts.push({
                  id: `txt_chest_${Date.now()}`,
                  x: player.x,
                  y: player.y - 30,
                  text: `FOUND: ${loot.name}!`,
                  color: loot.rarity === 'mythic' ? '#fbbf24' : loot.rarity === 'epic' ? '#c084fc' : loot.rarity === 'rare' ? '#38bdf8' : '#94a3b8',
                  size: 15,
                  lifetime: 0,
                  maxLifetime: 1.0,
                });
              } else {
                // Drop on ground if bag is full
                floor.droppedItems.push({
                  id: `loot_chest_${Date.now()}`,
                  item: loot,
                  x: player.x,
                  y: player.y,
                });
                floor.floatingTexts.push({
                  id: `txt_chest_${Date.now()}`,
                  x: player.x,
                  y: player.y - 30,
                  text: `CHEST UNLOCKED! (Bag full - item dropped)`,
                  color: '#f59e0b',
                  size: 14,
                  lifetime: 0,
                  maxLifetime: 1.2,
                });
              }
            }
          }

          // Fountain interaction
          if (currentTile.type === 'fountain' && !currentTile.interacted) {
            currentTile.interacted = true;
            sound.playPotion();
            player.hp = player.maxHp;
            player.mana = player.maxMana;
            floor.floatingTexts.push({
              id: `txt_fount_${Date.now()}`,
              x: player.x,
              y: player.y - 30,
              text: 'HEALED & RESTORED!',
              color: '#38bdf8',
              size: 16,
              lifetime: 0,
              maxLifetime: 1.0,
            });
          }

          // Shrine interaction
          if (currentTile.type === 'shrine' && !currentTile.interacted) {
            currentTile.interacted = true;
            sound.playLevelUp();
            // Trigger 3 random God Boons
            const shuffled = [...GOD_BOONS].sort(() => 0.5 - Math.random());
            setAvailableBoons(shuffled.slice(0, 3));
            setScreen('boon_select');
          }
        }

        // --- 5. Dropped Items Pickup ---
        for (let i = floor.droppedItems.length - 1; i >= 0; i--) {
          const drop = floor.droppedItems[i];
          const dist = Math.hypot(drop.x - player.x, drop.y - player.y);
          if (dist <= 28) {
            if (drop.item.type === 'potion' && (drop.item.id.includes('health') || drop.item.id.includes('mana'))) {
              if (drop.item.id.includes('health')) player.quickPotions.health++;
              else player.quickPotions.mana++;
              sound.playPickup('common');
              floor.floatingTexts.push({
                id: `txt_pick_${Date.now()}`,
                x: player.x,
                y: player.y - 25,
                text: `+1 ${drop.item.name}`,
                color: '#38bdf8',
                size: 13,
                lifetime: 0,
                maxLifetime: 0.8,
              });
              floor.droppedItems.splice(i, 1);
            } else {
              // Check capacity limit
              if (player.inventory.length < MAX_INVENTORY_CAPACITY) {
                player.inventory.push(drop.item);
                sound.playPickup(drop.item.rarity);
                const color =
                  drop.item.rarity === 'mythic'
                    ? '#fbbf24'
                    : drop.item.rarity === 'epic'
                    ? '#c084fc'
                    : drop.item.rarity === 'rare'
                    ? '#38bdf8'
                    : '#94a3b8';
                floor.floatingTexts.push({
                  id: `txt_pick_${Date.now()}`,
                  x: player.x,
                  y: player.y - 25,
                  text: `+ ${drop.item.name}`,
                  color,
                  size: 14,
                  lifetime: 0,
                  maxLifetime: 0.9,
                });
                floor.droppedItems.splice(i, 1);
              } else {
                // Throttle warning message if standing over item while full
                const existingWarn = floor.floatingTexts.find(t => t.text.includes('BAG FULL'));
                if (!existingWarn) {
                  sound.playInventoryFull();
                  floor.floatingTexts.push({
                    id: `txt_full_${Date.now()}`,
                    x: player.x,
                    y: player.y - 30,
                    text: `BAG FULL! (${MAX_INVENTORY_CAPACITY}/${MAX_INVENTORY_CAPACITY})`,
                    color: '#ef4444',
                    size: 14,
                    lifetime: 0,
                    maxLifetime: 1.2,
                  });
                }
              }
            }
          }
        }

        // --- 6. Creature AI & Combat Loop ---
        updateCreatureAI(
          floor.creatures,
          player,
          floor.tiles,
          floor.projectiles,
          floor.telegraphs,
          floor.particles,
          floor.floatingTexts,
          dt
        );

        // Check Creature Defeats / EXP / Drops
        floor.creatures.forEach(c => {
          if (c.hp <= 0 && c.state !== 'hit') {
            c.state = 'hit';
            player.totalKills++;
            player.exp += c.expValue;
            player.gold += c.goldValue;

            if (c.tier === 'boss') {
              player.bossesSlain++;
              floor.bossDefeated = true;
              sound.playLevelUp();

              // Spawn Boss Exit Portal at Center
              floor.tiles[Math.floor(c.y / TILE_SIZE)][Math.floor(c.x / TILE_SIZE)] = {
                type: 'stairs_down',
                walkable: true,
                transparent: true,
                discovered: true,
                visible: true,
                variant: 0,
              };

              // Boss guarantees rare/epic/mythic loot drop
              const bossLoot = getRandomLootItem(floor.floorNumber + 2);
              floor.droppedItems.push({
                id: `loot_boss_${Date.now()}`,
                item: bossLoot,
                x: c.x,
                y: c.y,
              });
            } else if (c.tier === 'elite') {
              // Elite monsters have 70% chance to drop gear/potions
              if (Math.random() < 0.7) {
                const eliteLoot = getRandomLootItem(floor.floorNumber + 1);
                floor.droppedItems.push({
                  id: `loot_elite_${Date.now()}_${Math.random()}`,
                  item: eliteLoot,
                  x: c.x,
                  y: c.y,
                });
              }
            } else {
              // Regular monsters have 25% chance to drop potions or items
              if (Math.random() < 0.25) {
                const mobLoot = getRandomLootItem(floor.floorNumber);
                floor.droppedItems.push({
                  id: `loot_mob_${Date.now()}_${Math.random()}`,
                  item: mobLoot,
                  x: c.x,
                  y: c.y,
                });
              }
            }

            // Update Bestiary Kills
            setBestiary(prev =>
              prev.map(b =>
                b.name === c.name ? { ...b, kills: b.kills + 1, encountered: true } : b
              )
            );

            // Level Up Check
            if (player.exp >= player.expToNextLevel) {
              player.level++;
              player.exp -= player.expToNextLevel;
              player.expToNextLevel = Math.round(player.expToNextLevel * 1.5);
              player.maxHp += 20;
              player.hp = player.maxHp;
              player.maxMana += 15;
              player.mana = player.maxMana;
              player.stats.strength += 2;
              player.stats.arcane += 2;
              player.stats.dexterity += 2;
              player.stats.vitality += 2;

              sound.playLevelUp();
              const shuffled = [...GOD_BOONS].sort(() => 0.5 - Math.random());
              setAvailableBoons(shuffled.slice(0, 3));
              setScreen('boon_select');
            }
          }
        });

        // --- 7. Projectiles Update ---
        for (let i = floor.projectiles.length - 1; i >= 0; i--) {
          const p = floor.projectiles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.lifetime -= dt;

          const pTx = Math.floor(p.x / TILE_SIZE);
          const pTy = Math.floor(p.y / TILE_SIZE);

          // Wall collision
          if (
            pTx < 0 ||
            pTx >= floor.width ||
            pTy < 0 ||
            pTy >= floor.height ||
            !floor.tiles[pTy][pTx].walkable
          ) {
            floor.projectiles.splice(i, 1);
            continue;
          }

          // Player hit by enemy projectile
          if (p.source === 'enemy') {
            const dist = Math.hypot(p.x - player.x, p.y - player.y);
            if (dist <= p.radius + player.radius) {
              damagePlayer(player, p.damage, p.damageType, floor.floatingTexts, floor.particles);
              if (!player.isShielding && p.statusOnHit) {
                player.statuses.push({ ...p.statusOnHit });
              }
              floor.projectiles.splice(i, 1);
              continue;
            }
          }

          // Enemy hit by player projectile
          if (p.source === 'player') {
            for (const c of floor.creatures) {
              if (c.hp <= 0) continue;
              if (p.piercedIds && p.piercedIds.includes(c.id)) continue;

              const dist = Math.hypot(p.x - c.x, p.y - c.y);
              if (dist <= p.radius + c.radius) {
                damageCreature(c, p.damage, p.damageType, player, floor.floatingTexts, floor.particles);
                if (p.piercing) {
                  p.piercedIds?.push(c.id);
                } else {
                  floor.projectiles.splice(i, 1);
                  break;
                }
              }
            }
          }

          if (p.lifetime <= 0) {
            floor.projectiles.splice(i, 1);
          }
        }

        // --- 8. Particles & Floating Texts Update ---
        for (let i = floor.particles.length - 1; i >= 0; i--) {
          const pt = floor.particles[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.lifetime += dt;
          if (pt.lifetime >= pt.maxLifetime) {
            floor.particles.splice(i, 1);
          }
        }

        for (let i = floor.floatingTexts.length - 1; i >= 0; i--) {
          const ft = floor.floatingTexts[i];
          ft.lifetime += dt;
          if (ft.lifetime >= ft.maxLifetime) {
            floor.floatingTexts.splice(i, 1);
          }
        }

        // --- 9. Check Player Death ---
        if (player.hp <= 0) {
          sound.playGameOver();
          sound.stopDungeonAmbience();
          setScreen('game_over');
        }

        // --- 10. Render to Canvas ---
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const camera = {
            x: player.x - canvas.width / 2,
            y: player.y - canvas.height / 2,
          };
          renderGame(ctx, canvas.width, canvas.height, floor, player, camera, screenShakeRef.current);
        }

        // Trigger React HUD update
        setTick(prev => (prev + 1) % 60);
      }

      reqAnimFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    reqAnimFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqAnimFrameRef.current) {
        cancelAnimationFrame(reqAnimFrameRef.current);
      }
    };
  }, [screen, handleDescendFloor]);

  // Canvas Resize Observer
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      handlePrimaryAttack();
    } else if (e.button === 2) {
      e.preventDefault();
      handleCastSkill1();
    }
  };

  return (
    <main id="game-app-root" className="relative w-screen h-screen overflow-hidden bg-[#050508] select-none font-sans">
      {/* Game Canvas */}
      <canvas
        id="dungeon-canvas"
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onContextMenu={e => e.preventDefault()}
        className="block w-full h-full cursor-crosshair"
      />

      {/* In-Game HUD & Minimap */}
      {screen === 'playing' && playerRef.current && floorRef.current && (
        <>
          <HUD
            player={playerRef.current}
            floor={floorRef.current}
            isMuted={isMuted}
            onToggleMute={() => {
              const muted = sound.toggleMute();
              setIsMuted(muted);
            }}
            onOpenInventory={() => setIsInventoryOpen(true)}
            onOpenBestiary={() => setIsBestiaryOpen(true)}
            onUseHealthPotion={handleUseHealthPotion}
            onUseManaPotion={handleUseManaPotion}
            onAttack={handlePrimaryAttack}
            onShield={handleShield}
            onDash={handleDash}
            onSkill1={handleCastSkill1}
            onSkill2={handleCastSkill2}
            onUltimate={handleCastUltimate}
          />
          <Minimap floor={floorRef.current} player={playerRef.current} />
          <TouchControls
            onMove={(dx, dy) => {
              touchMoveVector.current = { x: dx, y: dy };
            }}
            onAttack={handlePrimaryAttack}
            onShield={handleShield}
            onSkill1={handleCastSkill1}
            onSkill2={handleCastSkill2}
            onUltimate={handleCastUltimate}
            onDash={handleDash}
          />
        </>
      )}

      {/* Screen Modals & Overlays */}
      {screen === 'hero_select' && (
        <HeroSelect onStartGame={handleStartGame} />
      )}

      {playerRef.current && (
        <InventoryModal
          player={playerRef.current}
          isOpen={isInventoryOpen}
          onClose={() => setIsInventoryOpen(false)}
          onEquipItem={handleEquipItem}
          onUnequipItem={handleUnequipItem}
          onUseItem={handleUseItem}
          onDropItem={handleDropItem}
          onSalvageItem={handleSalvageItem}
          onSortInventory={handleSortInventory}
          onAssignQuickSlot={handleAssignQuickSlot}
        />
      )}

      <BoonModal
        boons={availableBoons}
        isOpen={screen === 'boon_select'}
        onSelectBoon={handleSelectBoon}
      />

      <BestiaryModal
        entries={bestiary}
        isOpen={isBestiaryOpen}
        onClose={() => setIsBestiaryOpen(false)}
      />

      {screen === 'game_over' && playerRef.current && floorRef.current && (
        <GameOverModal
          player={playerRef.current}
          floor={floorRef.current}
          onRestart={() => handleStartGame(playerRef.current?.classType || 'warrior')}
          onChangeHero={() => setScreen('hero_select')}
        />
      )}

      {screen === 'victory' && playerRef.current && floorRef.current && (
        <VictoryModal
          player={playerRef.current}
          floor={floorRef.current}
          onRestart={() => handleStartGame(playerRef.current?.classType || 'warrior')}
          onChangeHero={() => setScreen('hero_select')}
          onContinueEndless={() => {
            setScreen('playing');
            handleDescendFloor();
          }}
        />
      )}
    </main>
  );
}
