# Changelog

All notable changes to this project will be documented in this file.

The format is based on **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)**, and this project adheres to **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)**.

---

## [Unreleased]

- Refresh npm dependency lockfile to current supported stable versions (weekly maintenance, 2026-09-20).

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.6] - 2026-09-13

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.5] - 2026-09-13

### Changed
- Refresh compatible npm dependencies from the registry for the weekly dependency maintenance wave.


- **Added**
  - (placeholder)

- **Changed**
  - Enforced build and public-package verification through the npm prepublish lifecycle.
  - Bound npm publication to the exact prepared `main` commit after successful push-triggered CI.
  - (placeholder)

- **Fixed**
  - Moved reviewed CI to explicit GitHub-hosted runners with package-manager caching disabled and added exact-branch manual validation.
  - (placeholder)

- **Security**
  - Updated Vitest and its coverage adapter to 4.1.11, clearing the redirect-mock path traversal advisory.
  - Removed the npm write-token path, added a fail-closed npm 11.5.1-or-newer OIDC guard, and denied fork PR code access to self-hosted CI.
  - Pinned patched transitive npm dependencies to clear the current audit baseline.
  - Added fail-closed source and npm-package admission for the administrative contributor registry and pinned the CI/CD runtime to Node.js 24.18.0 LTS.
  - (placeholder)

## [0.1.4] - 2026-06-22

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.3] - 2026-06-21

- **Added**
  - Added Player/System overlay composition contracts for ownership, focus modes, collision rules, and combat-safe reduction under `isekai.player-system.interface.enabled`.
  - Added reusable validation and composition helpers for Party/System overlay planning.

- **Added**
  - Added `@plasius/scene-runtime` package surface for runtime composition and palette adapter contracts.
  - Added composition validation and adapter-driven palette resolution helpers.

- **Changed**
  - Created the public package baseline from the `@plasius/schema` template for the scene package family.

- **Fixed**
  - Established bounded validation for invalid layout ids, duplicate anchors, and malformed ratio surfaces before downstream runtime use.

- **Security**
  - Runtime composition remains fail-closed for malformed manifests and adapter failures are surfaced through diagnostics.

---

[Unreleased]: https://github.com/Plasius-LTD/scene-runtime/compare/v0.1.6...HEAD


[0.1.3]: https://github.com/Plasius-LTD/scene-runtime/releases/tag/v0.1.3
[0.1.4]: https://github.com/Plasius-LTD/scene-runtime/releases/tag/v0.1.4
[0.1.5]: https://github.com/Plasius-LTD/scene-runtime/releases/tag/v0.1.5
[0.1.6]: https://github.com/Plasius-LTD/scene-runtime/releases/tag/v0.1.6
