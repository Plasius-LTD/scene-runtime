import { describe, expect, it } from "vitest";
import {
  SCENE_RUNTIME_PLAYER_SYSTEM_INTERFACE_FLAG_ID,
  SCENE_RUNTIME_SCHEMA_VERSION,
  composeSceneRuntimeOverlayComposition,
  validateSceneRuntimeOverlayComposition,
  type SceneRuntimeOverlayCompositionRequest,
} from "../src/index.js";

const request: SceneRuntimeOverlayCompositionRequest = {
  layout: {
    schemaVersion: SCENE_RUNTIME_SCHEMA_VERSION,
    zones: [
      {
        id: "player-hud",
        rect: {
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        },
      },
      {
        id: "party-strip",
        rect: {
          x: 0,
          y: 40,
          width: 100,
          height: 20,
        },
      },
    ],
  },
  surfaces: [
    {
      id: "mission-focus",
      owner: "player-system",
      kind: "focus-pane",
      zoneId: "player-hud",
      anchorId: "focus-pane-anchor",
      interactive: true,
      priority: 10,
      combatBehavior: "reduce",
    },
    {
      id: "party-status",
      owner: "party-system",
      kind: "world-panel",
      zoneId: "party-strip",
      interactive: false,
      priority: 8,
      combatBehavior: "persist",
    },
    {
      id: "threat-marker",
      owner: "player-system",
      kind: "alert-marker",
      zoneId: "player-hud",
      interactive: false,
      priority: 12,
      combatBehavior: "persist",
    },
  ],
  focus: {
    mode: "combat-safe",
    activeOwner: "player-system",
    focusedSurfaceId: "mission-focus",
    inCombat: true,
  },
};

