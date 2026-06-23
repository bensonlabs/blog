// Main Simulator Orchestrator & Loop
import { Body, stepPhysics, predictTrajectories } from './physics.js';
import { camera, initBackground, drawScene, toPhysics } from './canvas.js';
import { AudioController } from './audio.js';
import { UIManager, presets } from './ui.js';

// Application State
const state = {
  bodies: [],
  debris: [],
  isPaused: false,
  stepOnce: false,
  timeScale: 1.0,
  age: 0.0,
  drawOrbits: true,
  currentPreset: 'solar',
  spawner: {
    type: 'asteroid',
    mass: 10,
    radius: 4,
    mode: 'shoot',
    isCreating: false,
    dragStart: null,
    dragCurrent: null
  },
  resetPreset() {
    this.bodies = presets[this.currentPreset]();
    this.debris = [];
    this.age = 0.0;
    
    // Clear trails
    this.bodies.forEach(b => b.clearTrail());
    
    if (ui) {
      ui.energyHistory = [];
      ui.logEvent(`Preset configuration [${this.currentPreset.toUpperCase()}] established.`, 'system');
    }
  }
};

// Canvas Setup
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

// Initialize modules
const audio = new AudioController();
const ui = new UIManager(state);

// Setup screen bounds
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initBackground(canvas.width, canvas.height);
}

// Map entities to custom aesthetic color specs
function getColorForType(type) {
  switch (type) {
    case 'asteroid': return '#a0a0b0';
    case 'planet': return '#00d2ff';
    case 'star': return '#ffcb47';
    case 'neutron': return '#ff7e47';
    case 'blackhole': return '#b61aff';
    default: return '#ffffff';
  }
}

// Compute stable circular velocity vector relative to nearest heavy body
function calculateAutoOrbit(clickPhys) {
  // Find nearest heavy attractor (mass > 1000)
  let nearestAttractor = null;
  let minDist = Infinity;

  state.bodies.forEach(b => {
    if (b.mass >= 1000) {
      const dx = b.x - clickPhys.x;
      const dy = b.y - clickPhys.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearestAttractor = b;
      }
    }
  });

  if (!nearestAttractor) {
    return { vx: 0, vy: 0 }; // No heavy attractor, spawn static
  }

  // Direction vector from nearest heavy body to click position
  const dx = clickPhys.x - nearestAttractor.x;
  const dy = clickPhys.y - nearestAttractor.y;
  const r = Math.sqrt(dx * dx + dy * dy) || 1.0;

  // Orbit speed: v = sqrt(G * M / r)
  // Soften gravity if too close
  const G = 1.0;
  const speed = Math.sqrt((G * nearestAttractor.mass) / r);

  // Perpendicular orbital velocity vector (counter-clockwise)
  // Perpendicular to (dx, dy) is (-dy, dx)
  const vx = nearestAttractor.vx - (dy / r) * speed;
  const vy = nearestAttractor.vy + (dx / r) * speed;

  return { vx, vy, attractor: nearestAttractor };
}

