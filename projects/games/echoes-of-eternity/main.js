const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const loopValue = document.getElementById('loopValue');
const distanceValue = document.getElementById('distanceValue');
const fragmentValue = document.getElementById('fragmentValue');
const bestValue = document.getElementById('bestValue');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const summaryTitle = document.getElementById('summaryTitle');
const summaryCopy = document.getElementById('summaryCopy');
const mobileControls = Array.from(document.querySelectorAll('[data-control]'));

const STORAGE_KEY = 'echoes-of-eternity-save';
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const GROUND_RATIO = 0.83;
const PLAYER_X_RATIO = 0.22;

const saveData = loadSave();
const input = {
  up: false,
  down: false,
  boost: false,
};
const inputState = {
  keyboard: { up: false, down: false, boost: false },
  mobile: { up: false, down: false, boost: false },
  pointerBoost: false,
};

const state = {
  started: false,
  gameOver: false,
  loop: 1,
  distance: 0,
  fragments: 0,
  bestDistance: saveData.bestDistance,
  player: createPlayer(),
  particles: [],
  obstacles: [],
  collectibles: [],
  stars: createStars(),
  echoes: saveData.echoes,
  trail: [],
  spawnTimer: 0,
  fragmentTimer: 0,
  flash: 0,
  touchTargetY: null,
  touchPointerId: null,
  pointerBoostId: null,
  time: 0,
};

resizeCanvas();
resetRun(1);
renderFrame(0);
updateHud();
showOverlay(startOverlay, true);
showOverlay(gameOverOverlay, false);

window.addEventListener('resize', () => {
  resizeCanvas();
  clampPlayer();
  resetStars();
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'ArrowUp' || event.code === 'KeyW') inputState.keyboard.up = true;
  if (event.code === 'ArrowDown' || event.code === 'KeyS') inputState.keyboard.down = true;
  if (event.code === 'Space') {
    event.preventDefault();
    inputState.keyboard.boost = true;
  }

  syncInput();

  if (!state.started && ['Space', 'Enter'].includes(event.code)) {
    event.preventDefault();
    startGame();
  }

  if (state.gameOver && event.code === 'Enter') {
    event.preventDefault();
    restartGame();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowUp' || event.code === 'KeyW') inputState.keyboard.up = false;
  if (event.code === 'ArrowDown' || event.code === 'KeyS') inputState.keyboard.down = false;
  if (event.code === 'Space') inputState.keyboard.boost = false;
  syncInput();
});

canvas.addEventListener('pointerdown', (event) => {
  const pointerY = getPointerY(event);
  event.preventDefault();

  if (!state.started) {
    startGame();
  } else if (state.gameOver) {
    restartGame();
  }

  state.touchPointerId = event.pointerId;
  state.touchTargetY = pointerY;

  if (event.pointerType === 'mouse') {
    state.pointerBoostId = event.pointerId;
    inputState.pointerBoost = true;
    syncInput();
  }
});

canvas.addEventListener('pointermove', (event) => {
  if (state.touchTargetY === null || event.pointerId !== state.touchPointerId) return;
  event.preventDefault();
  state.touchTargetY = getPointerY(event);
});

window.addEventListener('pointerup', (event) => {
  if (event.pointerId === state.touchPointerId) {
    state.touchTargetY = null;
    state.touchPointerId = null;
  }

  if (event.pointerId === state.pointerBoostId) {
    state.pointerBoostId = null;
    inputState.pointerBoost = false;
    syncInput();
  }
});

