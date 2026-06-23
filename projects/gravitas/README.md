##### Made by Google Antigravy with Gemini 3.5 Flash (medium)
# GRAVITAS: Stellar Sandbox & Gravity Simulator

An interactive, high-fidelity N-body gravity simulator built for the browser. Featuring real-time orbital projection, procedural ambient audio synthesis, a glassmorphic dashboard, and live telemetry tracking.

---

## Key Features

*   **Symplectic Euler Physics Engine**: Real-time gravitation calculation with numerical softening to ensure simulation stability even during close-body flybys.
*   **Runge-Kutta 4 (RK4) Trajectory Forecasts**: Calculates and draws projected orbital paths in real-time, showing where planets will go before you launch them.
*   **Procedural Web Audio Synthesizer**: Generates ambient space drones using low-pass filters and LFOs, and synthesizes dynamic chimes, sweep sounds, and explosions on cosmic events (collisions, merges, and singularities).
*   **Interactive Spawner Lab**: Launch custom-mass asteroids, planets, stars, pulsars, or black holes.
*   **Two Launch Modes**:
    *   **Custom Vector**: Slingshot launch bodies with drag-and-shoot vector control.
    *   **Auto-Orbit**: Automatically calculates stable Keplerian velocities around the nearest heavy body for instant stable orbits.
*   **Dynamic Collision Behaviors**: Accretion (merging), elastic bounces, or absolute stellar disintegration into glowing space dust.
*   **Telemetry Dashboard**: Track live physical properties including Active Bodies, Total Mass, FPS, and Cosmic Age.
*   **Cosmic Energy Conservation Graph**: A secondary canvas plots Kinetic (Ek), Potential (Ep), and Total Energy (Et) to visualize laws of thermodynamics in action.

---

## Controls

*   **Left Click & Drag (Custom Vector Mode)**: Draw slingshot vector guidelines to shoot objects.
*   **Left Click (Auto-Orbit Mode)**: Drop bodies directly into stable circular orbits.
*   **Right Click & Drag**: Pan the viewport camera.
*   **Scroll Wheel**: Zoom in/out (centered directly on your mouse cursor).

---

## Cosmos Presets

1.  **Solar System**: A stable solar system configuration with a sun, orbiting planets, and a co-orbiting moon.
2.  **Binary Stars**: Two equal-mass stars co-orbiting their barycenter with planets negotiating chaotic figure-8 orbits.
3.  **Black Hole**: A supermassive black hole with gravitational lensing devouring a swirling accretion disk of 75 asteroids.
4.  **Three-Body Chaos**: An unstable, chaotic dance of three stars demonstrating N-body unpredictability.
5.  **Stellar Collision**: A high-speed merger of two heavy objects colliding to form a black hole and debris shower.

---

## Installation & Running Locally

Since the project is built with vanilla HTML5, CSS3, and ES6 JavaScript, there are no dependencies or compile steps required.

1.  Clone the repository or download the folder.
2.  Start a local server in the project folder to enable JS module loading:
    ```bash
    # Python 3
    python3 -m http.server 8000
    
    # Node.js
    npx serve
    ```
3.  Open `http://localhost:8000` in your web browser.

---

## Tech Stack

*   **Core**: HTML5, JavaScript (ES6 Modules)
*   **Visuals**: Canvas API, CSS3 Glassmorphism
*   **Audio**: Web Audio API (procedural synthesis)
*   **Icons**: FontAwesome CDN

