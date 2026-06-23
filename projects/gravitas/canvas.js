// Canvas Visual Rendering Module

export const camera = {
  x: 0, // Focus point in physics space (X)
  y: 0, // Focus point in physics space (Y)
  zoom: 1.0,
  minZoom: 0.1,
  maxZoom: 10.0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  camStartX: 0,
  camStartY: 0
};

let stars = [];
let nebulae = [];
const STAR_COUNT = 250;

// Initialize background stars and nebulae
export function initBackground(width, height) {
  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * 4000 - 2000,
      y: Math.random() * 4000 - 2000,
      size: Math.random() * 1.8 + 0.2,
      brightness: Math.random() * 0.5 + 0.5,
      parallax: Math.random() * 0.4 + 0.6 // Parallax layers
    });
  }

  // Create static space nebulae coordinates
  nebulae = [
    { x: -500, y: -300, radius: 800, color: 'rgba(0, 210, 255, 0.04)' },
    { x: 600, y: 400, radius: 1000, color: 'rgba(182, 26, 255, 0.03)' },
    { x: -200, y: 700, radius: 700, color: 'rgba(255, 126, 71, 0.02)' },
    { x: 400, y: -800, radius: 900, color: 'rgba(0, 230, 118, 0.02)' }
  ];
}

// Convert Physics to Screen Space
export function toScreen(x, y, canvas) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  return {
    x: cx + (x - camera.x) * camera.zoom,
    y: cy + (y - camera.y) * camera.zoom
  };
}

// Convert Screen Space to Physics Space
export function toPhysics(screenX, screenY, canvas) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  return {
    x: camera.x + (screenX - cx) / camera.zoom,
    y: camera.y + (screenY - cy) / camera.zoom
  };
}

// Draw the entire scene
export function drawScene(canvas, ctx, bodies, debris, predictedPaths, spawnerState, drawOrbits) {
  // Clear screen
  ctx.fillStyle = '#030307';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1. Draw Nebula Background
  drawNebula(canvas, ctx);

  // 2. Draw Parallax Starfield
  drawStars(canvas, ctx);

  // Save context for camera transformation
  ctx.save();
  // Translate to center, apply scale, then translate by camera
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.translate(cx, cy);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // 3. Draw Predicted Trajectories
  if (drawOrbits && predictedPaths) {
    drawTrajectories(ctx, predictedPaths, bodies);
  }

  // 4. Draw Trails
  drawTrails(ctx, bodies);

  // 5. Draw Debris
  drawDebris(ctx, debris);

  // 6. Draw Bodies
  drawBodies(ctx, bodies);

  // 7. Draw Launch Vector Guidance
  if (spawnerState && spawnerState.isCreating && spawnerState.dragCurrent) {
    drawLaunchVector(ctx, spawnerState);
  }

  ctx.restore();
}

