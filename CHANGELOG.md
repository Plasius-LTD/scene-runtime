# Changelog

All notable changes to this project will be documented in this file.

The format is based on **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)**, and this project adheres to **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)**.

---

## [Unreleased]

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
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

[Unreleased]: https://github.com/Plasius-LTD/scene-runtime/compare/v0.1.4...HEAD


[0.1.3]: https://github.com/Plasius-LTD/scene-runtime/releases/tag/v0.1.3
[0.1.4]: https://github.com/Plasius-LTD/scene-runtime/releases/tag/v0.1.4
