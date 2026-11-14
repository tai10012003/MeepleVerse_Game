// Stable per physical card: older cards keep their placement when the next one lands.
export function discardPlacement(id: string) {
  let hash = 2166136261;
  for (const letter of id) hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619) >>> 0;
  return { x: (hash % 61) - 30, y: ((hash >>> 8) % 15) - 7, angle: ((hash >>> 16) % 51) - 25 };
}
