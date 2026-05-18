import { SceneRuntimeLayoutManifest } from "./types.js";

export function listRuntimeZoneIds(
  manifest: SceneRuntimeLayoutManifest,
): string[] {
  return manifest.zones.map((zone) => zone.id);
}

export function findRuntimeZone(
  manifest: SceneRuntimeLayoutManifest,
  zoneId: string,
): SceneRuntimeLayoutManifest["zones"][number] | undefined {
  return manifest.zones.find((zone) => zone.id === zoneId);
}

export function hasRuntimeZone(manifest: SceneRuntimeLayoutManifest, zoneId: string): boolean {
  return findRuntimeZone(manifest, zoneId) !== undefined;
}
