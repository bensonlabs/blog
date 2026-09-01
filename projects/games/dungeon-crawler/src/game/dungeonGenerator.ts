import { DungeonFloor, Tile, Room } from '../types/game';
import { createCreature } from './creatures';
import { getRandomLootItem } from './items';

export const TILE_SIZE = 40;

export function generateFloor(floorNumber: number): DungeonFloor {
  const isBossFloor = floorNumber % 2 === 0;
  
  // Floor themes
  let theme: DungeonFloor['theme'] = 'crypt';
  let floorName = `Depths ${floorNumber}: Sunken Crypt of Knossos`;
  let ambientLight = 0.12;

  if (floorNumber >= 9) {
    theme = 'olympus_sanctum';
    floorName = `Depths ${floorNumber}: Peak of Mount Olympus`;
    ambientLight = 0.22;
  } else if (floorNumber >= 7) {
    theme = 'labyrinths';
    floorName = `Depths ${floorNumber}: Marble Halls of Daedalus`;
    ambientLight = 0.18;
  } else if (floorNumber >= 5) {
    theme = 'tartarus_abyss';
    floorName = `Depths ${floorNumber}: Tartarus Infernal Gate`;
    ambientLight = 0.1;
  } else if (floorNumber >= 3) {
    theme = 'gorgon_cave';
    floorName = `Depths ${floorNumber}: Serpent Lair of the Gorgon`;
    ambientLight = 0.14;
  }

  // Grid dimensions
  const mapWidth = isBossFloor ? 36 : 48;
  const mapHeight = isBossFloor ? 36 : 48;

  // Initialize all tiles as solid walls
  const tiles: Tile[][] = [];
  for (let y = 0; y < mapHeight; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < mapWidth; x++) {
      row.push({
        type: 'wall',
        walkable: false,
        transparent: false,
        discovered: false,
        visible: false,
        variant: Math.floor(Math.random() * 4),
      });
    }
    tiles.push(row);
  }

  const rooms: Room[] = [];

  if (isBossFloor) {
    // Generate an epic Boss Arena
    const arenaW = 22;
    const arenaH = 22;
    const startX = Math.floor((mapWidth - arenaW) / 2);
    const startY = Math.floor((mapHeight - arenaH) / 2);

    // Spawn room at bottom
    const spawnRoom: Room = {
      x: startX + Math.floor(arenaW / 2) - 3,
      y: startY + arenaH + 2,
      w: 7,
      h: 6,
      type: 'spawn',
      connected: true,
      doors: [],
      center: { x: startX + Math.floor(arenaW / 2), y: startY + arenaH + 5 },
    };

    // Boss Arena Room
    const bossRoom: Room = {
      x: startX,
      y: startY,
      w: arenaW,
      h: arenaH,
      type: 'boss',
      connected: true,
      doors: [],
      center: { x: startX + Math.floor(arenaW / 2), y: startY + Math.floor(arenaH / 2) },
    };

    carveRoom(tiles, spawnRoom);
    carveRoom(tiles, bossRoom);
    // Connect with a corridor
    carveVerticalCorridor(tiles, spawnRoom.center.y, bossRoom.y + bossRoom.h - 1, spawnRoom.center.x);

    // Place decorative pillars in boss arena
    const pOffset = 4;
    const pillars = [
      { x: bossRoom.x + pOffset, y: bossRoom.y + pOffset },
      { x: bossRoom.x + bossRoom.w - pOffset - 1, y: bossRoom.y + pOffset },
      { x: bossRoom.x + pOffset, y: bossRoom.y + bossRoom.h - pOffset - 1 },
      { x: bossRoom.x + bossRoom.w - pOffset - 1, y: bossRoom.y + bossRoom.h - pOffset - 1 },
    ];
    pillars.forEach(p => {
      tiles[p.y][p.x] = {
        type: 'pillar',
        walkable: false,
        transparent: false,
        discovered: false,
        visible: false,
        variant: 0,
      };
    });

    rooms.push(spawnRoom, bossRoom);
  } else {
    // Standard procedural multi-room dungeon
    const numRoomsTarget = 8 + Math.floor(Math.random() * 5);
    const minSize = 6;
    const maxSize = 12;

    for (let i = 0; i < 60 && rooms.length < numRoomsTarget; i++) {
      const w = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
      const h = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
      const x = 2 + Math.floor(Math.random() * (mapWidth - w - 4));
      const y = 2 + Math.floor(Math.random() * (mapHeight - h - 4));

      const newRoom: Room = {
        x,
        y,
        w,
        h,
        type: rooms.length === 0 ? 'spawn' : 'normal',
        connected: rooms.length === 0,
        doors: [],
        center: { x: Math.floor(x + w / 2), y: Math.floor(y + h / 2) },
      };

      // Check overlap
      let overlaps = false;
      for (const r of rooms) {
        if (
          newRoom.x < r.x + r.w + 2 &&
          newRoom.x + newRoom.w + 2 > r.x &&
          newRoom.y < r.y + r.h + 2 &&
          newRoom.y + newRoom.h + 2 > r.y
        ) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        carveRoom(tiles, newRoom);
        if (rooms.length > 0) {
          const prevCenter = rooms[rooms.length - 1].center;
          const newCenter = newRoom.center;
          if (Math.random() < 0.5) {
            carveHorizontalCorridor(tiles, prevCenter.x, newCenter.x, prevCenter.y);
            carveVerticalCorridor(tiles, prevCenter.y, newCenter.y, newCenter.x);
          } else {
            carveVerticalCorridor(tiles, prevCenter.y, newCenter.y, prevCenter.x);
            carveHorizontalCorridor(tiles, prevCenter.x, newCenter.x, newCenter.y);
          }
        }
        rooms.push(newRoom);
      }
    }

    // Designate special rooms
    if (rooms.length > 2) {
      rooms[Math.floor(rooms.length / 2)].type = 'treasure';
    }
    if (rooms.length > 4) {
      rooms[rooms.length - 2].type = 'shrine';
    }
  }

  // Find spawn and stairs positions
  const spawnRoom = rooms[0];
  const stairsRoom = rooms[rooms.length - 1];

  const stairsUpPos = {
    x: spawnRoom.center.x * TILE_SIZE + TILE_SIZE / 2,
    y: spawnRoom.center.y * TILE_SIZE + TILE_SIZE / 2,
  };

  const stairsDownPos = {
    x: stairsRoom.center.x * TILE_SIZE + TILE_SIZE / 2,
    y: stairsRoom.center.y * TILE_SIZE + TILE_SIZE / 2,
  };

  // Place stairs tiles
  tiles[spawnRoom.center.y][spawnRoom.center.x] = {
    type: 'stairs_up',
    walkable: true,
    transparent: true,
    discovered: false,
    visible: false,
    variant: 0,
  };

  tiles[stairsRoom.center.y][stairsRoom.center.x] = {
    type: 'stairs_down',
    walkable: true,
    transparent: true,
    discovered: false,
    visible: false,
    variant: 0,
  };

  // Populate interactables (chests, fountains, shrines, traps)
  const droppedItems: { id: string; item: any; x: number; y: number }[] = [];

  rooms.forEach((room, idx) => {
    if (idx === 0) return; // Skip spawn room

    // Place shrine or fountain
    if (room.type === 'shrine') {
      const sx = room.x + 2;
      const sy = room.y + 2;
      tiles[sy][sx] = {
        type: 'shrine',
        walkable: false,
        transparent: true,
        discovered: false,
        visible: false,
        variant: 0,
      };
    } else if (room.type === 'treasure') {
      const cx = room.x + 2;
      const cy = room.y + 2;
      tiles[cy][cx] = {
        type: 'chest',
        walkable: false,
        transparent: true,
        discovered: false,
        visible: false,
        variant: 0,
      };
      // Maybe a fountain too
      if (room.w > 7) {
        tiles[cy][cx + 2] = {
          type: 'fountain',
          walkable: false,
          transparent: true,
          discovered: false,
          visible: false,
          variant: 0,
        };
      }
    } else if (Math.random() < 0.35 && !isBossFloor) {
      // Random chest in normal room
      const cx = room.x + 2 + Math.floor(Math.random() * (room.w - 4));
      const cy = room.y + 2 + Math.floor(Math.random() * (room.h - 4));
      if (tiles[cy][cx].type === 'floor') {
        tiles[cy][cx] = {
          type: 'chest',
          walkable: false,
          transparent: true,
          discovered: false,
          visible: false,
          variant: 0,
        };
      }
    }

    // Add wall torches along room perimeters
    if (room.w >= 6 && room.h >= 6) {
      tiles[room.y + 1][room.center.x].decoration = 'torch';
      tiles[room.y + room.h - 2][room.center.x].decoration = 'torch';
    }
  });

  // Spawn Creatures
  const creatures = [];

  if (isBossFloor) {
    const bossRoom = rooms[1];
    let bossKey = 'boss_minotaur';
    if (floorNumber === 4) bossKey = 'boss_medusa';
    else if (floorNumber === 6) bossKey = 'boss_cerberus';
    else if (floorNumber === 8) bossKey = 'boss_hydra';
    else if (floorNumber >= 10) bossKey = 'boss_dragon_titan';

    const boss = createCreature(
      bossKey,
      bossRoom.center.x * TILE_SIZE + TILE_SIZE / 2,
      bossRoom.center.y * TILE_SIZE + TILE_SIZE / 2,
      floorNumber
    );
    creatures.push(boss);

    // Optional elite bodyguards for higher bosses
    if (floorNumber >= 6) {
      const guardKey = floorNumber === 6 ? 'hellhound' : floorNumber === 8 ? 'manticore' : 'chimera';
      creatures.push(
        createCreature(guardKey, (bossRoom.x + 4) * TILE_SIZE, (bossRoom.y + 4) * TILE_SIZE, floorNumber),
        createCreature(guardKey, (bossRoom.x + bossRoom.w - 4) * TILE_SIZE, (bossRoom.y + 4) * TILE_SIZE, floorNumber)
      );
    }
  } else {
    // Normal floor creature spawns
    rooms.forEach((room, idx) => {
      if (idx === 0) return; // Never spawn enemies on spawn room

      const creatureCount = 2 + Math.floor(Math.random() * 3);
      for (let c = 0; c < creatureCount; c++) {
        const spawnX = (room.x + 1 + Math.random() * (room.w - 2)) * TILE_SIZE;
        const spawnY = (room.y + 1 + Math.random() * (room.h - 2)) * TILE_SIZE;

        // Choose creature template based on floor depth
        let templateKey = 'goblin_imp';
        const roll = Math.random();

        if (floorNumber <= 2) {
          if (roll < 0.45) templateKey = 'goblin_imp';
          else if (roll < 0.8) templateKey = 'skeleton_hoplite';
          else if (roll < 0.92) templateKey = 'satyr_ranger';
          else templateKey = 'harpy';
        } else if (floorNumber <= 4) {
          if (roll < 0.3) templateKey = 'wisp';
          else if (roll < 0.6) templateKey = 'basilisk';
          else if (roll < 0.85) templateKey = 'hellhound';
          else templateKey = 'stone_golem';
        } else if (floorNumber <= 6) {
          if (roll < 0.35) templateKey = 'hellhound';
          else if (roll < 0.65) templateKey = 'manticore';
          else if (roll < 0.85) templateKey = 'cyclops';
          else templateKey = 'stone_golem';
        } else {
          if (roll < 0.35) templateKey = 'chimera';
          else if (roll < 0.7) templateKey = 'griffin';
          else if (roll < 0.85) templateKey = 'cyclops';
          else templateKey = 'manticore';
        }

        creatures.push(createCreature(templateKey, spawnX, spawnY, floorNumber));
      }
    });
  }

  // Pre-drop a starting healing potion near player in floor 1
  if (floorNumber === 1) {
    const pot = getRandomLootItem(1);
    droppedItems.push({
      id: 'start_pot',
      item: pot,
      x: spawnRoom.center.x * TILE_SIZE + 35,
      y: spawnRoom.center.y * TILE_SIZE + 35,
    });
  }

  return {
    floorNumber,
    name: floorName,
    theme,
    width: mapWidth,
    height: mapHeight,
    tiles,
    rooms,
    creatures,
    projectiles: [],
    particles: [],
    floatingTexts: [],
    telegraphs: [],
    droppedItems,
    stairsDownPos,
    stairsUpPos,
    isBossFloor,
    bossDefeated: false,
    ambientLight,
  };
}