window.addEventListener('pointercancel', (event) => {
  if (event.pointerId === state.touchPointerId) {
    state.touchTargetY = null;
    state.touchPointerId = null;
  }

  if (event.pointerId === state.pointerBoostId) {
    state.pointerBoostId = null;
    inputState.pointerBoost = false;
    syncInput();
  }
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);
mobileControls.forEach(bindMobileControl);

let lastTime = 0;
requestAnimationFrame(loop);

function loop(timestamp) {
  const deltaSeconds = Math.min((timestamp - lastTime) / 1000 || 0, 0.05);
  lastTime = timestamp;

  update(deltaSeconds);
  renderFrame(deltaSeconds);
  requestAnimationFrame(loop);
}

function update(deltaSeconds) {
  state.time += deltaSeconds;
  animateStars(deltaSeconds);

  if (!state.started || state.gameOver) {
    state.flash = Math.max(0, state.flash - deltaSeconds * 2.5);
    return;
  }

  state.distance += deltaSeconds * (150 + state.loop * 18);
  state.spawnTimer -= deltaSeconds;
  state.fragmentTimer -= deltaSeconds;
  state.flash = Math.max(0, state.flash - deltaSeconds * 4);

  updatePlayer(deltaSeconds);
  updateTrail();
  maybeSpawnObstacle();
  maybeSpawnFragment();
  updateObstacles(deltaSeconds);
  updateCollectibles(deltaSeconds);
  updateParticles(deltaSeconds);
  pruneArrays();
  updateHud();
}

function updatePlayer(deltaSeconds) {
  const player = state.player;
  const steer = Number(input.down) - Number(input.up);
  const targetY = state.touchTargetY;
  const viewportHeight = canvas.height / DPR;
  const playMin = viewportHeight * 0.1;
  const playMax = viewportHeight * GROUND_RATIO - player.radius * 2;

  if (targetY !== null) {
    const deltaY = targetY - player.y;
    player.velocityY += clamp(deltaY * 0.022, -520, 520) * deltaSeconds * 3;
  } else if (steer !== 0) {
    player.velocityY += steer * 800 * deltaSeconds;
  }

  if (input.boost) {
    player.velocityX = lerp(player.velocityX, 360, 0.12);
    player.velocityY *= 0.98;
  } else {
    player.velocityX = lerp(player.velocityX, 230, 0.08);
  }

  player.velocityY *= 0.94;
  player.y += player.velocityY * deltaSeconds;
  player.y = clamp(player.y, playMin, playMax);

  if (player.y === playMin || player.y === playMax) {
    player.velocityY *= -0.2;
  }
}

function updateTrail() {
  state.trail.push({ x: canvas.width * PLAYER_X_RATIO / DPR, y: state.player.y });
  if (state.trail.length > 120) state.trail.shift();
}

function maybeSpawnObstacle() {
  if (state.spawnTimer > 0) return;

  const viewportWidth = canvas.width / DPR;
  const viewportHeight = canvas.height / DPR;
  const gapCenter = randomRange(viewportHeight * 0.24, viewportHeight * 0.68);
  const gapSize = Math.max(120, 210 - state.loop * 10 - state.distance / 320);
  const width = randomRange(44, 92);
  const speed = randomRange(250, 360) + state.loop * 14;

  state.obstacles.push({
    x: viewportWidth + width,
    y: 0,
    width,
    height: Math.max(0, gapCenter - gapSize / 2),
    speed,
  });

  state.obstacles.push({
    x: viewportWidth + width,
    y: gapCenter + gapSize / 2,
    width,
    height: viewportHeight * GROUND_RATIO - (gapCenter + gapSize / 2),
    speed,
  });

  state.spawnTimer = Math.max(0.65, 1.45 - state.loop * 0.08 - state.distance / 4000);
}

function maybeSpawnFragment() {
  if (state.fragmentTimer > 0) return;

  const viewportWidth = canvas.width / DPR;
  const viewportHeight = canvas.height / DPR;
  const y = randomRange(viewportHeight * 0.18, viewportHeight * 0.72);

  state.collectibles.push({
    x: viewportWidth + 40,
    y,
    radius: 11,
    speed: randomRange(220, 310) + state.loop * 12,
    bob: Math.random() * Math.PI * 2,
  });

  state.fragmentTimer = randomRange(0.55, 1.1);
}

function updateObstacles(deltaSeconds) {
  const playerX = canvas.width * PLAYER_X_RATIO / DPR;
  const player = state.player;

  for (const obstacle of state.obstacles) {
    obstacle.x -= obstacle.speed * deltaSeconds;

    if (circleRectCollision(playerX, player.y, player.radius, obstacle)) {
      triggerGameOver();
      return;
    }
  }
}

function updateCollectibles(deltaSeconds) {
  const playerX = canvas.width * PLAYER_X_RATIO / DPR;
  const player = state.player;

  for (const collectible of state.collectibles) {
    collectible.x -= collectible.speed * deltaSeconds;
    collectible.bob += deltaSeconds * 4;

    const bobY = collectible.y + Math.sin(collectible.bob) * 8;
    if (distanceBetween(playerX, player.y, collectible.x, bobY) <= player.radius + collectible.radius + 2) {
      state.fragments += 1;
      spawnBurst(collectible.x, bobY, '#75f7df', 10);
      collectible.collected = true;
    }
  }
}

function updateParticles(deltaSeconds) {
  for (const particle of state.particles) {
    particle.x += particle.velocityX * deltaSeconds;
    particle.y += particle.velocityY * deltaSeconds;
    particle.velocityY += particle.gravity * deltaSeconds;
    particle.life -= deltaSeconds;
  }
}

function pruneArrays() {
  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -40);
  state.collectibles = state.collectibles.filter((collectible) => !collectible.collected && collectible.x + collectible.radius > -30);
  state.particles = state.particles.filter((particle) => particle.life > 0);

  const nextLoop = 1 + Math.floor(state.distance / 1200);
  if (nextLoop !== state.loop) {
    state.loop = nextLoop;
    state.flash = 0.85;
    spawnBurst(canvas.width * 0.5 / DPR, canvas.height * 0.25 / DPR, '#ff5b89', 14);
  }
}