describe("player-system overlay composition", () => {
  it("exports the inherited feature flag for interface foundations", () => {
    expect(SCENE_RUNTIME_PLAYER_SYSTEM_INTERFACE_FLAG_ID).toBe(
      "isekai.player-system.interface.enabled",
    );
  });

  it("validates reusable overlay ownership and focus contracts", () => {
    const result = validateSceneRuntimeOverlayComposition(request);

    expect(result.valid).toBe(true);
    expect(result.value?.surfaces).toHaveLength(3);
  });

  it("composes player and party surfaces while reducing focused panes during combat", () => {
    const composition = composeSceneRuntimeOverlayComposition(request);

    expect(composition.owners).toEqual(["party-system", "player-system"]);
    expect(composition.surfaceCount).toBe(3);
    expect(composition.focusedSurface?.id).toBe("mission-focus");
    expect(composition.reducedSurfaceIds).toEqual(["mission-focus"]);
    expect(composition.suspendedSurfaceIds).toEqual([]);
  });

  it("rejects invalid zone and focus ownership references", () => {
    const result = validateSceneRuntimeOverlayComposition({
      ...request,
      surfaces: [
        {
          ...request.surfaces[0]!,
          zoneId: "missing-zone",
        },
      ],
      focus: {
        ...request.focus,
        focusedSurfaceId: "party-status",
      },
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.surfaces[0].zoneId" }),
        expect.objectContaining({ path: "$.focus.focusedSurfaceId" }),
      ]),
    );
  });

  it("rejects malformed top-level overlay requests and bad field shapes", () => {
    const result = validateSceneRuntimeOverlayComposition({
      layout: {
        schemaVersion: "0.9.0",
        zones: [],
      },
      surfaces: [],
      focus: null,
    });

    expect(validateSceneRuntimeOverlayComposition(undefined).valid).toBe(false);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.layout" }),
        expect.objectContaining({ path: "$.surfaces" }),
        expect.objectContaining({ path: "$.focus" }),
      ]),
    );
  });

  it("rejects malformed surface, focus, and collision rule details", () => {
    const result = validateSceneRuntimeOverlayComposition({
      layout: request.layout,
      surfaces: [
        {
          id: "bad id",
          owner: "guild-system",
          kind: "unknown",
          zoneId: "missing-zone",
          anchorId: "bad id",
          interactive: "yes",
          priority: -1,
          combatBehavior: "blink",
        },
      ],
      focus: {
        mode: "immersive",
        activeOwner: "guild-system",
        focusedSurfaceId: "bad id",
        inCombat: "sometimes",
      },
      collisionRules: [
        {
          existingOwner: "guild-system",
          incomingOwner: "player-system",
          zoneId: "missing-zone",
          kind: "ghost-panel",
          resolution: "bounce",
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.surfaces[0].id" }),
        expect.objectContaining({ path: "$.surfaces[0].owner" }),
        expect.objectContaining({ path: "$.surfaces[0].kind" }),
        expect.objectContaining({ path: "$.surfaces[0].zoneId" }),
        expect.objectContaining({ path: "$.surfaces[0].anchorId" }),
        expect.objectContaining({ path: "$.surfaces[0].interactive" }),
        expect.objectContaining({ path: "$.surfaces[0].priority" }),
        expect.objectContaining({ path: "$.surfaces[0].combatBehavior" }),
        expect.objectContaining({ path: "$.focus.mode" }),
        expect.objectContaining({ path: "$.focus.activeOwner" }),
        expect.objectContaining({ path: "$.focus.inCombat" }),
        expect.objectContaining({ path: "$.collisionRules[0].zoneId" }),
        expect.objectContaining({ path: "$.collisionRules[0].kind" }),
        expect.objectContaining({ path: "$.collisionRules[0].resolution" }),
      ]),
    );
  });

  it("rejects duplicate layout ids and invalid collisionRules container shapes", () => {
    const layoutResult = validateSceneRuntimeOverlayComposition({
      ...request,
      layout: {
        schemaVersion: SCENE_RUNTIME_SCHEMA_VERSION,
        zones: [
          request.layout.zones[0]!,
          {
            id: "player-hud",
            rect: { x: 0, y: -1, width: 100, height: 40 },
          },
        ],
      },
    });
    const collisionContainerResult = validateSceneRuntimeOverlayComposition({
      ...request,
      collisionRules: "invalid",
    });

    expect(layoutResult.valid).toBe(false);
    expect(layoutResult.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.layout.zones[1].id" }),
        expect.objectContaining({ path: "$.layout.zones[1].rect.y" }),
      ]),
    );
    expect(collisionContainerResult.valid).toBe(false);
    expect(collisionContainerResult.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.collisionRules" }),
      ]),
    );
  });

  it("replaces existing overlays when collision rules prefer the incoming owner", () => {
    const composition = composeSceneRuntimeOverlayComposition({
      ...request,
      surfaces: [
        {
          id: "party-focus",
          owner: "party-system",
          kind: "focus-pane",
          zoneId: "player-hud",
          interactive: false,
          priority: 11,
          combatBehavior: "persist",
        },
        {
          ...request.surfaces[0]!,
          priority: 10,
        },
      ],
      collisionRules: [
        {
          existingOwner: "party-system",
          incomingOwner: "player-system",
          zoneId: "player-hud",
          kind: "focus-pane",
          resolution: "replace-existing",
        },
      ],
    });

    expect(composition.suspendedSurfaceIds).toEqual(["party-focus"]);
    expect(composition.focusedSurface?.id).toBe("mission-focus");
  });

  it("suspends incoming overlays when collision rules preserve the existing owner", () => {
    const composition = composeSceneRuntimeOverlayComposition({
      ...request,
      surfaces: [
        {
          id: "player-alert",
          owner: "player-system",
          kind: "alert-marker",
          zoneId: "player-hud",
          interactive: false,
          priority: 10,
          combatBehavior: "persist",
        },
        {
          id: "party-alert",
          owner: "party-system",
          kind: "alert-marker",
          zoneId: "player-hud",
          interactive: false,
          priority: 9,
          combatBehavior: "persist",
        },
      ],
      focus: {
        mode: "ambient",
        activeOwner: "player-system",
        inCombat: false,
      },
      collisionRules: [
        {
          existingOwner: "player-system",
          incomingOwner: "party-system",
          zoneId: "player-hud",
          kind: "alert-marker",
          resolution: "suspend-incoming",
        },
      ],
    });

    expect(composition.surfaceCount).toBe(1);
    expect(composition.suspendedSurfaceIds).toEqual(["party-alert"]);
    expect(composition.reducedSurfaceIds).toEqual([]);
  });

  it("warns when focused mode is requested during combat and throws on invalid compositions", () => {
    const composition = composeSceneRuntimeOverlayComposition({
      ...request,
      focus: {
        ...request.focus,
        mode: "focused",
      },
      surfaces: [
        ...request.surfaces,
        {
          id: "combat-hidden-popup",
          owner: "player-system",
          kind: "target-popup",
          zoneId: "player-hud",
          interactive: true,
          priority: 4,
          combatBehavior: "suspend",
        },
      ],
    });

    expect(composition.diagnostics.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.focus.mode" }),
      ]),
    );
    expect(composition.suspendedSurfaceIds).toEqual(["combat-hidden-popup"]);

    expect(() =>
      composeSceneRuntimeOverlayComposition({
        ...request,
        surfaces: [],
      }),
    ).toThrow("Invalid scene runtime overlay request.");
  });
});
