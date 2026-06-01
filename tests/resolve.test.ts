import { describe, expect, it } from "vitest";
import {
  createSceneRuntimeComposition,
  resolveScenePalette,
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

  it("rejects missing composition requests", () => {
    const result = validateSceneRuntimeComposition(
      undefined as unknown as SceneRuntimeCompositionRequest,
    );

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "required", path: "$.request" }),
    ]);
  });

  it("rejects invalid palette source and manifest roots", () => {
    const result = validateSceneRuntimeComposition({
      ...request,
      layout: {
        schemaVersion: "0.1.0",
        zones: [],
      },
      objects: {
        schemaVersion: "0.1.0",
        objects: [],
      },
      resolvePalette: {
        paletteId: " ",
        enabled: true,
        adapter: {
          id: "",
          loadPalette: async () => undefined,
        },
      },
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-id", path: "$.resolvePalette.paletteId" }),
        expect.objectContaining({ code: "invalid-id", path: "$.resolvePalette.adapter.id" }),
        expect.objectContaining({ code: "invalid-value", path: "$.layout" }),
        expect.objectContaining({ code: "invalid-value", path: "$.objects" }),
      ]),
    );
  });

  it("rejects empty object manifests", () => {
    const result = validateSceneRuntimeComposition({
      ...request,
      objects: {
        schemaVersion: SCENE_RUNTIME_SCHEMA_VERSION,
        objects: [],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "required", path: "$.objects.objects" }),
      ]),
    );
  });

  it("reports malformed zones and rectangles", () => {
    const result = validateSceneRuntimeComposition({
      ...request,
      layout: {
        schemaVersion: SCENE_RUNTIME_SCHEMA_VERSION,
        zones: [
          null,
          {
            id: "",
            rect: null,
          },
          {
            id: "secondary",
            rect: {
              x: 0,
              y: -1,
              width: 1,
              height: 1,
            },
          },
        ],
      },
    } as unknown as SceneRuntimeCompositionRequest);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "required", path: "$.layout.zones[0]" }),
        expect.objectContaining({ code: "invalid-id", path: "$.layout.zones[1].id" }),
        expect.objectContaining({ code: "required", path: "$.layout.zones[1].rect" }),
        expect.objectContaining({ code: "invalid-value", path: "$.layout.zones[2].rect.y" }),
      ]),
    );
  });

  it("reports palette adapters that return no manifest", async () => {
    const result = await resolveScenePalette({
      ...request,
      resolvePalette: {
        paletteId: "actor-palette",
        enabled: true,
        adapter: {
          id: "empty",
          loadPalette: async () => undefined,
        },
      },
    });

    expect(result.palette).toBeUndefined();
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "missing-reference", path: "$.resolvePalette" }),
    ]);
  });

  it("reports palette adapters that return the wrong schema version", async () => {
    const result = await resolveScenePalette({
      ...request,
      resolvePalette: {
        paletteId: "actor-palette",
        enabled: true,
        adapter: {
          id: "wrong-version",
          loadPalette: async () => ({
            schemaVersion: "0.1.0",
            paletteId: "actor-palette",
            clips: [],
          }),
        },
      },
    });

    expect(result.palette).toBeUndefined();
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "invalid-value", path: "$.resolvePalette.palette.schemaVersion" }),
    ]);
  });

  it("throws validation details when creating invalid compositions", async () => {
    await expect(
      createSceneRuntimeComposition({
        ...request,
        layout: {
          schemaVersion: SCENE_RUNTIME_SCHEMA_VERSION,
          zones: [],
        },
      }),
    ).rejects.toThrow("layout must include at least one zone");
  });
});
