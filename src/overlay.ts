import { type SceneRuntimeCompositionDiagnostics,
  type SceneRuntimeLayoutManifest,
  type SceneRuntimeValidationIssue,
  type SceneRuntimeValidationResult,
} from "./types.js";

export const SCENE_RUNTIME_PLAYER_SYSTEM_INTERFACE_FLAG_ID =
  "isekai.player-system.interface.enabled";

export type SceneRuntimeOverlayOwner = "player-system" | "party-system";
export type SceneRuntimeOverlaySurfaceKind =
  | "world-panel"
  | "focus-pane"
  | "target-popup"
  | "alert-marker";
export type SceneRuntimeFocusMode = "ambient" | "focused" | "combat-safe";
export type SceneRuntimeCombatBehavior = "persist" | "reduce" | "suspend";
export type SceneRuntimeOverlayCollisionResolution =
  | "stack"
  | "replace-existing"
  | "suspend-incoming";

export interface SceneRuntimeOverlaySurface {
  id: string;
  owner: SceneRuntimeOverlayOwner;
  kind: SceneRuntimeOverlaySurfaceKind;
  zoneId: string;
  anchorId?: string;
  interactive: boolean;
  priority: number;
  combatBehavior: SceneRuntimeCombatBehavior;
}

export interface SceneRuntimeOverlayFocusState {
  mode: SceneRuntimeFocusMode;
  activeOwner: SceneRuntimeOverlayOwner;
  focusedSurfaceId?: string;
  inCombat: boolean;
}

export interface SceneRuntimeOverlayCollisionRule {
  existingOwner: SceneRuntimeOverlayOwner;
  incomingOwner: SceneRuntimeOverlayOwner;
  zoneId: string;
  kind: SceneRuntimeOverlaySurfaceKind;
  resolution: SceneRuntimeOverlayCollisionResolution;
}

export interface SceneRuntimeOverlayCompositionRequest {
  layout: SceneRuntimeLayoutManifest;
  surfaces: SceneRuntimeOverlaySurface[];
  focus: SceneRuntimeOverlayFocusState;
  collisionRules?: SceneRuntimeOverlayCollisionRule[];
}

