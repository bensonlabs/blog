import {
  Player,
  Creature,
  Projectile,
  Particle,
  FloatingText,
  TelegraphArea,
  Tile,
  DamageType,
} from '../types/game';
import { TILE_SIZE } from './dungeonGenerator';
import { sound } from './audio';
import { HERO_CLASSES } from './classes';

export function isWalkable(tiles: Tile[][], x: number, y: number, radius: number = 10): boolean {
  const points = [
    { x: x - radius, y: y - radius },
    { x: x + radius, y: y - radius },
    { x: x - radius, y: y + radius },
    { x: x + radius, y: y + radius },
  ];

  const mapH = tiles.length;
  const mapW = tiles[0].length;

  for (const pt of points) {
    const tx = Math.floor(pt.x / TILE_SIZE);
    const ty = Math.floor(pt.y / TILE_SIZE);

    if (tx < 0 || tx >= mapW || ty < 0 || ty >= mapH) return false;
    const tile = tiles[ty][tx];
    if (!tile.walkable) return false;
  }
  return true;
}

export function updateCreatureAI(
  creatures: Creature[],
  player: Player,
  tiles: Tile[][],
  projectiles: Projectile[],
  telegraphs: TelegraphArea[],
  particles: Particle[],
  floatingTexts: FloatingText[],
  dt: number
) {
  for (const creature of creatures) {
    if (creature.hp <= 0) continue;

    // Update statuses
    for (let i = creature.statuses.length - 1; i >= 0; i--) {
      const st = creature.statuses[i];
      st.duration -= dt;
      if (st.type === 'poison' || st.type === 'burn' || st.type === 'bleed') {
        const tickDmg = Math.round(st.value * dt);
        if (tickDmg > 0) {
          creature.hp -= tickDmg;
          if (Math.random() < 0.1) {
            floatingTexts.push({
              id: `dmg_${Date.now()}_${Math.random()}`,
              x: creature.x + (Math.random() * 20 - 10),
              y: creature.y - 20,
              text: `${tickDmg}`,
              color: st.type === 'poison' ? '#22c55e' : st.type === 'burn' ? '#f97316' : '#ef4444',
              size: 13,
              lifetime: 0,
              maxLifetime: 0.6,
            });
          }
        }
      }
      if (st.duration <= 0) {
        creature.statuses.splice(i, 1);
      }
    }

    const isStunned = creature.statuses.some(s => s.type === 'stun' || s.type === 'stone' || s.type === 'freeze');
    if (isStunned) {
      creature.state = 'stunned';
      continue;
    }

    const dx = player.x - creature.x;
    const dy = player.y - creature.y;
    const distToPlayer = Math.sqrt(dx * dy + dy * dy) || Math.hypot(dx, dy);
    const angleToPlayer = Math.atan2(dy, dx);
    creature.facingAngle = angleToPlayer;

    // Detection range: bosses detect whole room, minions detect ~300px or when damaged
    const detectionRange = creature.tier === 'boss' ? 700 : 320;
    if (distToPlayer < detectionRange || creature.targetPlayer) {
      creature.targetPlayer = true;
    }

    if (!creature.targetPlayer) continue;

    // Ability cooldowns & execution
    for (const ability of creature.abilities) {
      ability.currentCooldown = Math.max(0, ability.currentCooldown - dt);

      // Trigger ability cast
      if (ability.currentCooldown <= 0 && !creature.state.includes('casting') && !creature.state.includes('charging') && distToPlayer <= ability.range) {
        ability.isCasting = true;
        ability.castProgress = 0;
        ability.targetPos = { x: player.x, y: player.y };
        ability.targetAngle = angleToPlayer;
        creature.state = 'casting';
        sound.playMonsterRoar(creature.tier);

        // Add Telegraph visual warning
        if (ability.type === 'charge') {
          telegraphs.push({
            id: `tel_${creature.id}_charge`,
            type: 'line',
            x: creature.x,
            y: creature.y,
            length: ability.range,
            width: creature.radius * 2 + 10,
            angle: angleToPlayer,
            progress: 0,
            color: 'rgba(239, 68, 68, 0.45)',
            label: `${creature.name} CHARGE!`,
          });
        } else if (ability.type === 'stomp') {
          telegraphs.push({
            id: `tel_${creature.id}_stomp`,
            type: 'circle',
            x: creature.x,
            y: creature.y,
            radius: ability.range,
            progress: 0,
            color: 'rgba(239, 68, 68, 0.45)',
            label: 'SLAM WARNING!',
          });
        } else if (ability.type === 'petrify_beam') {
          telegraphs.push({
            id: `tel_${creature.id}_gaze`,
            type: 'cone',
            x: creature.x,
            y: creature.y,
            radius: ability.range,
            angle: angleToPlayer,
            spreadAngle: 0.8,
            progress: 0,
            color: 'rgba(16, 185, 129, 0.45)',
            label: 'PETRIFYING GAZE - TURN AWAY!',
          });
        } else if (ability.type === 'fire_breath') {
          telegraphs.push({
            id: `tel_${creature.id}_breath`,
            type: 'cone',
            x: creature.x,
            y: creature.y,
            radius: ability.range,
            angle: angleToPlayer,
            spreadAngle: 1.1,
            progress: 0,
            color: 'rgba(249, 115, 22, 0.45)',
            label: 'INFERNAL FLAME!',
          });
        }
      }

      // Handle ongoing casting
      if (ability.isCasting) {
        ability.castProgress += dt / ability.castTime;
        
        // Update telegraph progress
        const tel = telegraphs.find(t => t.id.startsWith(`tel_${creature.id}`));
        if (tel) {
          tel.progress = Math.min(1, ability.castProgress);
        }

        if (ability.castProgress >= 1.0) {
          // Cast Complete! Unleash attack!
          ability.isCasting = false;
          ability.currentCooldown = ability.cooldown;
          creature.state = 'chase';

          // Remove telegraph
          const telIdx = telegraphs.findIndex(t => t.id.startsWith(`tel_${creature.id}`));
          if (telIdx !== -1) telegraphs.splice(telIdx, 1);

          // Ability execution effects
          if (ability.type === 'charge') {
            const chargeSpeed = 8.5;
            creature.state = 'charging';
            creature.stateTimer = 0.5;
            creature.chargeVelocity = {
              vx: Math.cos(ability.targetAngle || 0) * chargeSpeed,
              vy: Math.sin(ability.targetAngle || 0) * chargeSpeed,
            };
          } else if (ability.type === 'stomp') {
            sound.playHit();
            // AOE stomp check
            const dist = Math.hypot(player.x - creature.x, player.y - creature.y);
            if (dist <= ability.range && !player.isDashing) {
              damagePlayer(player, Math.round(creature.damage * 1.4), 'physical', floatingTexts, particles);
            }
            // Stomp particles
            for (let p = 0; p < 24; p++) {
              const pAngle = (p / 24) * Math.PI * 2;
              particles.push({
                x: creature.x,
                y: creature.y,
                vx: Math.cos(pAngle) * (3 + Math.random() * 4),
                vy: Math.sin(pAngle) * (3 + Math.random() * 4),
                size: 4 + Math.random() * 4,
                color: creature.accentColor,
                alpha: 1,
                lifetime: 0,
                maxLifetime: 0.5,
                shape: 'smoke',
              });
            }
          } else if (ability.type === 'petrify_beam') {
            sound.playSpellCast('arcane');
            // Check if player is in cone and facing Medusa
            const playerDist = Math.hypot(player.x - creature.x, player.y - creature.y);
            const angleDiff = Math.abs(normalizeAngle(Math.atan2(player.y - creature.y, player.x - creature.x) - (ability.targetAngle || 0)));
            
            if (playerDist <= ability.range && angleDiff < 0.5 && !player.isDashing) {
              // Player hit by Medusa gaze!
              damagePlayer(player, Math.round(creature.damage * 1.2), 'arcane', floatingTexts, particles);
              player.statuses.push({
                type: 'stone',
                duration: 2.0,
                value: 0,
                source: 'enemy',
              });
              floatingTexts.push({
                id: `txt_${Date.now()}`,
                x: player.x,
                y: player.y - 30,
                text: 'TURNED TO STONE!',
                color: '#10b981',
                size: 16,
                lifetime: 0,
                maxLifetime: 1.0,
                isCritical: true,
              });
            }
          } else if (ability.type === 'fire_breath') {
            sound.playSpellCast('fire');
            // Launch 5 fire projectile spread
            for (let f = -2; f <= 2; f++) {
              const pAngle = (ability.targetAngle || 0) + f * 0.18;
              projectiles.push({
                id: `proj_fire_${Date.now()}_${f}`,
                source: 'enemy',
                x: creature.x,
                y: creature.y,
                vx: Math.cos(pAngle) * 5.0,
                vy: Math.sin(pAngle) * 5.0,
                radius: 8,
                damage: Math.round(creature.damage * 0.9),
                damageType: 'fire',
                color: '#f97316',
                trailColor: '#ea580c',
                lifetime: 1.8,
                statusOnHit: { type: 'burn', duration: 3, value: 8, source: 'enemy' },
              });
            }
          } else if (ability.type === 'poison_spit') {
            sound.playSpellCast('arcane');
            // Spit poison projectile
            projectiles.push({
              id: `proj_poison_${Date.now()}`,
              source: 'enemy',
              x: creature.x,
              y: creature.y,
              vx: Math.cos(ability.targetAngle || 0) * 4.5,
              vy: Math.sin(ability.targetAngle || 0) * 4.5,
              radius: 7,
              damage: Math.round(creature.damage * 0.8),
              damageType: 'poison',
              color: '#22c55e',
              trailColor: '#15803d',
              lifetime: 2.0,
              statusOnHit: { type: 'poison', duration: 4, value: 6, source: 'enemy' },
            });
          } else if (ability.type === 'leap') {
            sound.playMonsterRoar(creature.tier);
            creature.x = (ability.targetPos?.x || creature.x);
            creature.y = (ability.targetPos?.y || creature.y);
            damagePlayer(player, creature.damage, 'physical', floatingTexts, particles);
          }
        }
      }
    }

    // Charging state movement
    if (creature.state === 'charging' && creature.chargeVelocity) {
      const nextX = creature.x + creature.chargeVelocity.vx;
      const nextY = creature.y + creature.chargeVelocity.vy;

      if (isWalkable(tiles, nextX, nextY, creature.radius)) {
        creature.x = nextX;
        creature.y = nextY;

        // Check player collision during charge
        const d = Math.hypot(player.x - creature.x, player.y - creature.y);
        if (d < creature.radius + player.radius && !player.isDashing) {
          damagePlayer(player, Math.round(creature.damage * 1.5), 'physical', floatingTexts, particles);
          player.x += creature.chargeVelocity.vx * 3;
          player.y += creature.chargeVelocity.vy * 3;
        }
      } else {
        // Slammed into wall! Stun creature!
        creature.state = 'stunned';
        creature.statuses.push({
          type: 'stun',
          duration: 1.5,
          value: 0,
          source: 'enemy',
        });
        sound.playHit();
      }

      creature.stateTimer -= dt;
      if (creature.stateTimer <= 0) {
        creature.state = 'chase';
        creature.chargeVelocity = undefined;
      }
      continue;
    }

    // Normal Chasing & Movement
    if (creature.state === 'chase' || creature.state === 'idle') {
      const moveSpeed = creature.speed * (creature.statuses.some(s => s.type === 'freeze') ? 0.4 : 1);
      const minDesiredDist = creature.abilities.some(a => a.type === 'poison_spit') ? 140 : creature.radius + player.radius;

      if (distToPlayer > minDesiredDist) {
        const vx = (dx / distToPlayer) * moveSpeed;
        const vy = (dy / distToPlayer) * moveSpeed;

        if (isWalkable(tiles, creature.x + vx, creature.y, creature.radius)) {
          creature.x += vx;
        }
        if (isWalkable(tiles, creature.x, creature.y + vy, creature.radius)) {
          creature.y += vy;
        }
      }

      // Basic melee hit if touching player
      if (distToPlayer <= creature.radius + player.radius + 6 && !player.isDashing) {
        creature.stateTimer -= dt;
        if (creature.stateTimer <= 0) {
          damagePlayer(player, creature.damage, 'physical', floatingTexts, particles);
          creature.stateTimer = 1.0; // 1s attack speed
          sound.playHit();
        }
      }
    }
  }
}

