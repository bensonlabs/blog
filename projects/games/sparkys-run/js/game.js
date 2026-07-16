const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const levelButtons = document.getElementById("levelButtons");
const levelTitle = document.getElementById("levelTitle");
const levelSubtitle = document.getElementById("levelSubtitle");
const moveCount = document.getElementById("moveCount");
const statusText = document.getElementById("statusText");
const levelProgressText = document.getElementById("levelProgressText");
const goalProgressText = document.getElementById("goalProgressText");
const goalCount = document.getElementById("goalCount");
const completedCount = document.getElementById("completedCount");
const progressFill = document.getElementById("progressFill");
const completionBanner = document.getElementById("completionBanner");
const resetBtn = document.getElementById("resetBtn");

const TILE = 104;
const ORIGIN = { x: 60, y: 74 };
const COLORS = [
  "#0b65c7",
  "#5a74ff",
  "#f05f00",
  "#d63f5a",
  "#7a5fd3",
  "#16a085",
];
const DOG_TILE_SOURCES = Array.from(
  { length: 12 },
  (_, index) =>
    `dog_tiles_individual/dog_tile_${String(index + 1).padStart(2, "0")}.png`,
);
const DOG_TILE_VARIANTS = [
  {
    sky: ["#5e1e8a", "#a13dd8"],
    fur: ["#7f4f26", "#d8b188", "#26140e"],
    collar: "#ff2b6d",
  },
  {
    sky: ["#114a79", "#2e7dbd"],
    fur: ["#8a5529", "#edd0a7", "#0d1820"],
    collar: "#ff2b6d",
  },
  {
    sky: ["#639c1e", "#a9d33a"],
    fur: ["#94602d", "#f0e0be", "#1a100c"],
    collar: "#ec3f6f",
  },
  {
    sky: ["#0e7683", "#27a1b0"],
    fur: ["#8f5e2d", "#ead2b2", "#0b1218"],
    collar: "#3dd8f6",
  },
  {
    sky: ["#f0b12d", "#ffd77f"],
    fur: ["#8a582c", "#f3dfbd", "#25140e"],
    collar: "#ff4e7d",
  },
  {
    sky: ["#8d6232", "#f0d19a"],
    fur: ["#805128", "#f0ddb9", "#1c130f"],
    collar: "#e7bc58",
  },
  {
    sky: ["#0a4f8e", "#1d79d4"],
    fur: ["#8f5b30", "#f0d7b6", "#111723"],
    collar: "#49c8ff",
  },
  {
    sky: ["#8f0f1d", "#cf312b"],
    fur: ["#7f4e24", "#ead0ad", "#170e0d"],
    collar: "#ff2a56",
  },
  {
    sky: ["#4120a4", "#8e4ef2"],
    fur: ["#7c4b22", "#edd7b2", "#120d17"],
    collar: "#ffd05a",
  },
  {
    sky: ["#e86a11", "#ffb154"],
    fur: ["#7c4c25", "#f0d8b8", "#1a120e"],
    collar: "#36d2ff",
  },
  {
    sky: ["#2d7a13", "#89c61d"],
    fur: ["#8c592a", "#efdcbb", "#18100d"],
    collar: "#42d7cb",
  },
  {
    sky: ["#134a9c", "#58a0ff"],
    fur: ["#825129", "#ebd1ad", "#111827"],
    collar: "#22b5ff",
  },
];
const dogTileImages =
  typeof Image !== "undefined"
    ? DOG_TILE_SOURCES.map((src) => {
        const img = new Image();
        img.decoding = "async";
        img.addEventListener("load", () => {
          if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => render());
          } else {
            render();
          }
        });
        img.addEventListener("error", () => {
          if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => render());
          } else {
            render();
          }
        });
        img.src = src;
        return img;
      })
    : [];

