// UI Control and Presets Management
import { Body, physicsConfig, calculateCosmicEnergy } from './physics.js';
import { camera } from './canvas.js';

// Setup presets data
export const presets = {
  solar: () => {
    const list = [];
    // Sun
    list.push(new Body({
      id: 'sun',
      type: 'star',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      mass: 30000,
      radius: 28,
      color: '#ffcb47'
    }));

    // Mercury
    const rMerc = 85;
    const vMerc = Math.sqrt(physicsConfig.G * 30000 / rMerc);
    list.push(new Body({
      type: 'asteroid',
      x: 0,
      y: -rMerc,
      vx: vMerc,
      vy: 0,
      mass: 8,
      radius: 4,
      color: '#a0a0b0'
    }));

    // Venus
    const rVen = 140;
    const vVen = Math.sqrt(physicsConfig.G * 30000 / rVen);
    list.push(new Body({
      type: 'planet',
      x: rVen,
      y: 0,
      vx: 0,
      vy: vVen,
      mass: 140,
      radius: 8,
      color: '#ff7e47'
    }));

    // Earth
    const rEarth = 210;
    const vEarth = Math.sqrt(physicsConfig.G * 30000 / rEarth);
    list.push(new Body({
      id: 'earth',
      type: 'planet',
      x: 0,
      y: rEarth,
      vx: -vEarth,
      vy: 0,
      mass: 250,
      radius: 10,
      color: '#00d2ff'
    }));

    // Earth Moon (stable orbit around Earth)
    const rMoon = 18;
    const vMoonRel = Math.sqrt(physicsConfig.G * 250 / rMoon);
    list.push(new Body({
      type: 'asteroid',
      x: 0,
      y: rEarth + rMoon,
      vx: -vEarth - vMoonRel,
      vy: 0,
      mass: 5,
      radius: 3,
      color: '#f0f0f5'
    }));

    // Mars
    const rMars = 290;
    const vMars = Math.sqrt(physicsConfig.G * 30000 / rMars);
    list.push(new Body({
      type: 'planet',
      x: -rMars,
      y: 0,
      vx: 0,
      vy: -vMars,
      mass: 180,
      radius: 7,
      color: '#ff4b5c'
    }));

    // Jupiter
    const rJup = 410;
    const vJup = Math.sqrt(physicsConfig.G * 30000 / rJup);
    list.push(new Body({
      type: 'planet',
      x: 0,
      y: -rJup,
      vx: vJup,
      vy: 0,
      mass: 900,
      radius: 15,
      color: '#ffcb47'
    }));

    camera.x = 0;
    camera.y = 0;
    camera.zoom = 1.2;
    return list;
  },

  binary: () => {
    const list = [];
    // Two co-orbiting stars
    const dist = 130;
    const starMass = 16000;
    // Circular orbital speed: v = sqrt(G * M_partner * r_bary / dist_total^2) = sqrt(G * M * 0.5d / d^2) = sqrt(G * M / 2d)
    const vOrbit = Math.sqrt((physicsConfig.G * starMass) / (2 * dist));

    list.push(new Body({
      type: 'star',
      x: -dist,
      y: 0,
      vx: 0,
      vy: -vOrbit,
      mass: starMass,
      radius: 20,
      color: '#ffcb47'
    }));

    list.push(new Body({
      type: 'star',
      x: dist,
      y: 0,
      vx: 0,
      vy: vOrbit,
      mass: starMass,
      radius: 20,
      color: '#ff7e47'
    }));

    // Add a couple of outer planet candidates to witness complex dynamic paths
    const planetDist = 320;
    const vPlanet = Math.sqrt(physicsConfig.G * (starMass * 2) / planetDist);
    
    list.push(new Body({
      type: 'planet',
      x: 0,
      y: planetDist,
      vx: -vPlanet,
      vy: 0,
      mass: 200,
      radius: 9,
      color: '#00d2ff'
    }));

    list.push(new Body({
      type: 'asteroid',
      x: -planetDist * 0.8,
      y: -planetDist * 0.8,
      vx: vPlanet * 0.7,
      vy: -vPlanet * 0.7,
      mass: 10,
      radius: 4,
      color: '#00e676'
    }));

    camera.x = 0;
    camera.y = 0;
    camera.zoom = 1.0;
    return list;
  },

  blackhole: () => {
    const list = [];
    const bhMass = 120000;
    
    // Supermassive Black Hole
    list.push(new Body({
      type: 'blackhole',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      mass: bhMass,
      radius: 18,
      color: '#b61aff'
    }));

    // Accretion Disk - Spawn 75 orbiting asteroids
    const astCount = 75;
    for (let i = 0; i < astCount; i++) {
      const radius = 90 + Math.random() * 210;
      const angle = Math.random() * Math.PI * 2;
      
      const ax = Math.cos(angle) * radius;
      const ay = Math.sin(angle) * radius;
      
      // Stable circular orbital velocity perpendicular to radius vector
      const v = Math.sqrt((physicsConfig.G * bhMass) / radius);
      const avx = -Math.sin(angle) * v;
      const avy = Math.cos(angle) * v;

      list.push(new Body({
        type: 'asteroid',
        x: ax,
        y: ay,
        vx: avx,
        vy: avy,
        mass: 1 + Math.random() * 8,
        radius: 2 + Math.random() * 3,
        color: i % 3 === 0 ? '#ff7e47' : (i % 3 === 1 ? '#b61aff' : '#ffcb47')
      }));
    }

    camera.x = 0;
    camera.y = 0;
    camera.zoom = 1.0;
    return list;
  },

  threebody: () => {
    const list = [];
    // Unstable chaotic system of three equal mass stars
    const mass = 25000;
    const rad = 18;

    // Symmetric layout
    list.push(new Body({
      type: 'star',
      x: -160,
      y: -50,
      vx: 3.5,
      vy: -5.0,
      mass: mass,
      radius: rad,
      color: '#ffcb47'
    }));

    list.push(new Body({
      type: 'star',
      x: 160,
      y: -50,
      vx: -3.5,
      vy: -5.0,
      mass: mass,
      radius: rad,
      color: '#00d2ff'
    }));

    list.push(new Body({
      type: 'star',
      x: 0,
      y: 100,
      vx: 0,
      vy: 10.0,
      mass: mass,
      radius: rad,
      color: '#ff4b5c'
    }));

    camera.x = 0;
    camera.y = 0;
    camera.zoom = 1.1;
    return list;
  },

  collision: () => {
    const list = [];
    // Two high-mass stars directly colliding to create a massive explosion
    list.push(new Body({
      type: 'star',
      x: -300,
      y: -15,
      vx: 12.0,
      vy: 0.5,
      mass: 32000,
      radius: 24,
      color: '#ff7e47'
    }));

    list.push(new Body({
      type: 'neutron',
      x: 300,
      y: 15,
      vx: -12.0,
      vy: -0.5,
      mass: 38000,
      radius: 20,
      color: '#00d2ff'
    }));

    camera.x = 0;
    camera.y = 0;
    camera.zoom = 0.95;
    return list;
  }
};

