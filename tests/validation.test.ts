import { describe, expect, it } from "vitest";
import {
  SCENE_RUNTIME_SITE_INTEGRATION_FLAG_ID,
  SCENE_RUNTIME_SCHEMA_VERSION,
  composeSceneRuntime,
} from "../src/index.js";

const layout = {
  schemaVersion: SCENE_RUNTIME_SCHEMA_VERSION,
  zones: [
    {
      id: "primary",
      rect: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
    },
  ],
};

const objects = {
  schemaVersion: SCENE_RUNTIME_SCHEMA_VERSION,
  objects: [
    {
      id: "hero",
      transform: {
        x: 0,
        y: 0,
        scale: 1,
      },
    },
  ],
};

describe("scene runtime composition validation", () => {
  it("validates required rollout flag identity", () => {
    expect(SCENE_RUNTIME_SITE_INTEGRATION_FLAG_ID).toBe(
      "scene.runtime.site-integration.enabled",
    );
  });

  it("creates deterministic composition for disabled palette source", async () => {
    const composition = await composeSceneRuntime({
      layout,
      objects,
      resolvePalette: {
        paletteId: "hero-palette",
        enabled: false,
        adapter: {
          id: "noop",
          loadPalette: async () => {
            throw new Error("should not call when disabled");
          },
        },
      },
    });

    expect(composition.layoutZoneCount).toBe(1);
    expect(composition.objectCount).toBe(1);
    expect(composition.activePalette).toBeUndefined();
    expect(composition.diagnostics.warnings.length).toBe(1);
  });

  it("loads palette from adapter when enabled", async () => {
    const composition = await composeSceneRuntime({
      layout,
      objects,
      resolvePalette: {
        paletteId: "hero-palette",
        enabled: true,
        adapter: {
          id: "memory",
          loadPalette: async () => ({
            schemaVersion: SCENE_RUNTIME_SCHEMA_VERSION,
            paletteId: "hero-palette",
            clips: [{ id: "idle", durationMs: 1000 }],
          }),
        },
      },
    });

    expect(composition.activePalette?.sourceId).toBe("memory");
    expect(composition.activePalette?.palette.paletteId).toBe("hero-palette");
  });

  it("falls back to warnings on failed palette adapter", async () => {
    const composition = await composeSceneRuntime({
      layout,
      objects,
      resolvePalette: {
        paletteId: "missing",
        enabled: true,
        adapter: {
          id: "failing",
          loadPalette: async () => {
            throw new Error("network");
          },
        },
      },
    });

    expect(composition.activePalette).toBeUndefined();
    expect(
      composition.diagnostics.errors.concat(composition.diagnostics.warnings).length,
    ).toBe(1);
  });
});