const BOARD_SIZE = 7;
const FULL_OPEN = Array.from({ length: BOARD_SIZE }, (_, y) =>
  Array.from({ length: BOARD_SIZE }, (_, x) => [x, y]),
).flat();
const BASE_LAYOUTS = [
  {
    name: "Crossfire Arena",
    subtitle: "Open field with a centered hazard knot",
    pieces: [
      [3, 4],
      [1, 2],
      [3, 0],
      [0, 5],
    ],
    goals: [
      [0, 1],
      [6, 0],
      [0, 6],
      [6, 6],
    ],
    pits: [
      [3, 3],
      [0, 0],
    ],
    walls: [
      [3, 2],
      [2, 3],
      [4, 3],
      [3, 1],
      [2, 2],
      [4, 2],
      [1, 3],
      [5, 3],
      [2, 4],
      [4, 4],
      [2, 1],
      [4, 1],
      [5, 2],
      [0, 3],
    ],
  },
  {
    name: "Offset Sweep",
    subtitle: "Wide lanes and a diagonal trapline",
    pieces: [
      [1, 6],
      [4, 3],
      [6, 4],
      [2, 3],
    ],
    goals: [
      [4, 5],
      [4, 2],
      [2, 5],
      [6, 1],
    ],
    pits: [
      [3, 3],
      [5, 2],
    ],
    walls: [
      [3, 2],
      [3, 4],
      [3, 1],
      [2, 2],
      [1, 3],
      [5, 3],
      [4, 4],
      [3, 5],
      [3, 0],
      [2, 1],
      [4, 1],
      [1, 2],
      [0, 3],
      [6, 3],
    ],
  },
  {
    name: "North Spur",
    subtitle: "A tall run with a low sinkhole",
    pieces: [
      [3, 3],
      [1, 1],
      [4, 0],
      [4, 1],
    ],
    goals: [
      [1, 3],
      [1, 6],
      [5, 3],
      [4, 6],
    ],
    pits: [
      [3, 6],
      [0, 3],
    ],
    walls: [
      [3, 2],
      [2, 3],
      [4, 3],
      [3, 1],
      [2, 2],
      [4, 2],
      [2, 4],
      [4, 4],
      [3, 0],
      [2, 1],
      [5, 2],
      [1, 4],
      [5, 4],
      [2, 5],
    ],
  },
  {
    name: "South Cascade",
    subtitle: "Lower-half scramble with side pressure",
    pieces: [
      [1, 6],
      [4, 3],
      [0, 4],
      [1, 3],
    ],
    goals: [
      [5, 6],
      [6, 6],
      [5, 5],
      [6, 0],
    ],
    pits: [
      [3, 6],
      [4, 2],
    ],
    walls: [
      [3, 2],
      [2, 3],
      [4, 3],
      [3, 4],
      [3, 1],
      [2, 2],
      [4, 2],
      [1, 3],
      [2, 4],
      [2, 1],
      [4, 1],
      [1, 2],
      [5, 2],
      [0, 3],
    ],
  },
  {
    name: "Corner Bloom",
    subtitle: "Packed lower corner with a mid-board snag",
    pieces: [
      [3, 5],
      [4, 4],
      [4, 5],
      [5, 3],
    ],
    goals: [
      [6, 0],
      [0, 2],
      [3, 3],
      [5, 5],
    ],
    pits: [
      [1, 5],
      [3, 0],
    ],
    walls: [
      [3, 2],
      [2, 3],
      [4, 3],
      [3, 4],
      [3, 1],
      [2, 2],
      [4, 2],
      [1, 3],
      [2, 4],
      [2, 1],
      [4, 1],
      [1, 2],
      [5, 2],
      [0, 3],
    ],
  },
];

const TRANSFORMS = [
  { suffix: "A", subtitle: "base orientation", map: ([x, y]) => [x, y] },
  {
    suffix: "B",
    subtitle: "mirror east-west",
    map: ([x, y]) => [BOARD_SIZE - 1 - x, y],
  },
  {
    suffix: "C",
    subtitle: "mirror north-south",
    map: ([x, y]) => [x, BOARD_SIZE - 1 - y],
  },
  {
    suffix: "D",
    subtitle: "rotate 180°",
    map: ([x, y]) => [BOARD_SIZE - 1 - x, BOARD_SIZE - 1 - y],
  },
];

function transformCoords(coords, map) {
  return coords.map(map);
}

