import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/js/controls/OrbitControls';
import { WebGLRenderer } from 'three';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const gameContainer = document.getElementById('game-container');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, GAME_WIDTH / GAME_HEIGHT, 0.1, 1000);
const renderer = new WebGLRenderer({
  canvas: document.createElement('canvas'),
  antialias: true,
});

const orbitControls = new OrbitControls(camera, renderer.domElement);

const player = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);

const enemies = [];

let time = 0;
let score = 0;

const handleTick = (deltaTime) => {
  time += deltaTime;
  // Update player position
  player.position.x = Math.sin(time) * 10;
  player.position.z = Math.cos(time) * 10;

  // Update enemies
  enemies.forEach((enemy) => {
    enemy.position.x += Math.sin(time + enemy.seed) * 0.1;
    enemy.position.z += Math.cos(time + enemy.seed) * 0.1;
  });

  // Check collisions
  enemies.forEach((enemy) => {
    const distance = Math.sqrt(
      (player.position.x - enemy.position.x) ** 2 +
      (player.position.z - enemy.position.z) ** 2
    );
    if (distance < 2) {
      // Collision detected, reset game
      time = 0;
      score = 0;
      enemies.forEach((enemy) => {
        enemy.position.x = Math.random() * 20 - 10;
        enemy.position.z = Math.random() * 20 - 10;
      });
    }
  });

  // Update score
  score += deltaTime;
};

const handleKeyDown = (event) => {
  if (event.key === ' ') {
    // Jump
    player.position.y += 5;
  }
};

const handleKeyUp = (event) => {
  if (event.key === ' ') {
    // Fall
    player.position.y -= 5;
  }
};

const animate = () => {
  requestAnimationFrame(animate);
  const deltaTime = 0.016; // 60 FPS
  handleTick(deltaTime);
  renderer.render(scene, camera);
};

const initializeGame = async () => {
  // Initialize game state
  player.position.x = 0;
  player.position.y = 0;
  player.position.z = 0;
  scene.add(player);

  // Initialize enemies
  for (let i = 0; i < 10; i++) {
    const enemy = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    enemy.seed = Math.random();
    enemy.position.x = Math.random() * 20 - 10;
    enemy.position.z = Math.random() * 20 - 10;
    scene.add(enemy);
    enemies.push(enemy);
  }

  // Initialize camera
  camera.position.x = 0;
  camera.position.y = 5;
  camera.position.z = 5;
  camera.lookAt(player.position);

  // Initialize renderer
  renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
  gameContainer.appendChild(renderer.domElement);

  // Initialize event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  // Start game loop
  animate();
};

const App = () => {
  const [gameInitialized, setGameInitialized] = useState(false);

  useEffect(() => {
    if (!gameInitialized) {
      initializeGame();
      setGameInitialized(true);
    }
  }, [gameInitialized]);

  return <div></div>;
};

const root = ReactDOM.createRoot(gameContainer);
root.render(<App />);