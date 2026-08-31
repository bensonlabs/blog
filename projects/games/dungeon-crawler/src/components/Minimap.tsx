import React, { useRef, useEffect } from 'react';
import { DungeonFloor, Player } from '../types/game';
import { TILE_SIZE } from '../game/dungeonGenerator';
import { Compass } from 'lucide-react';

interface MinimapProps {
  floor: DungeonFloor;
  player: Player;
}

export const Minimap: React.FC<MinimapProps> = ({ floor, player }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mapW = floor.width;
    const mapH = floor.height;
    const tileW = canvas.width / mapW;
    const tileH = canvas.height / mapH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background obsidian
    ctx.fillStyle = '#08080c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw discovered tiles with stone colors
    for (let y = 0; y < mapH; y++) {
      if (!floor.tiles[y]) continue;
      for (let x = 0; x < mapW; x++) {
        const t = floor.tiles[y][x];
        if (!t || !t.discovered) continue;

        if (t.type === 'wall' || t.type === 'pillar') {
          ctx.fillStyle = '#1c1917';
        } else if (t.type === 'stairs_down') {
          ctx.fillStyle = '#f59e0b';
        } else if (t.type === 'stairs_up') {
          ctx.fillStyle = '#06b6d4';
        } else if (t.type === 'chest' || t.type === 'shrine' || t.type === 'fountain') {
          ctx.fillStyle = '#d97706';
        } else {
          ctx.fillStyle = t.visible ? '#292524' : '#14141d';
        }

        ctx.fillRect(x * tileW, y * tileH, tileW + 0.5, tileH + 0.5);
      }
    }

    // Draw Monsters in visible tiles
    floor.creatures.forEach(c => {
      if (c.hp <= 0) return;
      const tx = Math.floor(c.x / TILE_SIZE);
      const ty = Math.floor(c.y / TILE_SIZE);
      if (tx >= 0 && tx < mapW && ty >= 0 && ty < mapH && floor.tiles[ty]?.[tx]?.visible) {
        ctx.fillStyle = c.tier === 'boss' ? '#dc2626' : '#ef4444';
        ctx.beginPath();
        ctx.arc(tx * tileW + tileW / 2, ty * tileH + tileH / 2, c.tier === 'boss' ? 4 : 2, 0, Math.PI * 2);
        ctx.fill();
        if (c.tier === 'boss') {
          ctx.strokeStyle = '#fca5a5';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    // Draw Player
    const pTx = player.x / TILE_SIZE;
    const pTy = player.y / TILE_SIZE;
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(pTx * tileW, pTy * tileH, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

  }, [floor, player.x, player.y]);

  return (
    <div id="minimap-container" className="absolute bottom-4 right-4 bg-[#08080c]/95 backdrop-blur-md border border-stone-800 rounded-xl sm:rounded-2xl p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.85)] z-20 pointer-events-auto select-none">
      <div className="flex items-center justify-between px-1 pb-1.5 mb-1 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 border-b border-stone-800">
        <div className="flex items-center gap-1.5 text-stone-300">
          <Compass className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-sans">Minimap</span>
        </div>
        <span className="text-[10px] text-amber-400 font-mono font-bold">DEPTH {floor.floorNumber}</span>
      </div>
      <div className="p-0.5 bg-[#11111a] border border-stone-800 rounded-lg">
        <canvas
          ref={canvasRef}
          width={128}
          height={128}
          className="rounded block"
        />
      </div>
    </div>
  );
};