// Bind Input Mouse/Touch Actions
function setupInput() {
  let isRightDragging = false;
  let startDragX = 0;
  let startDragY = 0;
  let startCamX = 0;
  let startCamY = 0;

  // Mouse Down
  canvas.addEventListener('mousedown', (e) => {
    // Only capture click events direct to canvas, not on UI overlays
    if (e.target !== canvas) return;

    if (e.button === 2) {
      // Right Click: Camera Panning
      isRightDragging = true;
      startDragX = e.clientX;
      startDragY = e.clientY;
      startCamX = camera.x;
      startCamY = camera.y;
      e.preventDefault();
    } else if (e.button === 0) {
      // Left Click: Object placement
      const clickPhys = toPhysics(e.clientX, e.clientY, canvas);

      if (state.spawner.mode === 'shoot') {
        state.spawner.isCreating = true;
        state.spawner.dragStart = clickPhys;
        state.spawner.dragCurrent = clickPhys;
      } else if (state.spawner.mode === 'orbit') {
        // Auto-orbit launch
        const orbitVel = calculateAutoOrbit(clickPhys);
        const newBody = new Body({
          type: state.spawner.type,
          x: clickPhys.x,
          y: clickPhys.y,
          vx: orbitVel.vx,
          vy: orbitVel.vy,
          mass: state.spawner.mass,
          radius: state.spawner.radius,
          color: getColorForType(state.spawner.type)
        });

        state.bodies.push(newBody);
        
        let logText = `Launched ${state.spawner.type.toUpperCase()} in orbital trajectory.`;
        if (orbitVel.attractor) {
          logText = `Launched ${state.spawner.type.toUpperCase()} into stable orbit around ${orbitVel.attractor.type.toUpperCase()}.`;
        }
        ui.logEvent(logText, 'system');
        audio.triggerSound('collision', state.spawner.mass);
      }
    }
  });

  // Mouse Move
  canvas.addEventListener('mousemove', (e) => {
    const mousePhys = toPhysics(e.clientX, e.clientY, canvas);

    if (isRightDragging) {
      // Camera panning
      const dx = e.clientX - startDragX;
      const dy = e.clientY - startDragY;
      // Adjust camera coordinate based on drag and current scale
      camera.x = startCamX - dx / camera.zoom;
      camera.y = startCamY - dy / camera.zoom;
    } else if (state.spawner.isCreating) {
      state.spawner.dragCurrent = mousePhys;
    }
  });

  // Mouse Up
  window.addEventListener('mouseup', (e) => {
    if (e.button === 2) {
      isRightDragging = false;
    } else if (e.button === 0 && state.spawner.isCreating) {
      const start = state.spawner.dragStart;
      const current = state.spawner.dragCurrent;
      
      // Velocity vector points from current mouse to drag start (inverse launch sling)
      const shootScale = 0.06; // velocity factor scaling
      const vx = (start.x - current.x) * shootScale;
      const vy = (start.y - current.y) * shootScale;

      const newBody = new Body({
        type: state.spawner.type,
        x: start.x,
        y: start.y,
        vx: vx,
        vy: vy,
        mass: state.spawner.mass,
        radius: state.spawner.radius,
        color: getColorForType(state.spawner.type)
      });

      state.bodies.push(newBody);
      
      ui.logEvent(`Launched custom ${state.spawner.type.toUpperCase()} (Velocity: ${Math.sqrt(vx*vx + vy*vy).toFixed(1)} km/s)`, 'system');
      audio.triggerSound('collision', state.spawner.mass);

      // Reset spawner drag state
      state.spawner.isCreating = false;
      state.spawner.dragStart = null;
      state.spawner.dragCurrent = null;
    }
  });

  // Zooming: Centered on mouse pointer
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    // Zoom factor steps
    const zoomFactor = 1.1;
    const mouseBefore = toPhysics(e.clientX, e.clientY, canvas);
    
    if (e.deltaY < 0) {
      camera.zoom = Math.min(camera.maxZoom, camera.zoom * zoomFactor);
    } else {
      camera.zoom = Math.max(camera.minZoom, camera.zoom / zoomFactor);
    }
    
    const mouseAfter = toPhysics(e.clientX, e.clientY, canvas);
    
    // Shift camera focus center so mouse position stays stationary in screen coordinates
    camera.x += (mouseBefore.x - mouseAfter.x);
    camera.y += (mouseBefore.y - mouseAfter.y);
  }, { passive: false });

  // Disable context menu inside simulation canvas
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Animation loop telemetry metrics
let lastTime = performance.now();
let frames = 0;
let fps = 60;
let logTimer = 0;

// Central Game Loop
function loop(time) {
  requestAnimationFrame(loop);

  // 1. Calculate FPS
  frames++;
  if (time > lastTime + 1000) {
    fps = (frames * 1000) / (time - lastTime);
    frames = 0;
    lastTime = time;
  }

  // 2. Physics stepping
  // dt represents fraction of time. (0.016 is typical 60FPS step)
  const dt = (state.isPaused && !state.stepOnce) ? 0 : 0.16 * state.timeScale;
  
  if (dt > 0) {
    // Step simulation
    stepPhysics(
      state.bodies, 
      state.debris, 
      dt, 
      (txt, cat) => ui.logEvent(txt, cat), 
      (type, mass) => audio.triggerSound(type, mass)
    );

    // Update debris particles
    for (let i = state.debris.length - 1; i >= 0; i--) {
      const d = state.debris[i];
      d.update(dt, 0.02); // apply slight drag/friction to spark particles
      if (d.life <= 0) {
        state.debris.splice(i, 1);
      }
    }

    // Advance Cosmic age
    state.age += dt * 0.003;
    state.stepOnce = false;
  }

  // 3. Trajectory projection forward steps (simulating clone forward path)
  let paths = null;
  if (state.drawOrbits && state.bodies.length > 0) {
    paths = predictTrajectories(state.bodies, 150, 0.2); // 150 prediction steps
  }

  // 4. Draw frame
  drawScene(canvas, ctx, state.bodies, state.debris, paths, state.spawner, state.drawOrbits);

  // 5. Update UI & Telemetry
  ui.updateTelemetry(state.bodies, fps, state.age);
  
  // Record energy analytics periodically (every 5 frames to save CPU)
  logTimer++;
  if (logTimer % 5 === 0 && dt > 0) {
    ui.recordEnergy(state.bodies);
  }
}

// Start Application
function initApp() {
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Setup input listeners
  setupInput();

  // Init UI binding
  ui.init(audio);

  // Load default preset
  state.resetPreset();

  // Start Animation Loop
  requestAnimationFrame(loop);
}

// Boot
window.onload = initApp;
