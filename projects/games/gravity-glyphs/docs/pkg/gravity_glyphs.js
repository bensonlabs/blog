const COLS = 6;
const ROWS = 4;
const CELL = 96;

const LEVELS = [
  {
    glyphs: [
      { x: 2, y: 1, active: false },
      { x: 3, y: 1, active: false },
      { x: 4, y: 1, active: false },
    ],
    start: { x: 0, y: 1 },
    goal: { x: 5, y: 1 },
  },
  {
    glyphs: [
      { x: 2, y: 2, active: true },
      { x: 3, y: 1, active: false },
      { x: 3, y: 3, active: true },
    ],
    start: { x: 1, y: 2 },
    goal: { x: 4, y: 2 },
  },
];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function activeGravity(glyphs) {
  const active = glyphs.filter((g) => g.active);
  if (!active.length) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const g of active) {
    sx += g.x;
    sy += g.y;
  }
  const cx = sx / active.length;
  const cy = sy / active.length;
  return { x: Math.sign(cx - 2.5), y: Math.sign(cy - 1.5) };
}

class GravityGlyphs {
  constructor() {
    this.level = 0;
    this.keysDown = new Set();
    this.lastGravityStep = 0;
    this.resetLevel();
  }

  resetLevel() {
    const lvl = LEVELS[this.level];
    this.glyphs = lvl.glyphs.map((g) => ({ ...g }));
    this.ball = { ...lvl.start };
    this.goal = { ...lvl.goal };
    this.won = false;
  }

  attach(container) {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.display = "block";
    container.textContent = "";
    container.appendChild(this.canvas);
    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.keysDown.delete(e.code));
  }

  resize() {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(window.innerWidth * ratio);
    this.canvas.height = Math.floor(window.innerHeight * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  onKeyDown(e) {
    this.keysDown.add(e.code);
    if (e.code === "Space") {
      this.glyphs.forEach((g) => (g.active = !g.active));
      e.preventDefault();
    }
    if (this.won && e.code === "Enter") {
      this.level = (this.level + 1) % LEVELS.length;
      this.resetLevel();
      e.preventDefault();
    }
  }

  step(now) {
    if (!this.won) {
      if (this.keysDown.has("ArrowLeft")) this.ball.x -= 1;
      if (this.keysDown.has("ArrowRight")) this.ball.x += 1;
      if (this.keysDown.has("ArrowUp")) this.ball.y -= 1;
      if (this.keysDown.has("ArrowDown")) this.ball.y += 1;
      this.keysDown.clear();
      this.ball.x = clamp(this.ball.x, 0, COLS - 1);
      this.ball.y = clamp(this.ball.y, 0, ROWS - 1);

      if (now - this.lastGravityStep > 180) {
        const g = activeGravity(this.glyphs);
        this.ball.x = clamp(this.ball.x + g.x, 0, COLS - 1);
        this.ball.y = clamp(this.ball.y + g.y, 0, ROWS - 1);
        this.lastGravityStep = now;
      }

      this.won = this.ball.x === this.goal.x && this.ball.y === this.goal.y;
    }
    this.draw();
    requestAnimationFrame((t) => this.step(t));
  }

  draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, w, h);

    const size = Math.min(w / COLS, h / ROWS, CELL);
    const ox = (w - COLS * size) / 2;
    const oy = (h - ROWS * size) / 2;

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        this.ctx.fillStyle = "#0a0a0a";
        this.ctx.fillRect(ox + x * size, oy + y * size, size - 2, size - 2);
      }
    }

    this.ctx.fillStyle = "#26d07c";
    this.ctx.fillRect(ox + this.goal.x * size, oy + this.goal.y * size, size - 2, size - 2);

    for (const g of this.glyphs) {
      const cx = ox + g.x * size + size / 2;
      const cy = oy + g.y * size + size / 2;
      this.ctx.fillStyle = g.active ? "#64c8ff" : "#dcdcff";
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, size * 0.28, 0, Math.PI * 2);
      this.ctx.fill();
      if (g.active) {
        this.ctx.strokeStyle = "#3490ff";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }

    this.ctx.fillStyle = "#f5d74f";
    this.ctx.beginPath();
    this.ctx.arc(ox + this.ball.x * size + size / 2, oy + this.ball.y * size + size / 2, size * 0.2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "#dcddde";
    this.ctx.font = "16px system-ui, sans-serif";
    this.ctx.fillText("Arrows: move  Space: toggle glyphs  Enter: next level", 16, Math.max(24, oy - 16));
    if (this.won) {
      this.ctx.fillStyle = "#a78bfa";
      this.ctx.font = "700 22px system-ui, sans-serif";
      this.ctx.fillText("Level complete! Press Enter.", 16, h - 24);
    }
  }

  start() {
    this.step(0);
  }
}

export default async function init() {
  const container = document.getElementById("game");
  const game = new GravityGlyphs();
  game.attach(container);
  return game;
}
