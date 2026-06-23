// N-Body Gravity Simulator Physics Engine

export class Body {
  constructor({
    id,
    type = 'planet',
    x,
    y,
    vx = 0,
    vy = 0,
    mass = 100,
    radius = 10,
    color = '#00d2ff',
    isStatic = false
  }) {
    this.id = id || Math.random().toString(36).substr(2, 9);
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.mass = mass;
    this.radius = radius;
    this.color = color;
    this.isStatic = isStatic;
    this.history = [];
    this.maxHistory = 180; // Past trail points
    this.destroyed = false;
  }

  // Clone this body for trajectory predictions
  clone() {
    return new Body({
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      mass: this.mass,
      radius: this.radius,
      color: this.color,
      isStatic: this.isStatic
    });
  }

  updateTrail() {
    this.history.push({ x: this.x, y: this.y });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  clearTrail() {
    this.history = [];
  }
}

// Particle/Debris class for explosions
export class Debris {
  constructor(x, y, vx, vy, color, radius, life = 100) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.radius = radius;
    this.maxLife = life;
    this.life = life;
  }

  update(dt, friction = 0) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= (1 - friction);
    this.vy *= (1 - friction);
    this.life -= dt * 1.5;
  }
}

// Physics Configuration
export const physicsConfig = {
  G: 1.0,
  damping: 0.0, // Friction: space drag percentage
  collisionMode: 'merge', // 'merge', 'elastic', 'destroy', 'ghost'
  softening: 1.5 // Softening factor to prevent divide-by-zero or extreme accelerations
};

// Calculate N-Body interactions
// Symplectic Euler-Cromer Integration
export function stepPhysics(bodies, debris, dt, logEventCallback, audioTriggerCallback) {
  if (bodies.length === 0) return;

  const N = bodies.length;
  const ax = new Array(N).fill(0);
  const ay = new Array(N).fill(0);
  
  // 1. Calculate Gravitational Accel for all body pairs
  for (let i = 0; i < N; i++) {
    const bi = bodies[i];
    if (bi.isStatic) continue;

    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const bj = bodies[j];

      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq + physicsConfig.softening * physicsConfig.softening);

      // Force = G * m1 * m2 / r^2
      // Acceleration = F / m1 = G * m2 / r^2
      // Directional parts = dx / r, dy / r
      // Accel part = G * m2 * dx / (r^3)
      const accelMag = (physicsConfig.G * bj.mass) / (distSq * dist + 1e-4);
      ax[i] += accelMag * dx;
      ay[i] += accelMag * dy;
    }
  }

  // 2. Apply Accelerations & Damping to Velocities, then Update Positions
  for (let i = 0; i < N; i++) {
    const b = bodies[i];
    if (b.isStatic) continue;

    b.vx += ax[i] * dt;
    b.vy += ay[i] * dt;

    // Apply space friction
    if (physicsConfig.damping > 0) {
      b.vx *= (1 - physicsConfig.damping * 0.01 * dt);
      b.vy *= (1 - physicsConfig.damping * 0.01 * dt);
    }

    b.x += b.vx * dt;
    b.y += b.vy * dt;
    
    b.updateTrail();
  }

  // 3. Handle Collisions
  resolveCollisions(bodies, debris, logEventCallback, audioTriggerCallback);
}

// Collisions detector
function resolveCollisions(bodies, debris, logEventCallback, audioTriggerCallback) {
  if (physicsConfig.collisionMode === 'ghost') return;

  for (let i = 0; i < bodies.length; i++) {
    const bi = bodies[i];
    if (bi.destroyed) continue;

    for (let j = i + 1; j < bodies.length; j++) {
      const bj = bodies[j];
      if (bj.destroyed) continue;

      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const distSq = dx * dx + dy * dy;
      const minDist = bi.radius + bj.radius;

      if (distSq < minDist * minDist) {
        // Collision detected!
        handleCollision(bodies, bi, bj, debris, logEventCallback, audioTriggerCallback);
      }
    }
  }

  // Clean up destroyed bodies
  for (let i = bodies.length - 1; i >= 0; i--) {
    if (bodies[i].destroyed) {
      bodies.splice(i, 1);
    }
  }
}

