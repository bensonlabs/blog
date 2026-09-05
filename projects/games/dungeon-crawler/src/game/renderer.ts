import {
  DungeonFloor,
  Player,
  Tile,
  Projectile,
  Particle,
  FloatingText,
  TelegraphArea,
  Creature,
} from '../types/game';
import { TILE_SIZE } from './dungeonGenerator';

export function renderGame(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  floor: DungeonFloor,
  player: Player,
  camera: { x: number; y: number },
  screenShake: { x: number; y: number }
) {
  if (!ctx || !floor || !player || !floor.tiles || floor.tiles.length === 0 || !floor.tiles[0]) {
    return;
  }

  ctx.save();
  ctx.clearRect(0, 0, canvasW, canvasH);

  // Background darkness
  ctx.fillStyle = '#090a0f';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Apply Camera translation + Screen Shake
  const shakeX = screenShake?.x || 0;
  const shakeY = screenShake?.y || 0;
  ctx.translate(-camera.x + shakeX, -camera.y + shakeY);

  // 1. Render Visible & Discovered Tiles
  renderTiles(ctx, floor.tiles, floor.theme, canvasW, canvasH, camera);

  // 2. Render Dropped Items
  if (floor.droppedItems) renderDroppedItems(ctx, floor.droppedItems, player);

  // 3. Render Telegraph Areas (Boss & Monster warnings)
  if (floor.telegraphs) renderTelegraphs(ctx, floor.telegraphs);

  // 4. Render Creatures
  if (floor.creatures) renderCreatures(ctx, floor.creatures);

  // 5. Render Player
  renderPlayer(ctx, player);

  // 6. Render Projectiles
  if (floor.projectiles) renderProjectiles(ctx, floor.projectiles);

  // 7. Render Particles
  if (floor.particles) renderParticles(ctx, floor.particles);

  // 8. Dynamic Lighting & Fog-of-War darkness mask
  renderFogAndLighting(ctx, floor.tiles, player, floor.ambientLight || 0.4, canvasW, canvasH, camera);

  // 9. Floating Combat Text (above fog for maximum legibility)
  if (floor.floatingTexts) renderFloatingTexts(ctx, floor.floatingTexts);

  ctx.restore();
}