export interface SceneRuntimeOverlayComposition {
  owners: SceneRuntimeOverlayOwner[];
  surfaceCount: number;
  focusedSurface?: SceneRuntimeOverlaySurface;
  reducedSurfaceIds: string[];
  suspendedSurfaceIds: string[];
  diagnostics: SceneRuntimeCompositionDiagnostics;
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OWNERS = new Set<SceneRuntimeOverlayOwner>([
  "player-system",
  "party-system",
]);
const SURFACE_KINDS = new Set<SceneRuntimeOverlaySurfaceKind>([
  "world-panel",
  "focus-pane",
  "target-popup",
  "alert-marker",
]);
const FOCUS_MODES = new Set<SceneRuntimeFocusMode>([
  "ambient",
  "focused",
  "combat-safe",
]);
const COMBAT_BEHAVIORS = new Set<SceneRuntimeCombatBehavior>([
  "persist",
  "reduce",
  "suspend",
]);
const COLLISION_RESOLUTIONS = new Set<SceneRuntimeOverlayCollisionResolution>([
  "stack",
  "replace-existing",
  "suspend-incoming",
]);

function pushIssue(
  issues: SceneRuntimeValidationIssue[],
  issue: SceneRuntimeValidationIssue,
): void {
  issues.push(issue);
}

function isFinitePositiveNumber(raw: unknown): raw is number {
  return typeof raw === "number" && Number.isFinite(raw) && raw >= 0;
}

function validateIdLike(
  value: unknown,
  path: string,
  issues: SceneRuntimeValidationIssue[],
): value is string {
  if (typeof value !== "string") {
    pushIssue(issues, {
      code: "invalid-id",
      path,
      message: "Expected a string identifier.",
    });
    return false;
  }

  if (!ID_PATTERN.test(value)) {
    pushIssue(issues, {
      code: "invalid-id",
      path,
      message: "Identifiers must be kebab-case tokens.",
    });
    return false;
  }

  return true;
}

function validateLayout(
  layout: unknown,
  issues: SceneRuntimeValidationIssue[],
): layout is SceneRuntimeLayoutManifest {
  if (!layout || typeof layout !== "object") {
    pushIssue(issues, {
      code: "required",
      path: "$.layout",
      message: "Expected a layout manifest.",
    });
    return false;
  }

  const value = layout as SceneRuntimeLayoutManifest;
  if (value.schemaVersion !== "1.0.0" || !Array.isArray(value.zones)) {
    pushIssue(issues, {
      code: "invalid-value",
      path: "$.layout",
      message: "layout must use schemaVersion 1.0.0 and provide zones.",
    });
    return false;
  }

  if (value.zones.length === 0) {
    pushIssue(issues, {
      code: "required",
      path: "$.layout.zones",
      message: "layout must include at least one zone.",
    });
    return false;
  }

  let valid = true;
  const seen = new Set<string>();

  value.zones.forEach((zone, index) => {
    if (!zone || typeof zone !== "object") {
      pushIssue(issues, {
        code: "required",
        path: `$.layout.zones[${index}]`,
        message: "Expected a layout zone definition.",
      });
      valid = false;
      return;
    }

    if (!validateIdLike(zone.id, `$.layout.zones[${index}].id`, issues)) {
      valid = false;
    } else if (seen.has(zone.id)) {
      pushIssue(issues, {
        code: "invalid-id",
        path: `$.layout.zones[${index}].id`,
        message: "Layout zone ids must be unique.",
      });
      valid = false;
    } else {
      seen.add(zone.id);
    }

    for (const field of ["x", "y", "width", "height"] as const) {
      if (!isFinitePositiveNumber(zone.rect?.[field])) {
        pushIssue(issues, {
          code: "invalid-value",
          path: `$.layout.zones[${index}].rect.${field}`,
          message: `${field} must be finite and non-negative.`,
        });
        valid = false;
      }
    }
  });

  return valid;
}

export function validateSceneRuntimeOverlayComposition(
  request: unknown,
): SceneRuntimeValidationResult<SceneRuntimeOverlayCompositionRequest> {
  const issues: SceneRuntimeValidationIssue[] = [];

  if (!request || typeof request !== "object") {
    return {
      valid: false,
      issues: [
        {
          code: "required",
          path: "$.request",
          message: "Expected an overlay-composition request.",
        },
      ],
    };
  }

  const value = request as SceneRuntimeOverlayCompositionRequest;
  let valid = validateLayout(value.layout, issues);

  if (!Array.isArray(value.surfaces) || value.surfaces.length === 0) {
    pushIssue(issues, {
      code: "required",
      path: "$.surfaces",
      message: "surfaces must include at least one overlay surface.",
    });
    valid = false;
  }

  if (!value.focus || typeof value.focus !== "object") {
    pushIssue(issues, {
      code: "required",
      path: "$.focus",
      message: "Expected focus state definition.",
    });
    valid = false;
  }

  if (!valid) {
    return { valid: false, issues };
  }

  const zoneIds = new Set(value.layout.zones.map((zone) => zone.id));
  const surfaceIds = new Set<string>();
  const surfacesById = new Map<string, SceneRuntimeOverlaySurface>();

  value.surfaces.forEach((surface, index) => {
    const path = `$.surfaces[${index}]`;
    if (!surface || typeof surface !== "object") {
      pushIssue(issues, {
        code: "required",
        path,
        message: "Expected an overlay surface definition.",
      });
      valid = false;
      return;
    }

    if (!validateIdLike(surface.id, `${path}.id`, issues)) {
      valid = false;
    } else if (surfaceIds.has(surface.id)) {
      pushIssue(issues, {
        code: "invalid-id",
        path: `${path}.id`,
        message: "Overlay surface ids must be unique.",
      });
      valid = false;
    } else {
      surfaceIds.add(surface.id);
      surfacesById.set(surface.id, surface);
    }

    if (!OWNERS.has(surface.owner)) {
      pushIssue(issues, {
        code: "invalid-value",
        path: `${path}.owner`,
        message: "owner must be player-system or party-system.",
      });
      valid = false;
    }

    if (!SURFACE_KINDS.has(surface.kind)) {
      pushIssue(issues, {
        code: "invalid-value",
        path: `${path}.kind`,
        message: "kind must be world-panel, focus-pane, target-popup, or alert-marker.",
      });
      valid = false;
    }

    if (!validateIdLike(surface.zoneId, `${path}.zoneId`, issues)) {
      valid = false;
    } else if (!zoneIds.has(surface.zoneId)) {
      pushIssue(issues, {
        code: "missing-reference",
        path: `${path}.zoneId`,
        message: "zoneId must reference an existing layout zone.",
      });
      valid = false;
    }

    if (
      surface.anchorId !== undefined &&
      !validateIdLike(surface.anchorId, `${path}.anchorId`, issues)
    ) {
      valid = false;
    }

    if (typeof surface.interactive !== "boolean") {
      pushIssue(issues, {
        code: "invalid-type",
        path: `${path}.interactive`,
        message: "interactive must be a boolean.",
      });
      valid = false;
    }

    if (!isFinitePositiveNumber(surface.priority)) {
      pushIssue(issues, {
        code: "invalid-value",
        path: `${path}.priority`,
        message: "priority must be finite and non-negative.",
      });
      valid = false;
    }

    if (!COMBAT_BEHAVIORS.has(surface.combatBehavior)) {
      pushIssue(issues, {
        code: "invalid-value",
        path: `${path}.combatBehavior`,
        message: "combatBehavior must be persist, reduce, or suspend.",
      });
      valid = false;
    }
  });

  if (!FOCUS_MODES.has(value.focus.mode)) {
    pushIssue(issues, {
      code: "invalid-value",
      path: "$.focus.mode",
      message: "focus mode must be ambient, focused, or combat-safe.",
    });
    valid = false;
  }

  if (!OWNERS.has(value.focus.activeOwner)) {
    pushIssue(issues, {
      code: "invalid-value",
      path: "$.focus.activeOwner",
      message: "activeOwner must be player-system or party-system.",
    });
    valid = false;
  }

  if (typeof value.focus.inCombat !== "boolean") {
    pushIssue(issues, {
      code: "invalid-type",
      path: "$.focus.inCombat",
      message: "inCombat must be a boolean.",
    });
    valid = false;
  }

  if (value.focus.focusedSurfaceId !== undefined) {
    if (
      !validateIdLike(value.focus.focusedSurfaceId, "$.focus.focusedSurfaceId", issues)
    ) {
      valid = false;
    } else {
      const focusedSurface = surfacesById.get(value.focus.focusedSurfaceId);
      if (!focusedSurface) {
        pushIssue(issues, {
          code: "missing-reference",
          path: "$.focus.focusedSurfaceId",
          message: "focusedSurfaceId must reference a defined surface.",
        });
        valid = false;
      } else if (focusedSurface.owner !== value.focus.activeOwner) {
        pushIssue(issues, {
          code: "invalid-reference",
          path: "$.focus.focusedSurfaceId",
          message: "focusedSurfaceId must belong to the active focus owner.",
        });
        valid = false;
      }
    }
  }

  if (Array.isArray(value.collisionRules)) {
    value.collisionRules.forEach((rule, index) => {
      const path = `$.collisionRules[${index}]`;
      if (!OWNERS.has(rule.existingOwner) || !OWNERS.has(rule.incomingOwner)) {
        pushIssue(issues, {
          code: "invalid-value",
          path,
          message: "Collision rules must use known overlay owners.",
        });
        valid = false;
      }

      if (!validateIdLike(rule.zoneId, `${path}.zoneId`, issues)) {
        valid = false;
      } else if (!zoneIds.has(rule.zoneId)) {
        pushIssue(issues, {
          code: "missing-reference",
          path: `${path}.zoneId`,
          message: "Collision rules must target existing layout zones.",
        });
        valid = false;
      }

      if (!SURFACE_KINDS.has(rule.kind)) {
        pushIssue(issues, {
          code: "invalid-value",
          path: `${path}.kind`,
          message: "Collision rules must target known surface kinds.",
        });
        valid = false;
      }

      if (!COLLISION_RESOLUTIONS.has(rule.resolution)) {
        pushIssue(issues, {
          code: "invalid-value",
          path: `${path}.resolution`,
          message:
            "Collision resolution must be stack, replace-existing, or suspend-incoming.",
        });
        valid = false;
      }
    });
  } else if (value.collisionRules !== undefined) {
    pushIssue(issues, {
      code: "invalid-type",
      path: "$.collisionRules",
      message: "collisionRules must be an array when present.",
    });
    valid = false;
  }

  return {
    valid,
    issues,
    value: valid ? value : undefined,
  };
}

export function composeSceneRuntimeOverlayComposition(
  request: SceneRuntimeOverlayCompositionRequest,
): SceneRuntimeOverlayComposition {
  const validation = validateSceneRuntimeOverlayComposition(request);
  if (!validation.valid || !validation.value) {
    const message = validation.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid scene runtime overlay request. ${message}`);
  }

  const value = validation.value;

  const diagnostics: SceneRuntimeCompositionDiagnostics = {
    warnings: [],
    errors: [...validation.issues],
  };
  const activeSurfaces: SceneRuntimeOverlaySurface[] = [];
  const suspendedSurfaceIds = new Set<string>();
  const reducedSurfaceIds = new Set<string>();
  const rules = value.collisionRules ?? [];
  const sortedSurfaces = [...value.surfaces].sort(
    (left, right) => right.priority - left.priority,
  );

  for (const surface of sortedSurfaces) {
    if (value.focus.inCombat && value.focus.mode !== "ambient") {
      if (surface.combatBehavior === "suspend") {
        suspendedSurfaceIds.add(surface.id);
        continue;
      }

      if (surface.combatBehavior === "reduce") {
        reducedSurfaceIds.add(surface.id);
      }
    }

    const conflictingSurface = activeSurfaces.find(
      (candidate) =>
        candidate.zoneId === surface.zoneId &&
        candidate.kind === surface.kind &&
        candidate.owner !== surface.owner,
    );

    if (!conflictingSurface) {
      activeSurfaces.push(surface);
      continue;
    }

    const rule = rules.find(
      (candidate) =>
        candidate.zoneId === surface.zoneId &&
        candidate.kind === surface.kind &&
        candidate.existingOwner === conflictingSurface.owner &&
        candidate.incomingOwner === surface.owner,
    );

    if (!rule || rule.resolution === "stack") {
      activeSurfaces.push(surface);
      continue;
    }

    if (rule.resolution === "replace-existing") {
      suspendedSurfaceIds.add(conflictingSurface.id);
      const index = activeSurfaces.findIndex(
        (candidate) => candidate.id === conflictingSurface.id,
      );
      if (index >= 0) {
        activeSurfaces.splice(index, 1, surface);
      }
      continue;
    }

    suspendedSurfaceIds.add(surface.id);
  }

  const focusedSurface =
    value.focus.focusedSurfaceId !== undefined
      ? activeSurfaces.find(
          (surface) => surface.id === value.focus.focusedSurfaceId,
        )
      : undefined;

  if (value.focus.mode === "focused" && value.focus.inCombat) {
    diagnostics.warnings.push({
      code: "invalid-value",
      path: "$.focus.mode",
      message:
        "Focused mode requested during combat; active surfaces should honor combat-safe reduction rules.",
    });
  }

  return {
    owners: Object.freeze(
      [...new Set(activeSurfaces.map((surface) => surface.owner))].sort(),
    ) as SceneRuntimeOverlayOwner[],
    surfaceCount: activeSurfaces.length,
    focusedSurface,
    reducedSurfaceIds: [...reducedSurfaceIds],
    suspendedSurfaceIds: [...suspendedSurfaceIds],
    diagnostics,
  };
}