// Process single collision
function handleCollision(bodies, b1, b2, debris, logEventCallback, audioTriggerCallback) {
  const mode = physicsConfig.collisionMode;

  // Sound and log triggers
  let triggerSoundType = 'collision';
  let collisionEventText = '';

  if (mode === 'merge') {
    // Determine target (heavy) and source (lighter)
    const [heavy, light] = b1.mass >= b2.mass ? [b1, b2] : [b2, b1];
    light.destroyed = true;

    // Conservation of Momentum: v_final = (m1 * v1 + m2 * v2) / (m1 + m2)
    const totalMass = heavy.mass + light.mass;
    heavy.vx = (heavy.mass * heavy.vx + light.mass * light.vx) / totalMass;
    heavy.vy = (heavy.mass * heavy.vy + light.mass * light.vy) / totalMass;

    // Weight center of mass position
    heavy.x = (heavy.mass * heavy.x + light.mass * light.x) / totalMass;
    heavy.y = (heavy.mass * heavy.y + light.mass * light.y) / totalMass;

    heavy.mass = totalMass;
    
    // Radius scaling: volume of sphere is proportional to r^3
    // However, to keep it visually pleasing in sandbox, let's use area conservation r^2
    // with some factor, or cube root:
    const oldRadius = heavy.radius;
    heavy.radius = Math.max(heavy.radius, Math.pow(Math.pow(heavy.radius, 3) + Math.pow(light.radius, 3), 1/3));
    
    // Cap radius maximums to avoid covering the whole screen
    if (heavy.type === 'blackhole') {
      heavy.radius = Math.min(heavy.radius, 80);
    } else {
      heavy.radius = Math.min(heavy.radius, 70);
    }

    // Adapt type if massive body merges with an even heavier type (e.g. planet swallowed by Black Hole)
    if (light.type === 'blackhole' && heavy.type !== 'blackhole') {
      // Swallowed by blackhole, blackhole becomes the survivor
      heavy.type = 'blackhole';
      heavy.color = light.color;
    }
    
    // Spawn some circular absorption particles
    spawnDebris(debris, light.x, light.y, light.vx, light.vy, light.color, 12, 1.5, 60);

    collisionEventText = `${heavy.type.toUpperCase()} swallowed ${light.type.toUpperCase()} (Merged to ${totalMass.toFixed(0)} M⊕)`;
    triggerSoundType = heavy.type === 'blackhole' ? 'blackhole' : 'merge';
    
    if (logEventCallback) logEventCallback(collisionEventText, 'merge');
  } 
  
  else if (mode === 'elastic') {
    // Elastic 2D physics bounce
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
    
    // Normal vector
    const nx = dx / dist;
    const ny = dy / dist;
    
    // Tangent vector
    const tx = -ny;
    const ty = nx;
    
    // Dot products velocity
    const dpTan1 = b1.vx * tx + b1.vy * ty;
    const dpTan2 = b2.vx * tx + b2.vy * ty;
    const dpNorm1 = b1.vx * nx + b1.vy * ny;
    const dpNorm2 = b2.vx * nx + b2.vy * ny;
    
    // Conservation of momentum in normal direction
    const m1 = b1.mass;
    const m2 = b2.mass;
    const dpNorm1Final = (dpNorm1 * (m1 - m2) + 2 * m2 * dpNorm2) / (m1 + m2);
    const dpNorm2Final = (dpNorm2 * (m2 - m1) + 2 * m1 * dpNorm1) / (m1 + m2);
    
    // Update velocities (tangent velocity stays the same)
    if (!b1.isStatic) {
      b1.vx = tx * dpTan1 + nx * dpNorm1Final;
      b1.vy = ty * dpTan1 + ny * dpNorm1Final;
    }
    if (!b2.isStatic) {
      b2.vx = tx * dpTan2 + nx * dpNorm2Final;
      b2.vy = ty * dpTan2 + ny * dpNorm2Final;
    }
    
    // Resolve overlap (static bodies don't move, dynamic push out)
    const overlap = (b1.radius + b2.radius) - dist;
    const pushFactor = 0.51; // slightly over 0.5 to prevent sticking
    
    if (b1.isStatic) {
      b2.x += nx * overlap;
      b2.y += ny * overlap;
    } else if (b2.isStatic) {
      b1.x -= nx * overlap;
      b1.y -= ny * overlap;
    } else {
      b1.x -= nx * overlap * pushFactor;
      b1.y -= ny * overlap * pushFactor;
      b2.x += nx * overlap * pushFactor;
      b2.y += ny * overlap * pushFactor;
    }

    // Spawn dust at impact point
    const cx = (b1.x * b2.radius + b2.x * b1.radius) / (b1.radius + b2.radius);
    const cy = (b1.y * b2.radius + b2.y * b1.radius) / (b1.radius + b2.radius);
    spawnDebris(debris, cx, cy, (b1.vx + b2.vx)/2, (b1.vy + b2.vy)/2, '#fff', 8, 1, 30);

    collisionEventText = `${b1.type.toUpperCase()} bounced off ${b2.type.toUpperCase()}`;
    triggerSoundType = 'collision';
    
    if (logEventCallback) logEventCallback(collisionEventText, 'collision');
  } 
  
  else if (mode === 'destroy') {
    // Both disintegrated!
    b1.destroyed = true;
    b2.destroyed = true;
    
    // Calculate energy / size of explosion
    const totalMass = b1.mass + b2.mass;
    const cx = (b1.x + b2.x) / 2;
    const cy = (b1.y + b2.y) / 2;
    const avgVx = (b1.vx + b2.vx) / 2;
    const avgVy = (b1.vy + b2.vy) / 2;
    
    // Spawn a large number of debris particles
    const debrisCount = Math.min(Math.floor(totalMass / 10) + 15, 60);
    spawnDebris(debris, cx, cy, avgVx, avgVy, b1.color, Math.floor(debrisCount/2), 2.5, 90);
    spawnDebris(debris, cx, cy, avgVx, avgVy, b2.color, Math.floor(debrisCount/2), 2.5, 90);
    
    collisionEventText = `STABILITY CRITICAL: ${b1.type.toUpperCase()} and ${b2.type.toUpperCase()} disintegrated!`;
    triggerSoundType = 'destroy';
    
    if (logEventCallback) logEventCallback(collisionEventText, 'collision');
  }

  // Fire Web Audio callback
  if (audioTriggerCallback) {
    audioTriggerCallback(triggerSoundType, Math.max(b1.mass, b2.mass));
  }
}