// UI Manager
export class UIManager {
  constructor(appState) {
    this.state = appState;
    this.energyHistory = [];
    this.maxHistoryLength = 120;
    
    // DOM Cache
    this.btnPlayPause = document.getElementById('btnPlayPause');
    this.lblPlayPause = document.getElementById('lblPlayPause');
    this.btnStep = document.getElementById('btnStep');
    this.btnReset = document.getElementById('btnReset');
    this.btnClear = document.getElementById('btnClear');
    this.rngSpeed = document.getElementById('rngSpeed');
    this.valSpeed = document.getElementById('valSpeed');
    
    this.presetButtons = document.querySelectorAll('.preset-btn');
    this.spawnTypes = document.querySelectorAll('.spawn-type');
    
    this.rngMass = document.getElementById('rngMass');
    this.valMass = document.getElementById('valMass');
    this.rngRadius = document.getElementById('rngRadius');
    this.valRadius = document.getElementById('valRadius');
    
    this.modeShoot = document.getElementById('modeShoot');
    this.modeOrbit = document.getElementById('modeOrbit');
    
    this.btnAudioToggle = document.getElementById('btnAudioToggle');
    this.rngVolume = document.getElementById('rngVolume');
    this.valVolume = document.getElementById('valVolume');
    this.audioStatusBadge = document.getElementById('audioStatus');
    this.audioBadgeIcon = document.getElementById('audioBadgeIcon');
    this.audioBadgeText = document.getElementById('audioBadgeText');
    
    this.telBodies = document.getElementById('telBodies');
    this.telTotalMass = document.getElementById('telTotalMass');
    this.telFPS = document.getElementById('telFPS');
    this.telAge = document.getElementById('telAge');
    
    this.rngG = document.getElementById('rngG');
    this.valG = document.getElementById('valG');
    this.selCollision = document.getElementById('selCollision');
    this.rngFriction = document.getElementById('rngFriction');
    this.valFriction = document.getElementById('valFriction');
    this.chkShowOrbits = document.getElementById('chkShowOrbits');
    
    this.eventLog = document.getElementById('eventLog');
    
    this.energyCanvas = document.getElementById('energyChart');
    this.energyCtx = this.energyCanvas.getContext('2d');
  }