export function damagePlayer(
  player: Player,
  amount: number,
  damageType: DamageType,
  floatingTexts: FloatingText[],
  particles?: Particle[]
) {
  if (player.isDashing) return; // i-frames during dash

  // Shield Guard Defense Check (S key active)
  if (player.isShielding) {
    player.stamina = Math.max(0, player.stamina - 12);
    sound.playShieldBlock();

    floatingTexts.push({
      id: `block_${Date.now()}_${Math.random()}`,
      x: player.x + (Math.random() * 16 - 8),
      y: player.y - 28,
      text: '🛡️ BLOCKED!',
      color: '#38bdf8',
      size: 16,
      lifetime: 0,
      maxLifetime: 0.7,
      isCritical: true,
    });

    if (particles) {
      for (let p = 0; p < 8; p++) {
        const pAngle = player.facingAngle + (Math.random() - 0.5) * 1.5;
        particles.push({
          x: player.x + Math.cos(player.facingAngle) * 18,
          y: player.y + Math.sin(player.facingAngle) * 18,
          vx: Math.cos(pAngle) * 3.5,
          vy: Math.sin(pAngle) * 3.5,
          size: 3.5,
          color: '#38bdf8',
          alpha: 1,
          lifetime: 0,
          maxLifetime: 0.3,
          shape: 'spark',
        });
      }
    }
    return; // Complete shield block
  }

  // Check defensive buffs & stats
  let totalDef = HERO_CLASSES[player.classType].baseDefense + (player.stats.vitality * 1.5);
  if (player.equipment.armor?.stats?.defense) {
    totalDef += player.equipment.armor.stats.defense;
  }
  player.equipment.relics.forEach(r => {
    if (r.stats?.defense) totalDef += r.stats.defense;
  });

  const effectiveDmg = Math.max(3, Math.round(amount * (100 / (100 + totalDef * 2.5))));
  player.hp = Math.max(0, player.hp - effectiveDmg);
  player.damageTaken += effectiveDmg;

  const damageColors: Record<DamageType, string> = {
    physical: '#ef4444',
    fire: '#f97316',
    frost: '#38bdf8',
    poison: '#22c55e',
    arcane: '#c084fc',
    lightning: '#eab308',
  };

  floatingTexts.push({
    id: `pdmg_${Date.now()}_${Math.random()}`,
    x: player.x + (Math.random() * 20 - 10),
    y: player.y - 25,
    text: `-${effectiveDmg}`,
    color: damageColors[damageType] || '#ef4444',
    size: 17,
    lifetime: 0,
    maxLifetime: 0.8,
    isCritical: true,
  });

  sound.playHit();
}