// Generate debris particle shower
function spawnDebris(debrisList, x, y, baseVx, baseVy, color, count, speedScale, life) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.2 + Math.random() * 2.8) * speedScale;
    const dvx = Math.cos(angle) * speed;
    const dvy = Math.sin(angle) * speed;
    
    const r = 1 + Math.random() * 4;
    debrisList.push(
      new Debris(
        x, 
        y, 
        baseVx + dvx, 
        baseVy + dvy, 
        color, 
        r, 
        life * (0.5 + Math.random() * 0.7)
      )
    );
  }
}

// Trajectory projection algorithm (Euler integration clone run)
export function predictTrajectories(bodies, predictionSteps, predictionDt) {
  if (bodies.length === 0) return {};

  // Clone all active bodies
  const clonedBodies = bodies.map(b => b.clone());
  const paths = {};
  
  // Initialize path arrays
  clonedBodies.forEach(b => {
    paths[b.id] = [{ x: b.x, y: b.y }];
  });

  const N = clonedBodies.length;
  
  // Integrate forward in pseudo time
  for (let step = 0; step < predictionSteps; step++) {
    const ax = new Array(N).fill(0);
    const ay = new Array(N).fill(0);

    // Compute gravity
    for (let i = 0; i < N; i++) {
      const bi = clonedBodies[i];
      if (bi.isStatic) continue;

      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const bj = clonedBodies[j];

        const dx = bj.x - bi.x;
        const dy = bj.y - bi.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq + physicsConfig.softening * physicsConfig.softening);

        const accelMag = (physicsConfig.G * bj.mass) / (distSq * dist + 1e-4);
        ax[i] += accelMag * dx;
        ay[i] += accelMag * dy;
      }
    }

    // Apply & step
    for (let i = 0; i < N; i++) {
      const b = clonedBodies[i];
      if (b.isStatic) continue;

      b.vx += ax[i] * predictionDt;
      b.vy += ay[i] * predictionDt;
      
      if (physicsConfig.damping > 0) {
        b.vx *= (1 - physicsConfig.damping * 0.01 * predictionDt);
        b.vy *= (1 - physicsConfig.damping * 0.01 * predictionDt);
      }

      b.x += b.vx * predictionDt;
      b.y += b.vy * predictionDt;

      // Log point (take points periodically to save space/performance)
      if (step % 2 === 0) {
        paths[b.id].push({ x: b.x, y: b.y });
      }
    }
  }

  return paths;
}

// Calculate Cosmic Energy Conservation values
export function calculateCosmicEnergy(bodies) {
  let kinetic = 0;
  let potential = 0;
  
  const N = bodies.length;

  for (let i = 0; i < N; i++) {
    const bi = bodies[i];
    
    // 1. Kinetic energy = 0.5 * m * v^2
    const vSq = bi.vx * bi.vx + bi.vy * bi.vy;
    kinetic += 0.5 * bi.mass * vSq;

    // 2. Potential energy = - G * m1 * m2 / r
    for (let j = i + 1; j < N; j++) {
      const bj = bodies[j];
      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const dist = Math.sqrt(dx * dx + dy * dy + physicsConfig.softening * physicsConfig.softening);
      
      potential -= (physicsConfig.G * bi.mass * bj.mass) / (dist + 1e-4);
    }
  }

  return {
    kinetic,
    potential,
    total: kinetic + potential
  };
}