  // Bind Events
  init(audioSynth) {
    this.audioSynth = audioSynth;
    this.setupListeners();
    this.setupSpawnerDefaults();
    this.resizeEnergyChart();
    
    // Resize chart on window resize
    window.addEventListener('resize', () => {
      this.resizeEnergyChart();
    });
  }

  setupListeners() {
    // Play / Pause
    this.btnPlayPause.addEventListener('click', () => {
      this.state.isPaused = !this.state.isPaused;
      this.updatePlayPauseButton();
    });

    // Step Simulation
    this.btnStep.addEventListener('click', () => {
      this.state.stepOnce = true;
    });

    // Reset Simulation
    this.btnReset.addEventListener('click', () => {
      this.state.resetPreset();
    });

    // Clear Simulation
    this.btnClear.addEventListener('click', () => {
      this.state.bodies = [];
      this.state.debris = [];
      this.energyHistory = [];
      this.logEvent('Deep space cleared.', 'system');
      if (this.audioSynth) this.audioSynth.triggerSound('destroy', 5000);
    });

    // Sim Speed
    this.rngSpeed.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.state.timeScale = val;
      this.valSpeed.textContent = `${val.toFixed(1)}x`;
    });

    // Preset Selection
    this.presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const presetName = btn.dataset.preset;
        this.state.currentPreset = presetName;
        this.state.resetPreset();
      });
    });

    // Spawner entity selection
    this.spawnTypes.forEach(btn => {
      btn.addEventListener('click', () => {
        this.spawnTypes.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const type = btn.dataset.type;
        this.state.spawner.type = type;
        this.updateSpawnerParamsForType(type);
      });
    });

    // Spawner sliders
    this.rngMass.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.state.spawner.mass = val;
      this.valMass.textContent = val.toLocaleString();
    });

    this.rngRadius.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.state.spawner.radius = val;
      this.valRadius.textContent = `${val} px`;
    });

    // Placement Mode toggles
    this.modeShoot.addEventListener('click', () => {
      this.modeShoot.classList.add('active');
      this.modeOrbit.classList.remove('active');
      this.state.spawner.mode = 'shoot';
    });

    this.modeOrbit.addEventListener('click', () => {
      this.modeOrbit.classList.add('active');
      this.modeShoot.classList.remove('active');
      this.state.spawner.mode = 'orbit';
    });

    // Physics constants
    this.rngG.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      physicsConfig.G = val;
      this.valG.textContent = val.toFixed(1);
    });

    this.selCollision.addEventListener('change', (e) => {
      physicsConfig.collisionMode = e.target.value;
      this.logEvent(`Laws of physics altered: Collisions set to ${e.target.value.toUpperCase()}.`, 'system');
    });

    this.rngFriction.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      physicsConfig.damping = val;
      this.valFriction.textContent = `${(val).toFixed(2)}%`;
    });

    this.chkShowOrbits.addEventListener('change', (e) => {
      this.state.drawOrbits = e.target.checked;
    });

    // Sound Toggle
    this.btnAudioToggle.addEventListener('click', () => {
      if (!this.audioSynth.isEnabled) {
        // Initialize sound context
        this.audioSynth.init().then(() => {
          this.btnAudioToggle.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Disable Sound';
          this.btnAudioToggle.classList.remove('btn-outline');
          this.btnAudioToggle.classList.add('btn-secondary');
          this.audioStatusBadge.classList.add('active');
          this.audioBadgeIcon.className = 'fa-solid fa-volume-high';
          this.audioBadgeText.textContent = 'Audio Enabled';
          
          this.audioSynth.setVolume(parseFloat(this.rngVolume.value) / 100);
          this.audioSynth.toggleDrone(true);
        });
      } else {
        // Disable sound context
        this.audioSynth.suspend().then(() => {
          this.audioSynth.isEnabled = false;
          this.audioSynth.ctx = null; // Forces re-init next time
          this.btnAudioToggle.innerHTML = '<i class="fa-solid fa-volume-high"></i> Enable Sound';
          this.btnAudioToggle.classList.remove('btn-secondary');
          this.btnAudioToggle.classList.add('btn-outline');
          this.audioStatusBadge.classList.remove('active');
          this.audioBadgeIcon.className = 'fa-solid fa-volume-xmark';
          this.audioBadgeText.textContent = 'Audio Disabled';
        });
      }
    });

    // Sound Volume
    this.rngVolume.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.valVolume.textContent = `${val}%`;
      if (this.audioSynth && this.audioSynth.isEnabled) {
        this.audioSynth.setVolume(val / 100);
      }
    });
  }

  updatePlayPauseButton() {
    if (this.state.isPaused) {
      this.lblPlayPause.textContent = 'Resume';
      this.btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i> <span id="lblPlayPause">Resume</span>';
      this.btnPlayPause.classList.remove('btn-primary');
      this.btnPlayPause.classList.add('btn-secondary');
    } else {
      this.lblPlayPause.textContent = 'Pause';
      this.btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i> <span id="lblPlayPause">Pause</span>';
      this.btnPlayPause.classList.remove('btn-secondary');
      this.btnPlayPause.classList.add('btn-primary');
    }
  }

  setupSpawnerDefaults() {
    const activeSpawn = document.querySelector('.spawn-type.active');
    if (activeSpawn) {
      this.updateSpawnerParamsForType(activeSpawn.dataset.type);
    }
  }

  updateSpawnerParamsForType(type) {
    let mass = 100;
    let radius = 10;
    let minMass = 1;
    let maxMass = 100000;
    let minRad = 2;
    let maxRad = 60;

    switch (type) {
      case 'asteroid':
        mass = 10;
        radius = 4;
        minMass = 1; maxMass = 100;
        minRad = 2; maxRad = 10;
        break;
      case 'planet':
        mass = 200;
        radius = 10;
        minMass = 50; maxMass = 2000;
        minRad = 5; maxRad = 22;
        break;
      case 'star':
        mass = 25000;
        radius = 26;
        minMass = 5000; maxMass = 80000;
        minRad = 15; maxRad = 45;
        break;
      case 'neutron':
        mass = 45000;
        radius = 16;
        minMass = 30000; maxMass = 95000;
        minRad = 8; maxRad = 24;
        break;
      case 'blackhole':
        mass = 120000;
        radius = 18;
        minMass = 50000; maxMass = 500000;
        minRad = 8; maxRad = 35;
        break;
    }

    this.rngMass.min = minMass;
    this.rngMass.max = maxMass;
    this.rngMass.value = mass;
    this.valMass.textContent = mass.toLocaleString();
    this.state.spawner.mass = mass;

    this.rngRadius.min = minRad;
    this.rngRadius.max = maxRad;
    this.rngRadius.value = radius;
    this.valRadius.textContent = `${radius} px`;
    this.state.spawner.radius = radius;
  }

  // Telemetry updates
  updateTelemetry(bodies, fps, age) {
    this.telBodies.textContent = bodies.length;
    
    const totalMass = bodies.reduce((acc, b) => acc + b.mass, 0);
    this.telTotalMass.textContent = totalMass.toLocaleString(undefined, { maximumFractionDigits: 0 });
    
    this.telFPS.textContent = Math.round(fps);
    
    // age is scaled as simulator frames/seconds
    this.telAge.textContent = `${age.toFixed(2)}B yr`;
  }

  // Logging
  logEvent(text, category = 'system') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${category}`;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = `[${this.state.age.toFixed(2)}B yr]`;
    
    entry.appendChild(timeSpan);
    entry.appendChild(document.createTextNode(` ${text}`));
    
    this.eventLog.appendChild(entry);
    this.eventLog.scrollTop = this.eventLog.scrollHeight;
    
    // Cap event log length
    while (this.eventLog.children.length > 30) {
      this.eventLog.removeChild(this.eventLog.firstChild);
    }
  }

  // Energy Conservation Telemetry Chart Rendering
  resizeEnergyChart() {
    // Sync backing resolution to screen scale
    const dpr = window.devicePixelRatio || 1;
    const rect = this.energyCanvas.parentElement.getBoundingClientRect();
    this.energyCanvas.width = rect.width * dpr;
    this.energyCanvas.height = rect.height * dpr;
    this.energyCtx.scale(dpr, dpr);
    
    // Set style dimensions
    this.energyCanvas.style.width = `${rect.width}px`;
    this.energyCanvas.style.height = `${rect.height}px`;
  }

  recordEnergy(bodies) {
    if (bodies.length === 0) {
      this.energyHistory = [];
      return;
    }

    const energy = calculateCosmicEnergy(bodies);
    this.energyHistory.push(energy);

    if (this.energyHistory.length > this.maxHistoryLength) {
      this.energyHistory.shift();
    }

    this.drawEnergyChart();
  }

  drawEnergyChart() {
    const ctx = this.energyCtx;
    const w = this.energyCanvas.width / (window.devicePixelRatio || 1);
    const h = this.energyCanvas.height / (window.devicePixelRatio || 1);
    
    ctx.clearRect(0, 0, w, h);
    
    if (this.energyHistory.length < 2) return;

    // Find min and max for self-scaling
    let maxVal = -Infinity;
    let minVal = Infinity;

    this.energyHistory.forEach(d => {
      maxVal = Math.max(maxVal, d.kinetic, d.potential, d.total);
      minVal = Math.min(minVal, d.kinetic, d.potential, d.total);
    });

    // Make sure bounds have margin
    const margin = (maxVal - minVal) * 0.15 || 100;
    maxVal += margin;
    minVal -= margin;

    const valRange = maxVal - minVal;

    // Map energy value to screen height coordinates
    const mapY = (val) => {
      // 0 is top, h is bottom.
      return h - 10 - ((val - minVal) / valRange) * (h - 20);
    };

    // Draw Zero line if in bounds
    if (minVal < 0 && maxVal > 0) {
      const zeroY = mapY(0);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(w, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const drawLine = (key, strokeColor) => {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      
      const stepX = w / (this.maxHistoryLength - 1);
      
      for (let i = 0; i < this.energyHistory.length; i++) {
        const x = i * stepX;
        const y = mapY(this.energyHistory[i][key]);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    // Draw Kinetic energy (Blue)
    drawLine('kinetic', '#00d2ff');
    // Draw Potential energy (Red)
    drawLine('potential', '#ff4b5c');
    // Draw Total energy (Green - should stay almost completely horizontal / constant!)
    drawLine('total', '#00e676');
  }
}
