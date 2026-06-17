# @plasius/scene-runtime

Composable scene runtime contracts for object placement, layout zones, and configurable palette adapters.

## Installation

```bash
npm install @plasius/scene-runtime
```

## Rollout ownership

This package follows site-owned rollout control:

- `scene.runtime.site-integration.enabled`
- Player/Party overlay composition foundations inherit `isekai.player-system.interface.enabled`

## Package exports

- schema constants and composition interfaces
- deterministic composition validation
- adapter-based palette resolution for runtime integration
- overlay-composition contracts for Player/System ownership, focus modes, collision rules, and combat-safe reduction
- `composeSceneRuntimeOverlayComposition()` for reusable Party/System shell planning

## Development

```bash
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run pack:check
```

## Overlay composition model

- overlay owners are explicit: `player-system` and `party-system`
- focus modes are bounded to `ambient`, `focused`, and `combat-safe`
- collision rules declare whether a surface stacks, replaces an existing owner, or suspends the incoming surface
- combat behavior is explicit per surface: `persist`, `reduce`, or `suspend`