function triggerGameOver() {
  if (state.gameOver) return;

  state.gameOver = true;
  clearTransientInput();
  state.flash = 1;
  spawnBurst(canvas.width * PLAYER_X_RATIO / DPR, state.player.y, '#ff5b89', 24);

  const recordDistance = Math.round(state.distance);
  const isNewBest = recordDistance > state.bestDistance;
  if (isNewBest) {
    state.bestDistance = recordDistance;
  }

  state.echoes.unshift({
    color: '#75f7df',
    path: state.trail.slice(-120),
    distance: recordDistance,
  });
  state.echoes = state.echoes.slice(0, 4);

  save();
  updateHud();

  summaryTitle.textContent = `You made it ${recordDistance} m`;
  summaryCopy.textContent = `Fragments recovered: ${state.fragments}. ${isNewBest ? 'A new echo was archived.' : 'Your previous best still anchors the timeline.'}`;
  showOverlay(gameOverOverlay, true);
}

function startGame() {
  if (state.started && !state.gameOver) return;

  if (state.gameOver) {
    restartGame();
    return;
  }

  state.started = true;
  state.gameOver = false;
  showOverlay(startOverlay, false);
  showOverlay(gameOverOverlay, false);
}

function restartGame() {
  resetRun(1);
  state.started = true;
  state.gameOver = false;
  showOverlay(startOverlay, false);
  showOverlay(gameOverOverlay, false);
  updateHud();
}

function resetRun(loopNumber) {
  const viewportHeight = canvas.height / DPR;
  state.loop = loopNumber;
  state.distance = 0;
  state.fragments = 0;
  state.obstacles = [];
  state.collectibles = [];
  state.particles = [];
  state.trail = [];
  state.spawnTimer = 0.9;
  state.fragmentTimer = 0.55;
  state.flash = 0;
  clearTransientInput();
  state.player = createPlayer();
  state.player.y = viewportHeight * 0.5;
  updateHud();
}