export function damageCreature(
  creature: Creature,
  rawDamage: number,
  damageType: DamageType,
  player: Player,
  floatingTexts: FloatingText[],
  particles: Particle[],
  isCrit: boolean = false
): boolean {
  const effectiveDef = creature.defense;
  const netDmg = Math.max(2, Math.round(rawDamage * (100 / (100 + effectiveDef * 2))));

  creature.hp -= netDmg;
  creature.targetPlayer = true;
  player.damageDealt += netDmg;

  // Lifesteal check
  let lifesteal = 0;
  if (player.equipment.weapon?.stats?.lifesteal) lifesteal += player.equipment.weapon.stats.lifesteal;
  player.equipment.relics.forEach(r => {
    if (r.stats?.lifesteal) lifesteal += r.stats.lifesteal;
  });
  if (lifesteal > 0) {
    const healAmount = Math.round(netDmg * lifesteal);
    if (healAmount > 0) {
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
    }
  }

  // Floating text
  floatingTexts.push({
    id: `cdmg_${Date.now()}_${Math.random()}`,
    x: creature.x + (Math.random() * 24 - 12),
    y: creature.y - 20,
    text: isCrit ? `CRIT ${netDmg}!` : `${netDmg}`,
    color: isCrit ? '#facc15' : damageType === 'fire' ? '#fb923c' : damageType === 'frost' ? '#38bdf8' : '#ffffff',
    size: isCrit ? 19 : 14,
    lifetime: 0,
    maxLifetime: 0.75,
    isCritical: isCrit,
  });

  if (isCrit) {
    sound.playCritHit();
  } else {
    sound.playHit();
  }

  // Blood/spark particles
  const particleColor = damageType === 'fire' ? '#f97316' : damageType === 'frost' ? '#38bdf8' : creature.accentColor;
  for (let i = 0; i < (isCrit ? 12 : 6); i++) {
    const pAngle = Math.random() * Math.PI * 2;
    particles.push({
      x: creature.x,
      y: creature.y,
      vx: Math.cos(pAngle) * (2 + Math.random() * 3),
      vy: Math.sin(pAngle) * (2 + Math.random() * 3),
      size: 3 + Math.random() * 3,
      color: particleColor,
      alpha: 1,
      lifetime: 0,
      maxLifetime: 0.4,
      shape: 'blood',
    });
  }

  return creature.hp <= 0;
}

function normalizeAngle(a: number): number {
  let res = a % (Math.PI * 2);
  if (res < 0) res += Math.PI * 2;
  return res;
}
