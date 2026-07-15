const COLS = 6;
const ROWS = 4;
const CELL = 96;
const HUD_HEIGHT = 96;
const MOVE_KEYS = Object.freeze({
  horizontal: ["ArrowLeft", "ArrowRight"],
  vertical: ["ArrowUp", "ArrowDown"],
});
const ACTION_KEYS = Object.freeze(["Space", "Enter"]);

function makeLevel(glyphs, start, goal) {
  return {
    glyphs: glyphs.map((glyph) => ({ ...glyph })),
    start: { ...start },
    goal: { ...goal },
  };
}

export const LEVELS = [
  makeLevel(
    [
      { x: 2, y: 1, active: false },
      { x: 3, y: 1, active: false },
      { x: 4, y: 1, active: false },
    ],
    { x: 0, y: 1 },
    { x: 5, y: 1 },
  ),
  makeLevel(
    [
      { x: 2, y: 2, active: true },
      { x: 3, y: 1, active: false },
      { x: 3, y: 3, active: true },
    ],
    { x: 1, y: 2 },
    { x: 4, y: 2 },
  ),
];

export const NAV_RULES = Object.freeze({
  horizontal: {
    label: "horizontal",
    moves: MOVE_KEYS.horizontal,
    axisKey: "arrow-left/right",
  },
  vertical: {
    label: "vertical",
    moves: MOVE_KEYS.vertical,
    axisKey: "arrow-up/down",
  },
  actions: ACTION_KEYS,
});

export function getMoveKeyForAxis(axis, pressed) {
  const keys = MOVE_KEYS[axis];
  if (!keys) {
    return null;
  }

  return keys.find((key) => pressed.has(key)) ?? null;
}

export function getMoveVector(key) {
  switch (key) {
    case "ArrowLeft":
      return { dx: -1, dy: 0 };
    case "ArrowRight":
      return { dx: 1, dy: 0 };
    case "ArrowUp":
      return { dx: 0, dy: -1 };
    case "ArrowDown":
      return { dx: 0, dy: 1 };
    default:
      return null;
  }
}

export function hasAnyMovementKey(pressed) {
  return [...MOVE_KEYS.horizontal, ...MOVE_KEYS.vertical].some((key) => pressed.has(key));
}

function initCanvas() {
  const mount = document.querySelector("#game") || document.body;
  mount.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.style.cssText = [
    "position:relative",
    "width:100vw",
    "height:100vh",
    "overflow:hidden",
    "background:radial-gradient(circle at top, #294c7f 0%, #0d1728 55%, #05070b 100%)",
  ].join(";");

  const canvas = document.createElement("canvas");
  const width = COLS * CELL;
  const height = ROWS * CELL + HUD_HEIGHT;
  const scale = Math.min(window.innerWidth / width, window.innerHeight / height, 1);
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, Math.floor(width * pixelRatio));
  canvas.height = Math.max(1, Math.floor(height * pixelRatio));
  canvas.style.width = `${Math.floor(width * scale)}px`;
  canvas.style.height = `${Math.floor(height * scale)}px`;
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.margin = "auto";
  canvas.style.imageRendering = "pixelated";
  canvas.style.boxShadow = "0 30px 90px rgba(0, 0, 0, 0.55)";
  canvas.style.background = "#09111e";
  canvas.style.border = "1px solid rgba(255, 255, 255, 0.12)";

  wrapper.appendChild(canvas);
  mount.appendChild(wrapper);

  const ctx = canvas.getContext("2d");
  ctx.scale(pixelRatio, pixelRatio);
  return { canvas, ctx, width, height };
}