function renderFrame() {
  const width = canvas.width / DPR;
  const height = canvas.height / DPR;
  const groundY = height * GROUND_RATIO;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, width, height);

  drawBackdrop(width, height, groundY);
  drawEchoes();
  drawTrail();
  drawCollectibles();
  drawObstacles(height);
  drawPlayer();
  drawParticles();

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${state.flash * 0.12})`;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawBackdrop(width, height, groundY) {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, '#09142d');
  skyGradient.addColorStop(0.65, '#070c18');
  skyGradient.addColorStop(1, '#06070f');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  for (const star of state.stars) {
    ctx.fillStyle = `rgba(117, 247, 223, ${star.alpha})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }

  ctx.strokeStyle = 'rgba(117, 247, 223, 0.08)';
  ctx.lineWidth = 1;
  for (let offset = -40; offset < width + 80; offset += 80) {
    const wave = Math.sin(state.time * 0.9 + offset * 0.01) * 12;
    ctx.beginPath();
    ctx.moveTo(offset, groundY + wave);
    ctx.lineTo(offset + 42, groundY + 26 + wave);
    ctx.stroke();
  }

  const groundGradient = ctx.createLinearGradient(0, groundY - 40, 0, height);
  groundGradient.addColorStop(0, 'rgba(43, 240, 198, 0.05)');
  groundGradient.addColorStop(1, 'rgba(5, 7, 13, 0.95)');
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, groundY, width, height - groundY);
}

function drawEchoes() {
  for (const echo of state.echoes) {
    if (!echo.path || echo.path.length < 2) continue;

    ctx.strokeStyle = 'rgba(117, 247, 223, 0.16)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    echo.path.forEach((point, index) => {
      const x = point.x - state.distance * 0.06 + 120;
      if (index === 0) ctx.moveTo(x, point.y);
      else ctx.lineTo(x, point.y);
    });
    ctx.stroke();
  }
}

function drawTrail() {
  if (state.trail.length < 2) return;

  ctx.strokeStyle = 'rgba(117, 247, 223, 0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  state.trail.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
}

