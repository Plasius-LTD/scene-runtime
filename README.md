# @plasius/scene-runtime

[![npm version](https://img.shields.io/npm/v/@plasius/scene-runtime.svg)](https://www.npmjs.com/package/@plasius/scene-runtime)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Plasius-LTD/scene-runtime/ci.yml?branch=main&label=build&style=flat)](https://github.com/Plasius-LTD/scene-runtime/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/codecov/c/github/Plasius-LTD/scene-runtime)](https://codecov.io/gh/Plasius-LTD/scene-runtime)
[![License](https://img.shields.io/github/license/Plasius-LTD/scene-runtime)](./LICENSE)
[![Code of Conduct](https://img.shields.io/badge/code%20of%20conduct-yes-blue.svg)](./CODE_OF_CONDUCT.md)
[![Security Policy](https://img.shields.io/badge/security%20policy-yes-orange.svg)](./SECURITY.md)
[![Changelog](https://img.shields.io/badge/changelog-md-blue.svg)](./CHANGELOG.md)

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

<!-- BEGIN PLASIUS RELEASE INTEGRITY -->
## Release integrity

CI keeps the administrative contributor registry outside Git and npm package
artifacts using exact, case-normalised path checks. CI runs only on explicit
`[self-hosted, Linux, X64]` runners for pushes to branches in this repository
and manual dispatches. PR events, including fork PRs, cannot schedule CI;
maintainers review external contributions before admitting them to a trusted
branch. A fixed repository/event guard protects both jobs, checkout credentials
are not persisted, package-manager caching is disabled, and jobs have bounded
timeouts. New pushes cancel superseded CI for the same branch. Publication uses
the GitHub-hosted `production` job with Node 24 and
pinned npm 11.6.2. It is token-free and proceeds only while the prepared SHA
is the exact `main` head after successful push-triggered CI. Do not dispatch CD
until the npm trusted-publisher binding is verified.

For changes to trusted branches, open a PR and verify its push-triggered CI at
the exact head commit before merging. Release through `cd.yml` on `main` with
`phase=prepare` and `bump=patch`; the existing workflow prepares a new version,
waits for exact-main push CI, and dispatches the hosted OIDC publish phase.
Release preparation, sealed-package validation, publication dispatch, and npm
publication stay GitHub-hosted as the release path; scheduled dependency
maintenance also stays hosted and does not supply release CI evidence.

Feature `platform.public-artifact-integrity.enabled` belongs to the site rollout
control plane. Enabled permits staged distribution; disabled pauses promotion.
Integrity and trust gates remain mandatory in either state. To roll back this
workflow change, disable CI and the CD publication channel while correcting the
workflow; do not add hosted CI fallback, restore the administrative registry,
or republish a removed npm version.
<!-- END PLASIUS RELEASE INTEGRITY -->