const rawLevels = BASE_LAYOUTS.flatMap((layout, layoutIndex) =>
  TRANSFORMS.map((transform, transformIndex) => ({
    name: `Level ${layoutIndex * TRANSFORMS.length + transformIndex + 1}`,
    subtitle: `${layout.name} — ${transform.subtitle}`,
    open: FULL_OPEN,
    goals: transformCoords(layout.goals, transform.map),
    pieces: transformCoords(layout.pieces, transform.map),
    pits: transformCoords(layout.pits, transform.map),
    walls: transformCoords(layout.walls || [], transform.map),
  })),
);

const levels = rawLevels;

function validateLevels(levels) {
  levels.forEach((level, index) => {
    const pitSet = new Set((level.pits || []).map(([x, y]) => `${x},${y}`));
    const starts = level.pieces.filter(([x, y]) => pitSet.has(`${x},${y}`));
    if (starts.length) {
      console.error(
        `[level-validator] Level ${index + 1} starts on pit(s):`,
        starts.map(([x, y]) => `${x},${y}`).join(", "),
      );
    }
  });
}

validateLevels(levels);

let current = 0;
let moves = 0;
let pieces = [];
let openSet = new Set();
let goalSet = new Set();
let wallSet = new Set();
let pitSet = new Set();
let solved = false;
let failing = false;
let advanceTimer = null;
let animationFrame = null;
const completedLevels = new Set();

function nowMs() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

function key(x, y) {
  return `${x},${y}`;
}

function gridToPx(x, y) {
  return {
    x: ORIGIN.x + x * TILE,
    y: ORIGIN.y + y * TILE,
  };
}

function setState(nextLevelIndex) {
  if (advanceTimer) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  completionBanner.hidden = true;
  completionBanner.dataset.state = "hidden";
  current = nextLevelIndex;
  const level = levels[current];
  pieces = level.pieces.map(([x, y], index) => ({
    x,
    y,
    done: false,
    variant: (current * 5 + index) % DOG_TILE_SOURCES.length,
    bumpUntil: 0,
  }));
  openSet = new Set(level.open.map(([x, y]) => key(x, y)));
  goalSet = new Set(level.goals.map(([x, y]) => key(x, y)));
  wallSet = new Set((level.walls || []).map(([x, y]) => key(x, y)));
  pitSet = new Set((level.pits || []).map(([x, y]) => key(x, y)));
  moves = 0;
  solved = false;
  failing = false;
  levelTitle.textContent = level.name;
  levelSubtitle.textContent = level.subtitle;
  syncButtons();
  updateHUD();
  render();
}

function syncButtons() {
  [...levelButtons.children].forEach((btn, index) => {
    btn.dataset.active = String(index === current);
    btn.dataset.complete = String(completedLevels.has(index));
  });
}

function occupied(x, y, ignore) {
  return pieces.some(
    (piece) =>
      piece !== ignore && !piece.done && piece.x === x && piece.y === y,
  );
}

function canEnter(x, y) {
  return openSet.has(key(x, y)) && !wallSet.has(key(x, y));
}

function updateHUD() {
  const level = levels[current];
  const cleared = pieces.filter((piece) => piece.done).length;
  moveCount.textContent = String(moves);
  statusText.textContent = failing
    ? "Failed"
    : solved
      ? current === levels.length - 1 && pieces.every((piece) => piece.done)
        ? "Complete"
        : "Cleared"
      : "Playing";
  levelProgressText.textContent = `Level ${current + 1} of ${levels.length}`;
  goalProgressText.textContent = `${cleared} of ${level.goals.length} goals cleared`;
  goalCount.textContent = `${cleared}/${level.goals.length}`;
  completedCount.textContent = String(completedLevels.size).padStart(2, "0");
  progressFill.style.width = `${((current + 1) / levels.length) * 100}%`;
}

function showBanner(title, detail = "", state = "success") {
  completionBanner.dataset.state = state;
  completionBanner.innerHTML = detail
    ? `<strong>${title}</strong><span>${detail}</span>`
    : `<strong>${title}</strong>`;
  completionBanner.hidden = false;
}

