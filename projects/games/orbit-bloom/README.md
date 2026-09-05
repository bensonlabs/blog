# Orbit Bloom

A tiny arcadey browser game about harvesting glowing motes that become your shield. Survive the swarm, pulse at the right moment, and keep your core intact.

## How to play

- **Move** your core around the arena to collect motes (touch or mouse)
- **Pulse** to release your collected motes as a defensive burst
- Avoid comets — they speed up over time
- Keep your core intact as long as possible

## Versions

### v2 — `orbit-bloom-v2.html`

The original release. Solid gameplay with smooth canvas rendering, mote harvesting, comet swarm mechanics, score tracking, and touch controls.

### v3 — `orbit-bloom-v3.html` *(recommended)*

Builds on v2 with the following improvements:

| Change | Detail |
|---|---|
| Tabular numbers | `font-variant-numeric: tabular-nums` applied to HUD elements so score digits don't shift layout |
| Reduced-motion | `@media (prefers-reduced-motion: reduce)` support — disables animations for users who prefer it |

### v4 — `orbit-bloom-v4.html`

The newest standalone iteration. It is available alongside v2 and v3 for direct play.

## Version selection

`index.html` is a lightweight selector page that presents both versions as cards and links directly to each `.html` file. Navigate to:

```
/projects/games/orbit-bloom/
```

to see the selector, or go directly to a version:

```
/projects/games/orbit-bloom/orbit-bloom-v2.html
/projects/games/orbit-bloom/orbit-bloom-v3.html
/projects/games/orbit-bloom/orbit-bloom-v4.html
```