function renderTiles(
  ctx: CanvasRenderingContext2D,
  tiles: Tile[][],
  theme: DungeonFloor['theme'],
  canvasW: number,
  canvasH: number,
  camera: { x: number; y: number }
) {
  if (!tiles || tiles.length === 0 || !tiles[0]) return;
  const mapH = tiles.length;
  const mapW = tiles[0].length;

  const minTileX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
  const maxTileX = Math.min(mapW - 1, Math.ceil((camera.x + canvasW) / TILE_SIZE) + 1);
  const minTileY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
  const maxTileY = Math.min(mapH - 1, Math.ceil((camera.y + canvasH) / TILE_SIZE) + 1);

  // Theme color palettes
  const themeColors = {
    crypt: { wall: '#1e293b', floor: '#0f172a', floorLine: '#1e293b', accent: '#38bdf8' },
    labyrinths: { wall: '#334155', floor: '#1e293b', floorLine: '#475569', accent: '#f59e0b' },
    gorgon_cave: { wall: '#064e3b', floor: '#022c22', floorLine: '#065f46', accent: '#10b981' },
    tartarus_abyss: { wall: '#450a0a', floor: '#1c1917', floorLine: '#7f1d1d', accent: '#f97316' },
    olympus_sanctum: { wall: '#78350f', floor: '#1e1b4b', floorLine: '#b45309', accent: '#fbbf24' },
  }[theme];

  for (let y = minTileY; y <= maxTileY; y++) {
    for (let x = minTileX; x <= maxTileX; x++) {
      const tile = tiles[y][x];
      if (!tile.discovered) continue;

      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (tile.type === 'wall') {
        ctx.fillStyle = themeColors.wall;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        // Wall 3D top bevel
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(px, py, TILE_SIZE, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(px, py + TILE_SIZE - 4, TILE_SIZE, 4);

        // Wall stone brick lines
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      } else if (tile.type === 'pillar') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        // Circular pillar
        ctx.fillStyle = themeColors.wall;
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = themeColors.accent;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Floor tile
        ctx.fillStyle = themeColors.floor;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Subtle grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        // Tile decorations
        if (tile.decoration === 'bones') {
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(px + 12, py + 14, 2, 0, Math.PI * 2);
          ctx.arc(px + 22, py + 18, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile.decoration === 'moss') {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
          ctx.fillRect(px + 8, py + 8, 14, 10);
        }

        // Special floor elements
        if (tile.type === 'stairs_down') {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 9, 0, Math.PI * 2);
          ctx.fill();
          // Portal spiral
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 6, 0, Math.PI * 1.5);
          ctx.stroke();
        } else if (tile.type === 'stairs_up') {
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 12, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile.type === 'chest') {
          ctx.fillStyle = tile.interacted ? '#64748b' : '#d97706';
          ctx.fillRect(px + 8, py + 10, 24, 18);
          ctx.fillStyle = tile.interacted ? '#475569' : '#fef08a';
          ctx.fillRect(px + 18, py + 16, 4, 6);
        } else if (tile.type === 'fountain') {
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile.type === 'shrine') {
          ctx.fillStyle = '#8b5cf6';
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#e9d5ff';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
        }
      }

      // Torches
      if (tile.decoration === 'torch') {
        const time = Date.now() * 0.005;
        const flameOffset = Math.sin(time + x * 7) * 2;
        ctx.fillStyle = '#92400e';
        ctx.fillRect(px + TILE_SIZE / 2 - 2, py + 6, 4, 10);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + 6 + flameOffset, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + 5 + flameOffset, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function renderDroppedItems(
  ctx: CanvasRenderingContext2D,
  items: DungeonFloor['droppedItems'],
  player?: Player
) {
  const time = Date.now() * 0.004;

  items.forEach(d => {
    const bob = Math.sin(time * 1.5 + d.x * 0.1) * 4;
    const color =
      d.item.rarity === 'mythic'
        ? '#fbbf24'
        : d.item.rarity === 'epic'
        ? '#c084fc'
        : d.item.rarity === 'rare'
        ? '#38bdf8'
        : '#94a3b8';

    // Vertical Pillar/Beam of Light for Epic & Mythic drops
    if (d.item.rarity === 'mythic' || d.item.rarity === 'epic') {
      const grad = ctx.createLinearGradient(d.x, d.y + bob, d.x, d.y + bob - 70);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.globalAlpha = d.item.rarity === 'mythic' ? 0.35 : 0.2;
      ctx.fillRect(d.x - 3, d.y + bob - 70, 6, 70);
      ctx.globalAlpha = 1.0;
    }

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(d.x, d.y + 10, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer Aura Pulse
    const pulse = Math.sin(time * 2 + d.y) * 2;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(d.x, d.y + bob, 16 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Item Crystal Icon (Diamond Shape)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y + bob - 8);
    ctx.lineTo(d.x + 7, d.y + bob);
    ctx.lineTo(d.x, d.y + bob + 8);
    ctx.lineTo(d.x - 7, d.y + bob);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Proximity Loot Label (If hero is within 110px)
    if (player) {
      const dist = Math.hypot(player.x - d.x, player.y - d.y);
      if (dist <= 110) {
        ctx.save();
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const labelText = `${d.item.name}`;
        const textMetrics = ctx.measureText(labelText);
        const padding = 6;
        const boxW = textMetrics.width + padding * 2;
        const boxH = 18;
        const boxX = d.x - boxW / 2;
        const boxY = d.y + bob - 28;

        // Label Background
        ctx.fillStyle = 'rgba(12, 12, 20, 0.92)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Label Text
        ctx.fillStyle = color;
        ctx.fillText(labelText, d.x, boxY + boxH / 2);
        ctx.restore();
      }
    }
  });
}

function renderTelegraphs(ctx: CanvasRenderingContext2D, telegraphs: TelegraphArea[]) {
  telegraphs.forEach(t => {
    ctx.save();
    if (t.type === 'circle' && t.radius) {
      // Danger Circle
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius * t.progress, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (t.type === 'line' && t.length && t.width && t.angle !== undefined) {
      // Danger Rect Line
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);

      ctx.fillStyle = t.color;
      ctx.fillRect(0, -t.width / 2, t.length * t.progress, t.width);

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, -t.width / 2, t.length, t.width);
    } else if (t.type === 'cone' && t.radius && t.angle !== undefined && t.spreadAngle) {
      // Danger Cone
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.arc(t.x, t.y, t.radius * t.progress, t.angle - t.spreadAngle / 2, t.angle + t.spreadAngle / 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.arc(t.x, t.y, t.radius, t.angle - t.spreadAngle / 2, t.angle + t.spreadAngle / 2);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  });
}

function renderCreatures(ctx: CanvasRenderingContext2D, creatures: Creature[]) {
  creatures.forEach(c => {
    if (c.hp <= 0) return;

    ctx.save();
    ctx.translate(c.x, c.y);

    // Creature body circle
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
    ctx.fill();

    // Tier outline
    ctx.strokeStyle = c.tier === 'boss' ? '#fbbf24' : c.tier === 'elite' ? '#a855f7' : c.accentColor;
    ctx.lineWidth = c.tier === 'boss' ? 3.5 : 2;
    ctx.stroke();

    // Eyes / Facing orientation
    const eyeOffset = c.radius * 0.55;
    const eyeAngle1 = c.facingAngle - 0.5;
    const eyeAngle2 = c.facingAngle + 0.5;

    ctx.fillStyle = c.tier === 'boss' ? '#fef08a' : '#ffffff';
    ctx.beginPath();
    ctx.arc(Math.cos(eyeAngle1) * eyeOffset, Math.sin(eyeAngle1) * eyeOffset, 3, 0, Math.PI * 2);
    ctx.arc(Math.cos(eyeAngle2) * eyeOffset, Math.sin(eyeAngle2) * eyeOffset, 3, 0, Math.PI * 2);
    ctx.fill();

    // Multi-heads if Hydra / Cerberus
    if (c.heads && c.heads > 1) {
      for (let h = 1; h < c.heads; h++) {
        const hAngle = c.facingAngle + (h % 2 === 0 ? 0.7 : -0.7) * (h * 0.5);
        const hx = Math.cos(hAngle) * (c.radius * 0.8);
        const hy = Math.sin(hAngle) * (c.radius * 0.8);
        ctx.fillStyle = c.accentColor;
        ctx.beginPath();
        ctx.arc(hx, hy, c.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // Health Bar above creature
    const barW = Math.max(34, c.radius * 2 + 10);
    const barH = c.tier === 'boss' ? 7 : 4;
    const barX = c.x - barW / 2;
    const barY = c.y - c.radius - (c.tier === 'boss' ? 18 : 12);
    const hpRatio = Math.max(0, c.hp / c.maxHp);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    ctx.fillStyle = c.tier === 'boss' ? '#ef4444' : '#22c55e';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    // Boss Name text
    if (c.tier === 'boss') {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.name, c.x, barY - 5);
    }
  });
}

function renderPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  ctx.save();
  ctx.translate(player.x, player.y);

  // Dash ghosting aura
  if (player.isDashing) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, player.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Active Shield Guard Aegis Barrier (S key)
  if (player.isShielding) {
    const time = Date.now() * 0.005;
    const pulse = Math.sin(time * 4) * 2;

    // Outer Celestial Energy Bubble
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 12 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 12 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Heavy Aegis Golden Shield Arc in front of facing direction
    const sAngle = player.facingAngle;
    const sArc = Math.PI * 0.75; // 135 deg arc
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 9, sAngle - sArc / 2, sAngle + sArc / 2);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Front Shield Crest
    const crestX = Math.cos(sAngle) * (player.radius + 9);
    const crestY = Math.sin(sAngle) * (player.radius + 9);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(crestX, crestY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player body
  const heroColor = player.classType === 'warrior' ? '#ef4444' : player.classType === 'mage' ? '#8b5cf6' : '#10b981';
  ctx.fillStyle = heroColor;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Weapon / Facing Indicator
  const wDist = player.radius + 6;
  const wx = Math.cos(player.facingAngle) * wDist;
  const wy = Math.sin(player.facingAngle) * wDist;

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(wx, wy, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
  projectiles.forEach(p => {
    ctx.save();
    // Glowing trail
    ctx.fillStyle = p.trailColor;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(p.x - p.vx * 1.5, p.y - p.vy * 1.5, p.radius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Core projectile
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  });
}

function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha * (1 - p.lifetime / p.maxLifetime));
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function renderFogAndLighting(
  ctx: CanvasRenderingContext2D,
  tiles: Tile[][],
  player: Player,
  ambientLight: number,
  canvasW: number,
  canvasH: number,
  camera: { x: number; y: number }
) {
  if (!tiles || tiles.length === 0 || !tiles[0]) return;
  const mapH = tiles.length;
  const mapW = tiles[0].length;

  const minTileX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
  const maxTileX = Math.min(mapW - 1, Math.ceil((camera.x + canvasW) / TILE_SIZE) + 1);
  const minTileY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
  const maxTileY = Math.min(mapH - 1, Math.ceil((camera.y + canvasH) / TILE_SIZE) + 1);

  const shadowAlpha = Math.max(0.45, Math.min(0.85, 0.78 - ambientLight * 0.4));

  // Apply fog of war tiles
  for (let y = minTileY; y <= maxTileY; y++) {
    for (let x = minTileX; x <= maxTileX; x++) {
      const tile = tiles[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (!tile.discovered) {
        // Pitch Black
        ctx.fillStyle = '#050609';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      } else if (!tile.visible) {
        // Previously Discovered Shadow
        ctx.fillStyle = `rgba(5, 6, 9, ${shadowAlpha})`;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // Player light aura vignette
  const pGrad = ctx.createRadialGradient(player.x, player.y, 20, player.x, player.y, 260);
  pGrad.addColorStop(0, 'rgba(254, 240, 138, 0.08)');
  pGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
  pGrad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  ctx.fillStyle = pGrad;
  ctx.fillRect(player.x - 260, player.y - 260, 520, 520);
}

function renderFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  texts.forEach(t => {
    ctx.save();
    const progress = t.lifetime / t.maxLifetime;
    const currentY = t.y - progress * 24;
    const alpha = 1 - progress;

    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = t.color;
    ctx.font = t.isCritical ? `bold ${t.size}px sans-serif` : `${t.size}px sans-serif`;
    ctx.textAlign = 'center';
    
    // Stroke outline for contrast
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(t.text, t.x, currentY);
    ctx.fillText(t.text, t.x, currentY);
    ctx.restore();
  });
}
