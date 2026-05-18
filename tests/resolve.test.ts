import { describe, expect, it } from "vitest";
import {
  validateSceneRuntimeComposition,
  type SceneRuntimeCompositionRequest,
  SCENE_RUNTIME_SCHEMA_VERSION,
} from "../src/index.js";

const request: SceneRuntimeCompositionRequest = {
  layout: {
    schemaVersion: SCENE_RUNTIME_SCHEMA_VERSION,
    zones: [
      {
        id: "main",
        rect: {
          x: 5,
          y: 5,
          width: 200,
          height: 100,
        },
      },
    ],
  },
  objects: {
    schemaVersion: SCENE_RUNTIME_SCHEMA_VERSION,
    objects: [
      {
        id: "actor",
        transform: {
          x: 10,
          y: 12,
          scale: 1,
        },
      },
    ],
  },
  resolvePalette: {
    paletteId: "actor-palette",
    enabled: true,
    adapter: {
      id: "memory",
      loadPalette: async () => {
        throw new Error("not ready");
      },
    },
  },
};

describe("scene runtime structure tests", () => {
  it("accepts structurally valid request", () => {
    const result = validateSceneRuntimeComposition(request);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual(
      expect.arrayContaining([]),
    );
  });

  it("rejects empty zones", () => {
    const result = validateSceneRuntimeComposition({
      ...request,
      layout: {
        schemaVersion: SCENE_RUNTIME_SCHEMA_VERSION,
        zones: [],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "required", path: "$.layout.zones" }),
      ]),
    );
  });
});