function completeLevel() {
  solved = true;
  completedLevels.add(current);
  updateHUD();
  syncButtons();
  showBanner(
    `${levels[current].name} cleared`,
    current < levels.length - 1
      ? `Advancing to ${levels[current + 1].name}`
      : "You solved every board.",
    "success",
  );
  if (advanceTimer) clearTimeout(advanceTimer);
  advanceTimer = setTimeout(() => {
    if (current < levels.length - 1) {
      setState(current + 1);
    } else {
      statusText.textContent = "Complete";
      updateHUD();
      showBanner(
        "All levels complete",
        "You finished the full path.",
        "success",
      );
    }
  }, 1200);
}

function failLevel(reason = "Pitfall triggered") {
  if (solved || failing) return;
  failing = true;
  solved = false;
  statusText.textContent = "Failed";
  showBanner(levels[current].name + " failed", reason, "fail");
  if (advanceTimer) clearTimeout(advanceTimer);
  advanceTimer = setTimeout(() => {
    failing = false;
    setState(current);
  }, 1000);
}

function tryMove(dx, dy) {
  if (solved) return;

  const ordered = pieces
    .filter((piece) => !piece.done)
    .slice()
    .sort((a, b) =>
      dx !== 0
        ? dx > 0
          ? b.x - a.x
          : a.x - b.x
        : dy > 0
          ? b.y - a.y
          : a.y - b.y,
    );

  let changed = false;
  for (const piece of ordered) {
    const nx = piece.x + dx;
    const ny = piece.y + dy;
    if (canEnter(nx, ny) && !occupied(nx, ny, piece)) {
      piece.x = nx;
      piece.y = ny;
      piece.bumpUntil = nowMs() + 220;
      changed = true;
      if (goalSet.has(key(nx, ny))) {
        piece.done = true;
      }
    }
  }

  if (changed) {
    moves += 1;
    updateHUD();
    for (const piece of pieces) {
      if (!piece.done && pitSet.has(key(piece.x, piece.y))) {
        render();
        failLevel("A piece fell into a pit. The board resets.");
        return;
      }
    }
    if (pieces.every((piece) => piece.done)) {
      completeLevel();
    }
    render();
  }
}

function drawRoundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawGlow(x, y, radius, color, alpha = 1) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, color.replace("ALPHA", String(alpha)));
  glow.addColorStop(1, color.replace("ALPHA", "0"));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#172331");
  sky.addColorStop(0.52, "#0f1822");
  sky.addColorStop(1, "#081018");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGlow(960, 92, 190, "rgba(255, 214, 120, ALPHA)", 0.52);
  drawGlow(220, 128, 150, "rgba(130, 224, 255, ALPHA)", 0.16);

  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = "#10202c";
  ctx.fillRect(0, canvas.height * 0.72, canvas.width, canvas.height * 0.28);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 60; i += 1) {
    const x = (i * 191) % canvas.width;
    const y = (i * 97) % Math.max(200, canvas.height * 0.42);
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + (i % 4) * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTile(x, y, opts = {}) {
  const { goal = false, wall = false, pit = false } = opts;
  const px = ORIGIN.x + x * TILE;
  const py = ORIGIN.y + y * TILE;
  const tileSize = TILE - 2;
  ctx.save();
  ctx.translate(px, py);
  ctx.shadowColor = "rgba(5, 10, 16, 0.22)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;

  if (pit) {
    const outer = ctx.createLinearGradient(0, 0, 0, tileSize);
    outer.addColorStop(0, "#1b2431");
    outer.addColorStop(1, "#0d1219");
    ctx.fillStyle = outer;
  } else if (wall) {
    const outer = ctx.createLinearGradient(0, 0, 0, tileSize);
    outer.addColorStop(0, "#5a6473");
    outer.addColorStop(1, "#313b48");
    ctx.fillStyle = outer;
  } else if (goal) {
    const outer = ctx.createLinearGradient(0, 0, 0, tileSize);
    outer.addColorStop(0, "#8f5f31");
    outer.addColorStop(1, "#5b3821");
    ctx.fillStyle = outer;
  } else {
    const outer = ctx.createLinearGradient(0, 0, 0, tileSize);
    outer.addColorStop(0, "#8b5a48");
    outer.addColorStop(1, "#614034");
    ctx.fillStyle = outer;
  }

  ctx.fillRect(0, 0, tileSize, tileSize);

  ctx.shadowBlur = 0;
  const inner = pit
    ? "#06090f"
    : wall
      ? "#1a2330"
      : goal
        ? "#18100d"
        : "#744b3e";
  ctx.fillStyle = inner;
  ctx.fillRect(5, 5, tileSize - 10, tileSize - 10);

  if (!wall) {
    ctx.strokeStyle = pit
      ? "rgba(132, 209, 255, 0.16)"
      : "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(6, 6);
    ctx.lineTo(tileSize - 6, 6);
    ctx.stroke();
  }

  if (!wall && !pit) {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(8, 8, tileSize - 16, 5);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(8, tileSize - 11, tileSize - 16, 4);
  }

  if (pit) {
    const rim = ctx.createRadialGradient(
      tileSize / 2,
      tileSize / 2,
      6,
      tileSize / 2,
      tileSize / 2,
      23,
    );
    rim.addColorStop(0, "rgba(12, 16, 24, 0.7)");
    rim.addColorStop(1, "rgba(134, 214, 233, 0.04)");
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(tileSize / 2, tileSize / 2, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#02050a";
    ctx.beginPath();
    ctx.ellipse(tileSize / 2, tileSize / 2, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(154, 237, 255, 0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tileSize / 2, tileSize / 2, 17, 0.5, Math.PI * 1.55);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.arc(tileSize / 2 - 7, tileSize / 2 - 8, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (goal) {
    drawGlow(
      tileSize / 2,
      tileSize / 2,
      24,
      "rgba(242, 206, 104, ALPHA)",
      0.95,
    );
    drawGlow(
      tileSize / 2,
      tileSize / 2,
      14,
      "rgba(161, 255, 181, ALPHA)",
      0.52,
    );
    ctx.fillStyle = "rgba(237, 255, 198, 0.12)";
    ctx.beginPath();
    ctx.arc(tileSize / 2, tileSize / 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 232, 154, 0.55)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(tileSize / 2, tileSize / 2, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.translate(tileSize / 2, tileSize / 2);
    ctx.fillStyle = "#f7ffea";
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 9);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, tileSize - 1, tileSize - 1);
  ctx.restore();
}

function drawDogPortrait(piece, done, variantIndex, now) {
  const { x, y } = gridToPx(piece.x, piece.y);
  const variant = DOG_TILE_VARIANTS[variantIndex % DOG_TILE_VARIANTS.length];
  const imageIndex = dogTileImages.length
    ? variantIndex % dogTileImages.length
    : -1;
  const img = imageIndex >= 0 ? dogTileImages[imageIndex] : null;
  const size = TILE - 8;
  const left = x + (TILE - size) / 2;
  const top = y + (TILE - size) / 2;
  const cx = left + size / 2;
  const cy = top + size / 2;
  const bump = piece.bumpUntil
    ? Math.max(0, Math.min(1, (piece.bumpUntil - now) / 220))
    : 0;
  const lift = 1 - bump * 0.08;
  const pop = 1 + bump * 0.05;

  ctx.save();
  ctx.translate(cx, cy - bump * 2.5);
  ctx.scale(pop, pop * lift);
  ctx.shadowColor = done
    ? "rgba(247, 205, 101, 0.38)"
    : "rgba(10, 18, 24, 0.22)";
  ctx.shadowBlur = done ? 14 : 10;
  ctx.shadowOffsetY = 5;

  const outer = ctx.createLinearGradient(left, top, left, top + size);
  outer.addColorStop(
    0,
    done ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)",
  );
  outer.addColorStop(
    1,
    done ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
  );
  ctx.fillStyle = outer;
  drawRoundedRect(-size / 2 - 3, -size / 2 - 3, size + 6, size + 6, 12);
  ctx.fill();

  ctx.save();
  drawRoundedRect(-size / 2, -size / 2, size, size, 10);
  ctx.clip();
  const bg = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
  bg.addColorStop(0, variant.sky[0]);
  bg.addColorStop(1, variant.sky[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(-size / 2, -size / 2, size, size);

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
  } else {
    ctx.save();
    ctx.translate(0, 1);
    const fur = variant.fur;
    ctx.fillStyle = fur[2];
    ctx.beginPath();
    ctx.ellipse(0, 5, 14, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fur[0];
    ctx.beginPath();
    ctx.ellipse(0, 2, 12, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fur[1];
    ctx.beginPath();
    ctx.ellipse(-3, 1, 7.5, 8, -0.2, 0, Math.PI * 2);
    ctx.ellipse(4, 1, 7.5, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fur[2];
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.quadraticCurveTo(-17, -15, -15, -23);
    ctx.quadraticCurveTo(-9, -25, -5, -16);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.quadraticCurveTo(17, -15, 15, -23);
    ctx.quadraticCurveTo(9, -25, 5, -16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff8ec";
    ctx.beginPath();
    ctx.ellipse(0, 2, 8.5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1110";
    ctx.beginPath();
    ctx.arc(-4.2, -1.4, 1.2, 0, Math.PI * 2);
    ctx.arc(4.2, -1.4, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 3.6, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a1110";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 5.8, 4.5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.48)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7, -6);
    ctx.lineTo(-10, -11);
    ctx.moveTo(7, -6);
    ctx.lineTo(10, -11);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  drawRoundedRect(-size / 2, -size / 2, size, size, 10);
  ctx.stroke();

  if (done) {
    ctx.strokeStyle = "rgba(255, 239, 177, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.48, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPiece(piece, done, now) {
  const variantIndex = piece.variant ?? 0;
  drawDogPortrait(piece, done, variantIndex, now);
}

function render() {
  const now = nowMs();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  ctx.save();
  const platePadding = 10;
  const plateX = ORIGIN.x - platePadding;
  const plateY = ORIGIN.y - platePadding;
  const plateW = TILE * BOARD_SIZE + platePadding * 2;
  const plateH = TILE * BOARD_SIZE + platePadding * 2;
  ctx.shadowColor = "rgba(3, 8, 12, 0.34)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  const plate = ctx.createLinearGradient(
    plateX,
    plateY,
    plateX,
    plateY + plateH,
  );
  plate.addColorStop(0, "rgba(11, 17, 25, 0.88)");
  plate.addColorStop(1, "rgba(7, 11, 17, 0.9)");
  ctx.fillStyle = plate;
  drawRoundedRect(plateX, plateY, plateW, plateH, 28);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  drawRoundedRect(plateX + 1, plateY + 1, plateW - 2, plateH - 2, 26);
  ctx.stroke();
  ctx.restore();

  const level = levels[current];
  level.open.forEach(([x, y]) => {
    const k = key(x, y);
    drawTile(x, y, {
      goal: goalSet.has(k),
      wall: wallSet.has(k),
      pit: pitSet.has(k),
    });
  });
  (level.walls || []).forEach(([x, y]) => {
    const k = key(x, y);
    if (!openSet.has(k)) drawTile(x, y, { wall: true });
  });
  pieces.forEach((piece) => drawPiece(piece, piece.done, now));

  const needsAnimation = pieces.some(
    (piece) => piece.bumpUntil && piece.bumpUntil > now,
  );
  if (needsAnimation) {
    if (animationFrame === null) {
      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        render();
      });
    }
  }
}

function buildLevelButtons() {
  levels.forEach((level, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-btn";
    button.style.background = COLORS[index % COLORS.length];
    button.textContent = String(index + 1).padStart(2, "0");
    button.title = `${level.name} — ${level.subtitle}`;
    button.setAttribute("aria-label", level.name);
    button.addEventListener("click", () => setState(index));
    levelButtons.appendChild(button);
  });
}

resetBtn.addEventListener("click", () => setState(current));

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "arrowup" || key === "w") {
    event.preventDefault();
    tryMove(0, -1);
  } else if (key === "arrowdown" || key === "s") {
    event.preventDefault();
    tryMove(0, 1);
  } else if (key === "arrowleft" || key === "a") {
    event.preventDefault();
    tryMove(-1, 0);
  } else if (key === "arrowright" || key === "d") {
    event.preventDefault();
    tryMove(1, 0);
  } else if (key === "r") {
    setState(current);
  }
});

buildLevelButtons();
setState(0);
