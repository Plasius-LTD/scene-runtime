import {
  SCENE_RUNTIME_SCHEMA_VERSION,
  SceneRuntimeComposition,
  SceneRuntimeCompositionDiagnostics,
  type SceneRuntimeCompositionRequest,
  type SceneRuntimeResolvedPalette,
  type SceneRuntimeValidationIssue,
  type SceneRuntimeValidationResult,
} from "./types.js";

function pushIssue(
  issues: SceneRuntimeValidationIssue[],
  issue: SceneRuntimeValidationIssue,
): void {
  issues.push(issue);
}

function isFinitePositiveNumber(raw: unknown): raw is number {
  return typeof raw === "number" && Number.isFinite(raw) && raw >= 0;
}

function isIdLike(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateRect(rect: unknown, path: string, issues: SceneRuntimeValidationIssue[]) {
  if (!rect || typeof rect !== "object") {
    pushIssue(issues, {
      code: "required",
      path,
      message: "Expected rectangle definition.",
    });
    return false;
  }

  const value = rect as Record<string, unknown>;
  for (const field of ["x", "y", "width", "height"] as const) {
    if (!isFinitePositiveNumber(value[field])) {
      pushIssue(issues, {
        code: "invalid-value",
        path: `${path}.${field}`,
        message: `${field} must be finite and non-negative.`,
      });
      return false;
    }
  }

  return true;
}

export function validateSceneRuntimeComposition(
  request: SceneRuntimeCompositionRequest,
): SceneRuntimeValidationResult<SceneRuntimeComposition> {
  const issues: SceneRuntimeValidationIssue[] = [];

  if (!request || typeof request !== "object") {
    return {
      valid: false,
      issues: [
        {
          code: "required",
          path: "$.request",
          message: "Expected a scene-runtime composition request.",
        },
      ],
    };
  }

  let valid = true;

  if (!isIdLike(request.resolvePalette?.paletteId)) {
    pushIssue(issues, {
      code: "invalid-id",
      path: "$.resolvePalette.paletteId",
      message: "paletteId must be a non-empty string.",
    });
    valid = false;
  }

  if (!request.resolvePalette?.adapter?.id || typeof request.resolvePalette.adapter.id !== "string") {
    pushIssue(issues, {
      code: "invalid-id",
      path: "$.resolvePalette.adapter.id",
      message: "adapter.id must be a string.",
    });
    valid = false;
  }

  if (!request.layout || request.layout.schemaVersion !== "1.0.0" || !Array.isArray(request.layout.zones)) {
    pushIssue(issues, {
      code: "invalid-value",
      path: "$.layout",
      message: "layout must use schemaVersion 1.0.0 and provide zones.",
    });
    valid = false;
  } else if (request.layout.zones.length === 0) {
    pushIssue(issues, {
      code: "required",
      path: "$.layout.zones",
      message: "layout must include at least one zone.",
    });
    valid = false;
  }

  if (!request.objects || request.objects.schemaVersion !== "1.0.0" || !Array.isArray(request.objects.objects)) {
    pushIssue(issues, {
      code: "invalid-value",
      path: "$.objects",
      message: "objects must use schemaVersion 1.0.0 and provide objects list.",
    });
    valid = false;
  } else if (request.objects.objects.length === 0) {
    pushIssue(issues, {
      code: "required",
      path: "$.objects.objects",
      message: "objects must include at least one object.",
    });
    valid = false;
  }

  if (!valid) {
    return {
      valid: false,
      issues,
    };
  }

  if (!Array.isArray(request.layout.zones)) {
    return { valid: false, issues };
  }

  for (const [index, zone] of request.layout.zones.entries()) {
    if (!zone || typeof zone !== "object") {
      pushIssue(issues, {
        code: "required",
        path: `$.layout.zones[${index}]`,
        message: "Expected zone definition.",
      });
      valid = false;
      continue;
    }

    if (typeof zone.id !== "string" || zone.id.length === 0) {
      pushIssue(issues, {
        code: "invalid-id",
        path: `$.layout.zones[${index}].id`,
        message: "Zone id must be a non-empty string.",
      });
      valid = false;
    }

    if (!validateRect(zone.rect, `$.layout.zones[${index}].rect`, issues)) {
      valid = false;
    }
  }

  const diagnostics: SceneRuntimeCompositionDiagnostics = {
    warnings: [],
    errors: [...issues],
  };

  if (!request.resolvePalette.enabled) {
    pushIssue(diagnostics.warnings, {
      code: "invalid-value",
      path: "$.resolvePalette.enabled",
      message: "Palette loading disabled; composition will run in deterministic fallback mode.",
    });
  }

  const value: SceneRuntimeComposition = {
    layoutZoneCount: request.layout.zones.length,
    objectCount: request.objects.objects.length,
    diagnostics,
  };

  return {
    valid,
    issues,
    value,
  };
}

export async function resolveScenePalette(
  request: SceneRuntimeCompositionRequest,
): Promise<{
  palette?: SceneRuntimeResolvedPalette;
  issues: SceneRuntimeValidationIssue[];
}> {
  const adapter = request.resolvePalette.adapter;
  const issues: SceneRuntimeValidationIssue[] = [];

  if (!request.resolvePalette.enabled) {
    return { palette: undefined, issues };
  }

  try {
    const loaded = await Promise.resolve(
      adapter.loadPalette(
        {
          paletteId: request.resolvePalette.paletteId,
        },
        request.resolvePalette.context,
      ),
    );

    if (!loaded) {
      return {
        issues: [
          {
            code: "missing-reference",
            path: "$.resolvePalette",
            message: `Adapter '${adapter.id}' did not return a palette manifest for ${request.resolvePalette.paletteId}.`,
          },
        ],
      };
    }

    if (loaded.schemaVersion !== SCENE_RUNTIME_SCHEMA_VERSION) {
      return {
        issues: [
          {
            code: "invalid-value",
            path: "$.resolvePalette.palette.schemaVersion",
            message: `Loaded palette schemaVersion must be ${SCENE_RUNTIME_SCHEMA_VERSION}.`,
          },
        ],
      };
    }

    return {
      palette: {
        sourceId: adapter.id,
        palette: loaded,
      },
      issues: [],
    };
  } catch (error) {
    const issue: SceneRuntimeValidationIssue = {
      code: "adapter-failed",
      path: "$.resolvePalette",
      message: `Adapter '${adapter.id}' failed: ${(error as Error).message}`,
    };
    return { palette: undefined, issues: [issue] };
  }
}

export async function createSceneRuntimeComposition(
  request: SceneRuntimeCompositionRequest,
): Promise<SceneRuntimeComposition> {
  const validation = validateSceneRuntimeComposition(request);
  if (!validation.valid || !validation.value) {
    const message = validation.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid scene runtime request. ${message}`);
  }

  const paletteResult = await resolveScenePalette(request);
  if (paletteResult.palette) {
    validation.value.activePalette = paletteResult.palette;
  } else {
    validation.value.diagnostics.warnings.push(...paletteResult.issues);
  }

  return validation.value;
}

export async function composeSceneRuntime(
  request: SceneRuntimeCompositionRequest,
): Promise<SceneRuntimeComposition> {
  return createSceneRuntimeComposition(request);
}
