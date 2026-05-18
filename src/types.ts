export const SCENE_RUNTIME_SCHEMA_VERSION = "1.0.0";
export const SCENE_RUNTIME_SITE_INTEGRATION_FLAG_ID =
  "scene.runtime.site-integration.enabled";

export interface SceneRuntimePoint {
  x: number;
  y: number;
}

export interface SceneRuntimeLayoutZone {
  id: string;
  rect: SceneRuntimeRect;
}

export interface SceneRuntimeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SceneRuntimeObjectManifest {
  schemaVersion: string;
  objects: Array<{
    id: string;
    transform: {
      x: number;
      y: number;
      scale: number;
    };
  }>;
}

export interface SceneRuntimeLayoutManifest {
  schemaVersion: string;
  zones: SceneRuntimeLayoutZone[];
}

export interface SceneRuntimePaletteManifest {
  schemaVersion: string;
  paletteId: string;
  clips: Array<{
    id: string;
    durationMs: number;
  }>;
}

export interface SceneRuntimePaletteSourceContext {
  requestId?: string;
  userId?: string;
}

export interface SceneRuntimePaletteSourceRequest {
  paletteId: string;
  container?: string;
}

export interface SceneRuntimePaletteSourceAdapter {
  id: string;
  loadPalette(
    request: SceneRuntimePaletteSourceRequest,
    context?: SceneRuntimePaletteSourceContext,
  ): Promise<SceneRuntimePaletteManifest | undefined> | SceneRuntimePaletteManifest;
}

export interface SceneRuntimeResolvedPalette {
  sourceId: string;
  palette: SceneRuntimePaletteManifest;
}

export interface SceneRuntimeComposition {
  layoutZoneCount: number;
  objectCount: number;
  activePalette?: SceneRuntimeResolvedPalette;
  diagnostics: SceneRuntimeCompositionDiagnostics;
}

export interface SceneRuntimeCompositionRequest {
  layout: SceneRuntimeLayoutManifest;
  objects: SceneRuntimeObjectManifest;
  resolvePalette: {
    paletteId: string;
    adapter: SceneRuntimePaletteSourceAdapter;
    context?: SceneRuntimePaletteSourceContext;
    enabled: boolean;
  };
}

export interface SceneRuntimeCompositionDiagnostics {
  warnings: SceneRuntimeValidationIssue[];
  errors: SceneRuntimeValidationIssue[];
}

export type SceneRuntimeValidationCode =
  | "required"
  | "invalid-type"
  | "invalid-id"
  | "invalid-value"
  | "missing-reference"
  | "adapter-failed";

export interface SceneRuntimeValidationIssue {
  code: SceneRuntimeValidationCode;
  path: string;
  message: string;
}

export interface SceneRuntimeValidationResult<T> {
  valid: boolean;
  issues: SceneRuntimeValidationIssue[];
  value?: T;
}

export interface SceneRuntimeResolutionResult<T> {
  value?: T;
  valid: boolean;
  issues: SceneRuntimeValidationIssue[];
}

export interface SceneRuntimePaletteSourceError {
  sourceId: string;
  message: string;
}
