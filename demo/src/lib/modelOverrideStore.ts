/**
 * In-memory bridge between the Designer and Mission Control. Since routing
 * is a client-side hash swap (no page reload), a module-level map is enough
 * to hand an edited model's XML across the route boundary — Mission
 * Control's bootstrap checks it before falling back to the fetched default.
 */
const overrides = new Map<string, string>();

export function setModelOverride(runtimePath: string, content: string): void {
  overrides.set(runtimePath, content);
}

export function getModelOverride(runtimePath: string): string | undefined {
  return overrides.get(runtimePath);
}

export function clearModelOverrides(): void {
  overrides.clear();
}