function createGame() {
  const state = {
    level: 0,
    axis: "horizontal",
    glyphs: LEVELS[0].glyphs.map((glyph) => ({ ...glyph })),
    ball: { ...LEVELS[0].start, goal: false },
    status: "Reach the green portal.",
    keys: new Set(),
    pressed: new Set(),
    running: true,
    listeners: [],
  };

  const setLevel = (index, message) => {
    const level = LEVELS[index];
    state.level = index;
    state.glyphs = level.glyphs.map((glyph) => ({ ...glyph }));
    state.ball = { ...level.start, goal: false };
    state.axis = "horizontal";
    state.status = message || `Level ${index + 1} loaded.`;
  };

  const atGoal = () => {
    const goal = LEVELS[state.level].goal;
    return state.ball.x === goal.x && state.ball.y === goal.y;
  };

  const flipAll = () => {
    for (const glyph of state.glyphs) {
      glyph.active = !glyph.active;
    }
    state.axis = state.axis === "horizontal" ? "vertical" : "horizontal";
    state.status = `Gravity is now ${state.axis}.`;
  };

  const step = (dx, dy) => {
    const nextX = Math.max(0, Math.min(COLS - 1, state.ball.x + dx));
    const nextY = Math.max(0, Math.min(ROWS - 1, state.ball.y + dy));
    if (nextX === state.ball.x && nextY === state.ball.y) {
      return;
    }

    state.ball.x = nextX;
    state.ball.y = nextY;
    state.ball.goal = atGoal();

    const glyph = state.glyphs.find((item) => item.x === state.ball.x && item.y === state.ball.y && item.active);
    if (glyph) {
      state.axis = state.axis === "horizontal" ? "vertical" : "horizontal";
      state.status = `A glyph flipped gravity to ${state.axis}.`;
    }

    if (state.ball.goal) {
      state.status = "Goal reached. Press Enter for the next level.";
    }
  };

  const nextLevel = () => {
    const next = (state.level + 1) % LEVELS.length;
    setLevel(next, `Level ${next + 1} loaded.`);
  };

  const bindInput = () => {
    const onKeyDown = (event) => {
      if (state.keys.has(event.code)) {
        return;
      }
      state.keys.add(event.code);
      state.pressed.add(event.code);
      if ([...MOVE_KEYS.horizontal, ...MOVE_KEYS.vertical, ...ACTION_KEYS].includes(event.code)) {
        event.preventDefault();
      }
    };

    const onKeyUp = (event) => {
      state.keys.delete(event.code);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    state.listeners.push(["keydown", onKeyDown], ["keyup", onKeyUp]);
  };

  const update = () => {
    if (state.pressed.has("Space")) {
      flipAll();
    }

    const moveKey = getMoveKeyForAxis(state.axis, state.pressed);
    if (moveKey) {
      const vector = getMoveVector(moveKey);
      if (vector) {
        step(vector.dx, vector.dy);
      }
    } else if (hasAnyMovementKey(state.pressed)) {
      const keys = MOVE_KEYS[state.axis];
      state.status = `Gravity is ${state.axis}; use ${keys[0]} or ${keys[1]}.`;
    }

    if (state.ball.goal && state.pressed.has("Enter")) {
      nextLevel();
    }

    state.pressed.clear();
  };

  const draw = () => {
    const { ctx } = state;
    ctx.clearRect(0, 0, state.width, state.height);

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const shade = (x + y) % 2 === 0 ? 36 : 24;
        ctx.fillStyle = `rgb(${shade}, ${shade + 10}, ${shade + 24})`;
        ctx.fillRect(x * CELL, y * CELL, CELL - 2, CELL - 2);
      }
    }

    const goal = LEVELS[state.level].goal;
    ctx.fillStyle = "rgb(76, 220, 108)";
    ctx.fillRect(goal.x * CELL, goal.y * CELL, CELL - 2, CELL - 2);
    ctx.fillStyle = "#041814";
    ctx.font = "700 24px system-ui, sans-serif";
    ctx.fillText("GOAL", goal.x * CELL + 18, goal.y * CELL + 56);

    for (const glyph of state.glyphs) {
      const active = glyph.active;
      ctx.beginPath();
      ctx.fillStyle = active ? "rgb(110, 224, 255)" : "rgb(238, 241, 255)";
      ctx.arc(glyph.x * CELL + CELL * 0.5, glyph.y * CELL + CELL * 0.5, 26, 0, Math.PI * 2);
      ctx.fill();
      if (active) {
        ctx.beginPath();
        ctx.strokeStyle = "rgb(75, 170, 255)";
        ctx.lineWidth = 3;
        ctx.arc(glyph.x * CELL + CELL * 0.5, glyph.y * CELL + CELL * 0.5, 31, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.beginPath();
    ctx.fillStyle = "rgb(255, 232, 110)";
    ctx.arc(state.ball.x * CELL + CELL * 0.5, state.ball.y * CELL + CELL * 0.5, 18, 0, Math.PI * 2);
    ctx.fill();

    if (state.ball.goal) {
      ctx.beginPath();
      ctx.strokeStyle = "rgb(130, 255, 230)";
      ctx.lineWidth = 4;
      ctx.arc(state.ball.x * CELL + CELL * 0.5, state.ball.y * CELL + CELL * 0.5, 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(4, 6, 10, 0.95)";
    ctx.fillRect(0, ROWS * CELL, COLS * CELL, HUD_HEIGHT);
    ctx.fillStyle = "#fff";
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.fillText(
      `Level ${state.level + 1}  Gravity: ${state.axis}  ${state.status}`,
      16,
      ROWS * CELL + 34,
    );
    ctx.fillStyle = "rgb(180, 186, 196)";
    ctx.font = "400 20px system-ui, sans-serif";
    ctx.fillText(
      `Move: ${NAV_RULES.horizontal.moves.join(" / ")} when horizontal, ${NAV_RULES.vertical.moves.join(" / ")} when vertical. Space flips all glyphs and gravity. Enter advances after goal.`,
      16,
      ROWS * CELL + 68,
    );
  };

  const loop = () => {
    if (!state.running) {
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  };

  return {
    start() {
      initCanvas();
      bindInput();
      draw();
      requestAnimationFrame(loop);
    },
    stop() {
      state.running = false;
      for (const [type, handler] of state.listeners) {
        window.removeEventListener(type, handler);
      }
      state.listeners = [];
    },
  };
}

export default async function init() {
  const game = createGame();
  game.start();
  return game;
}
