interface SavedSession { roomId: string; token: string }
const KEY = "meepleverse.room-session.v1";
export function readSession(): SavedSession | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    if (value && typeof value === "object" && "roomId" in value && "token" in value &&
      typeof value.roomId === "string" && /^[A-Z0-9]{4}$/.test(value.roomId) &&
      typeof value.token === "string" && value.token.length > 0 && value.token.length < 512) return value as SavedSession;
  } catch { /* Storage may be disabled by the browser. */ }
  return null;
}
export function saveSession(roomId: string, token: string): void {
  try { sessionStorage.setItem(KEY, JSON.stringify({ roomId, token })); } catch { /* Session still works until reload. */ }
}
export function clearSession(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* No persisted session to clear. */ }
}