function carveRoom(tiles: Tile[][], room: Room) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
        tiles[y][x] = {
          type: 'floor',
          walkable: true,
          transparent: true,
          discovered: false,
          visible: false,
          variant: Math.floor(Math.random() * 5),
          decoration: Math.random() < 0.08 ? (Math.random() < 0.5 ? 'moss' : 'bones') : undefined,
        };
      }
    }
  }
}

function carveHorizontalCorridor(tiles: Tile[][], x1: number, x2: number, y: number) {
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let x = start; x <= end; x++) {
    if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
      tiles[y][x] = {
        type: 'corridor',
        walkable: true,
        transparent: true,
        discovered: false,
        visible: false,
        variant: 0,
      };
      // Make corridor 2 tiles wide for smoother movement
      if (y + 1 < tiles.length) {
        tiles[y + 1][x] = {
          type: 'corridor',
          walkable: true,
          transparent: true,
          discovered: false,
          visible: false,
          variant: 0,
        };
      }
    }
  }
}

function carveVerticalCorridor(tiles: Tile[][], y1: number, y2: number, x: number) {
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let y = start; y <= end; y++) {
    if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
      tiles[y][x] = {
        type: 'corridor',
        walkable: true,
        transparent: true,
        discovered: false,
        visible: false,
        variant: 0,
      };
      // Make corridor 2 tiles wide
      if (x + 1 < tiles[0].length) {
        tiles[y][x + 1] = {
          type: 'corridor',
          walkable: true,
          transparent: true,
          discovered: false,
          visible: false,
          variant: 0,
        };
      }
    }
  }
}

/**
 * Computes Field of View (FOV) around player position
 */
export function updateFOV(tiles: Tile[][], playerX: number, playerY: number, viewRadius: number = 8.5) {
  const mapH = tiles.length;
  const mapW = tiles[0].length;
  const pTileX = Math.floor(playerX / TILE_SIZE);
  const pTileY = Math.floor(playerY / TILE_SIZE);

  // First reset visible state
  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      tiles[y][x].visible = false;
    }
  }

  // Cast rays in 360 degrees
  const numRays = 180;
  for (let i = 0; i < numRays; i++) {
    const angle = (i * 2 * Math.PI) / numRays;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let dist = 0; dist <= viewRadius; dist += 0.4) {
      const targetX = Math.floor(pTileX + cos * dist);
      const targetY = Math.floor(pTileY + sin * dist);

      if (targetX < 0 || targetX >= mapW || targetY < 0 || targetY >= mapH) break;

      const tile = tiles[targetY][targetX];
      tile.visible = true;
      tile.discovered = true;

      // Stop ray if opaque wall or pillar
      if (!tile.transparent) {
        break;
      }
    }
  }
}