// Draw background nebulae
function drawNebula(canvas, ctx) {
  ctx.globalCompositeOperation = 'screen';
  nebulae.forEach(neb => {
    // Convert nebula positions to screen space manually or let them pan
    const pos = {
      x: canvas.width / 2 + (neb.x - camera.x * 0.3) * camera.zoom * 0.5,
      y: canvas.height / 2 + (neb.y - camera.y * 0.3) * camera.zoom * 0.5
    };
    const rad = neb.radius * camera.zoom * 0.5;
    
    if (rad <= 0) return;

    const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, rad);
    grad.addColorStop(0, neb.color);
    grad.addColorStop(0.5, neb.color.replace('0.0', '0.005'));
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, rad, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';
}

// Draw stars with parallax
function drawStars(canvas, ctx) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  stars.forEach(star => {
    // Parallax displacement based on camera coordinates
    const sx = cx + (star.x - camera.x * star.parallax) * camera.zoom;
    const sy = cy + (star.y - camera.y * star.parallax) * camera.zoom;

    // Check bounds
    if (sx >= 0 && sx <= canvas.width && sy >= 0 && sy <= canvas.height) {
      const starRadius = Math.max(0.1, star.size * camera.zoom * 0.6);
      
      ctx.fillStyle = `rgba(240, 240, 255, ${star.brightness})`;
      ctx.beginPath();
      ctx.arc(sx, sy, starRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Rare glowing stars
      if (star.size > 1.6 && camera.zoom > 0.6) {
        ctx.fillStyle = `rgba(0, 210, 255, ${star.brightness * 0.3})`;
        ctx.beginPath();
        ctx.arc(sx, sy, starRadius * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

// Draw trails behind planets
function drawTrails(ctx, bodies) {
  bodies.forEach(body => {
    if (body.history.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(body.history[0].x, body.history[0].y);

    for (let i = 1; i < body.history.length; i++) {
      ctx.lineTo(body.history[i].x, body.history[i].y);
    }

    // Set styling: fade out at the tail end
    ctx.lineWidth = Math.max(0.5, body.radius * 0.15);
    ctx.strokeStyle = body.color;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  });
}

// Draw projected RK4/Euler orbital paths
function drawTrajectories(ctx, paths, bodies) {
  ctx.save();
  ctx.setLineDash([2, 5]);
  
  bodies.forEach(body => {
    const path = paths[body.id];
    if (!path || path.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    
    ctx.lineWidth = 1.2 / camera.zoom;
    ctx.strokeStyle = body.color;
    ctx.globalAlpha = 0.55;
    ctx.stroke();
  });
  
  ctx.restore();
}

// Draw body objects with specific shaders and details
function drawBodies(ctx, bodies) {
  bodies.forEach(body => {
    ctx.save();
    
    // Position
    const { x, y, radius, color, type } = body;

    switch (type) {
      case 'asteroid':
        // Asteroid: Grey, rough outline
        ctx.fillStyle = '#8e8e93';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;

      case 'planet':
        // Planet: Linear color gradient, shiny atmospheric glow rim
        const gradPlanet = ctx.createRadialGradient(x - radius*0.3, y - radius*0.3, radius * 0.1, x, y, radius);
        gradPlanet.addColorStop(0, '#ffffff');
        gradPlanet.addColorStop(0.2, color);
        gradPlanet.addColorStop(0.8, darkenColor(color, 0.4));
        gradPlanet.addColorStop(1, '#000000');

        ctx.fillStyle = gradPlanet;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Atmospheric rim ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        break;

      case 'star':
        // Star: Radiant radial gradient, glow shadow effects
        ctx.shadowBlur = radius * 1.5;
        ctx.shadowColor = color;
        
        const gradStar = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradStar.addColorStop(0, '#ffffff');
        gradStar.addColorStop(0.25, '#fffbeb');
        gradStar.addColorStop(0.65, color);
        gradStar.addColorStop(1, darkenColor(color, 0.6));

        ctx.fillStyle = gradStar;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'neutron':
        // Pulsar/Neutron star: Pulse, high brightness core + jet lines
        const time = Date.now() * 0.006;
        const pulseRadius = radius * (1 + Math.sin(time) * 0.08);
        
        ctx.shadowBlur = radius * 3.5;
        ctx.shadowColor = '#00d2ff';
        
        // Glow core
        const gradNeutron = ctx.createRadialGradient(x, y, 0, x, y, pulseRadius);
        gradNeutron.addColorStop(0, '#ffffff');
        gradNeutron.addColorStop(0.4, '#e0f7fa');
        gradNeutron.addColorStop(1, '#00b0ff');
        
        ctx.fillStyle = gradNeutron;
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pulsar light ray jet beams
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'screen';
        
        const rayLength = radius * 12;
        const beamGrad = ctx.createLinearGradient(x, y - rayLength, x, y + rayLength);
        beamGrad.addColorStop(0, 'rgba(0, 210, 255, 0)');
        beamGrad.addColorStop(0.35, 'rgba(0, 210, 255, 0.4)');
        beamGrad.addColorStop(0.5, '#ffffff');
        beamGrad.addColorStop(0.65, 'rgba(0, 210, 255, 0.4)');
        beamGrad.addColorStop(1, 'rgba(0, 210, 255, 0)');

        ctx.save();
        ctx.translate(x, y);
        // Rotate beams slightly
        ctx.rotate(time * 0.02);
        ctx.fillStyle = beamGrad;
        // Verticle jet
        ctx.fillRect(-2, -rayLength, 4, rayLength * 2);
        // Horizontal jet (fainter)
        ctx.globalAlpha = 0.3;
        ctx.fillRect(-rayLength, -1, rayLength * 2, 2);
        ctx.restore();
        break;

      case 'blackhole':
        // Black Hole: Black center event horizon, gravitational lensing rings, accretion disk
        const spinTime = Date.now() * 0.001;
        
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'screen';
        
        // 1. Accretion Disk (spinning rings)
        const diskRadius = radius * 2.8;
        const gradAccretion = ctx.createRadialGradient(x, y, radius, x, y, diskRadius);
        gradAccretion.addColorStop(0, '#000000');
        gradAccretion.addColorStop(0.1, '#ff6d00'); // orange accretion boundary
        gradAccretion.addColorStop(0.45, 'rgba(182, 26, 255, 0.45)'); // purple lensing disk
        gradAccretion.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 0.35); // flatten to simulate orbital plane
        ctx.rotate(spinTime);
        ctx.fillStyle = gradAccretion;
        ctx.beginPath();
        ctx.arc(0, 0, diskRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Accretion fine dust lines
        ctx.strokeStyle = 'rgba(255, 126, 71, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(182, 26, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 2.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 2. Event Horizon (solid black void cover on top)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Glowing warped lens outline
        ctx.strokeStyle = '#b61aff';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#b61aff';
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  });
}

// Draw space dust explosion particles
function drawDebris(ctx, debris) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  
  debris.forEach(d => {
    ctx.fillStyle = d.color;
    ctx.globalAlpha = d.life / d.maxLife;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// Draw vector shoot guidance (Dotted line + arrow head)
function drawLaunchVector(ctx, spawner) {
  const start = spawner.dragStart;
  const current = spawner.dragCurrent;
  
  // Calculate vector components
  const dx = start.x - current.x;
  const dy = start.y - current.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Vector line
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(current.x, current.y);
  ctx.stroke();
  
  // Draw predicted trajectory vector line (where it will go)
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(0, 230, 118, 0.6)';
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  // Velocity points in direction from current mouse to start drag (inverse shoot)
  ctx.lineTo(start.x + dx * 1.5, start.y + dy * 1.5);
  ctx.stroke();

  // Draw arrow head at end of prediction
  const angle = Math.atan2(dy, dx);
  const headLength = 10;
  const ax = start.x + dx * 1.5;
  const ay = start.y + dy * 1.5;
  
  ctx.fillStyle = 'rgba(0, 230, 118, 0.6)';
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - headLength * Math.cos(angle - Math.PI / 6), ay - headLength * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(ax - headLength * Math.cos(angle + Math.PI / 6), ay - headLength * Math.sin(angle + Math.PI / 6));
  ctx.fill();
  
  // Draw placeholder circle where it will launch
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(start.x, start.y, spawner.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// Utility: darken a hex color for dimensional gradients
function darkenColor(hex, percent) {
  // Simple hex darken
  hex = hex.replace(/^\s*#|\s*$/g, '');
  if (hex.length === 3) {
    hex = hex.replace(/(.)/g, '$1$1');
  }
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);

  r = Math.floor(r * (1 - percent));
  g = Math.floor(g * (1 - percent));
  b = Math.floor(b * (1 - percent));

  return `rgb(${r}, ${g}, ${b})`;
}