function drawCollectibles() {
  for (const collectible of state.collectibles) {
    const y = collectible.y + Math.sin(collectible.bob) * 8;
    ctx.save();
    ctx.translate(collectible.x, y);
    ctx.rotate(state.time * 2.4 + collectible.bob);
    ctx.fillStyle = '#75f7df';
    ctx.beginPath();
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI / 2) * index;
      ctx.lineTo(Math.cos(angle) * collectible.radius, Math.sin(angle) * collectible.radius);
      ctx.lineTo(Math.cos(angle + Math.PI / 4) * collectible.radius * 0.4, Math.sin(angle + Math.PI / 4) * collectible.radius * 0.4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawObstacles(height) {
  for (const obstacle of state.obstacles) {
    const gradient = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x + obstacle.width, obstacle.y + obstacle.height);
    gradient.addColorStop(0, '#24385f');
    gradient.addColorStop(1, '#75f7df');
    ctx.fillStyle = gradient;
    roundRect(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, 18);
    ctx.fill();

    const seamY = obstacle.y === 0 ? obstacle.height : obstacle.y;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(obstacle.x, seamY - 2, obstacle.width, 4);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(0, height * GROUND_RATIO, canvas.width / DPR, height * (1 - GROUND_RATIO));
}

function drawPlayer() {
  const playerX = canvas.width * PLAYER_X_RATIO / DPR;
  const player = state.player;

  ctx.save();
  ctx.translate(playerX, player.y);
  ctx.rotate(player.velocityY * 0.0014);

  ctx.fillStyle = '#75f7df';
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(-14, -15);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-14, 15);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ff5b89';
  ctx.fillRect(-16, -5, 10, 10);

  if (input.boost && state.started && !state.gameOver) {
    ctx.fillStyle = 'rgba(255, 145, 99, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-34 - Math.random() * 14, -9);
    ctx.lineTo(-26, 0);
    ctx.lineTo(-34 - Math.random() * 14, 9);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

function createPlayer() {
  return {
    y: 200,
    radius: 18,
    velocityY: 0,
    velocityX: 230,
  };
}

function createStars() {
  return Array.from({ length: 80 }, () => createStar());
}

function createStar() {
  const width = canvas.width / DPR || 1280;
  const height = canvas.height / DPR || 720;
  return {
    x: Math.random() * width,
    y: Math.random() * height * 0.75,
    size: randomRange(1, 3),
    speed: randomRange(12, 40),
    alpha: randomRange(0.18, 0.6),
  };
}

function animateStars(deltaSeconds) {
  const width = canvas.width / DPR;
  const height = canvas.height / DPR;

  for (const star of state.stars) {
    star.x -= star.speed * deltaSeconds;
    if (star.x < -star.size) {
      star.x = width + star.size;
      star.y = Math.random() * height * 0.75;
    }
  }
}

function resetStars() {
  state.stars = createStars();
}

function spawnBurst(x, y, color, count) {
  for (let index = 0; index < count; index += 1) {
    const life = randomRange(0.3, 0.9);
    state.particles.push({
      x,
      y,
      velocityX: randomRange(-120, 140),
      velocityY: randomRange(-120, 120),
      gravity: randomRange(30, 90),
      life,
      maxLife: life,
      size: randomRange(2, 5),
      color,
    });
  }
}

function updateHud() {
  loopValue.textContent = String(state.loop);
  distanceValue.textContent = `${Math.round(state.distance)} m`;
  fragmentValue.textContent = String(state.fragments);
  bestValue.textContent = `${Math.round(state.bestDistance)} m`;
}

function resizeCanvas() {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.max(480, Math.floor(width * DPR));
  canvas.height = Math.max(320, Math.floor(height * DPR));
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

function clampPlayer() {
  const height = canvas.height / DPR;
  state.player.y = clamp(state.player.y, height * 0.1, height * GROUND_RATIO - state.player.radius * 2);
}

function getPointerY(event) {
  const rect = canvas.getBoundingClientRect();
  return ((event.clientY - rect.top) / rect.height) * (canvas.height / DPR);
}

function showOverlay(element, visible) {
  element.classList.toggle('hidden', !visible);
  element.classList.toggle('visible', visible);
}

function bindMobileControl(button) {
  const control = button.dataset.control;
  const release = (event) => {
    if (event) event.preventDefault();
    setMobileControl(control, false);
    button.classList.remove('active');
  };

  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (!state.started) {
      startGame();
    } else if (state.gameOver) {
      restartGame();
    }

    button.setPointerCapture?.(event.pointerId);
    setMobileControl(control, true);
    button.classList.add('active');
  });
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
}

function setMobileControl(control, active) {
  if (control === 'up') inputState.mobile.up = active;
  if (control === 'down') inputState.mobile.down = active;
  if (control === 'boost') inputState.mobile.boost = active;
  syncInput();
}

function clearTransientInput() {
  state.touchTargetY = null;
  state.touchPointerId = null;
  state.pointerBoostId = null;
  inputState.mobile.up = false;
  inputState.mobile.down = false;
  inputState.mobile.boost = false;
  inputState.pointerBoost = false;
  mobileControls.forEach((button) => button.classList.remove('active'));
  syncInput();
}

function syncInput() {
  input.up = inputState.keyboard.up || inputState.mobile.up;
  input.down = inputState.keyboard.down || inputState.mobile.down;
  input.boost = inputState.keyboard.boost || inputState.mobile.boost || inputState.pointerBoost;
}

function circleRectCollision(circleX, circleY, radius, rect) {
  const nearestX = clamp(circleX, rect.x, rect.x + rect.width);
  const nearestY = clamp(circleY, rect.y, rect.y + rect.height);
  return distanceBetween(circleX, circleY, nearestX, nearestY) <= radius;
}

function distanceBetween(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function loadSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      bestDistance: Number(parsed.bestDistance) || 0,
      echoes: Array.isArray(parsed.echoes) ? parsed.echoes.slice(0, 4) : [],
    };
  } catch {
    return { bestDistance: 0, echoes: [] };
  }
}

function save() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      bestDistance: state.bestDistance,
      echoes: state.echoes,
    }),
  );
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}
