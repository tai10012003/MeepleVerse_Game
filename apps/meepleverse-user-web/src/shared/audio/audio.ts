import { Howl, Howler } from "howler";
export type Sound = "play" | "draw" | "skip" | "reverse" | "wild" | "penalty" | "turn" | "uno" | "win" | "lose";
type Preferences = { music: boolean; effects: boolean; musicVolume: number; effectsVolume: number };
const defaults: Preferences = { music: true, effects: true, musicVolume: 25, effectsVolume: 65 };
const key = "meepleverse.audio.v1";
let snapshot = { ...defaults, ready: false, error: false };
const serverSnapshot = snapshot;
const listeners = new Set<() => void>();
let music: Howl | undefined;
const effects = new Map<Sound, Howl>();
let musicRequested = false;
let duckTimer: ReturnType<typeof setTimeout> | undefined;
let duckUntil = 0;
function resetDuck() {
  clearTimeout(duckTimer); duckTimer = undefined; duckUntil = 0;
}
function duckMusic(duration: number) {
  if (!music?.playing()) return;
  duckUntil = Math.max(duckUntil, Date.now() + duration * 1000 + 120);
  clearTimeout(duckTimer);
  music.fade(music.volume(), snapshot.musicVolume / 100 * .42, 35);
  duckTimer = setTimeout(() => {
    duckTimer = undefined; duckUntil = 0;
    if (music?.playing()) music.fade(music.volume(), snapshot.musicVolume / 100, 200);
  }, duckUntil - Date.now());
}
let rooms = 0;
let initialized = false;
const emit = () => listeners.forEach(listener => listener());
function sync() {
  if (!music) return;
  if (!rooms || document.hidden || !snapshot.effects || snapshot.effectsVolume === 0) resetDuck();
  music.volume(snapshot.musicVolume / 100 * (duckUntil > Date.now() ? .42 : 1));
  if (rooms && snapshot.ready && snapshot.music && snapshot.musicVolume > 0 && !document.hidden) {
    if (music.state() === "loaded" && !musicRequested) { musicRequested = true; music.play(); }
  } else { musicRequested = false; music.pause(); }
  for (const sound of effects.values()) {
    sound.volume(snapshot.effectsVolume / 100);
    if (!snapshot.effects || document.hidden || !rooms) sound.stop();
  }
}
function failed() { snapshot = { ...snapshot, error: true }; emit(); }
function prepare() {
  if (music) return;
  music = new Howl({ src: ["/audio/board-party-v2.wav"], loop: true, volume: snapshot.musicVolume / 100, onload: sync, onloaderror: failed,
    onplayerror: () => { musicRequested = false; snapshot = { ...snapshot, ready: false }; emit(); },
    onunlock: () => { snapshot = { ...snapshot, ready: true }; emit(); sync(); } });
  for (const name of ["play", "draw", "skip", "reverse", "wild", "penalty", "turn", "uno", "win", "lose"] as Sound[]) {
    effects.set(name, new Howl({ src: [`/audio/${name}.wav?v=2`], volume: snapshot.effectsVolume / 100, onloaderror: failed }));
  }
}
export function unlockAudio() {
  prepare();
  const context = Howler.ctx;
  const ready = () => { snapshot = { ...snapshot, ready: true }; emit(); sync(); };
  if (context) { void context.resume().then(ready).catch(() => {}); }
  else ready();
}
function bounded(value: unknown, fallback: number) { return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback; }
export function mountAudio() {
  if (initialized) return () => {};
  initialized = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    if (saved && typeof saved === "object") snapshot = { ...snapshot,
      music: typeof saved.music === "boolean" ? saved.music : defaults.music,
      effects: typeof saved.effects === "boolean" ? saved.effects : defaults.effects,
      musicVolume: bounded(saved.musicVolume, defaults.musicVolume), effectsVolume: bounded(saved.effectsVolume, defaults.effectsVolume) };
  } catch { /* Storage may be unavailable in private browsing. */ }
  emit();
  const visibility = () => { sync(); };
  document.addEventListener("pointerdown", unlockAudio);
  document.addEventListener("keydown", unlockAudio);
  document.addEventListener("visibilitychange", visibility);
  return () => {
    initialized = false;
    document.removeEventListener("pointerdown", unlockAudio);
    document.removeEventListener("keydown", unlockAudio);
    document.removeEventListener("visibilitychange", visibility);
    resetDuck();
    music?.unload(); music = undefined; musicRequested = false;
    effects.forEach(sound => sound.unload()); effects.clear();
    snapshot = { ...snapshot, ready: false };
  };
}
export function enterAudioRoom() {
  rooms++; sync();
  return () => { rooms = Math.max(0, rooms - 1); sync(); };
}
export function setAudioPreferences(patch: Partial<Preferences>) {
  snapshot = { ...snapshot, ...patch, musicVolume: bounded(patch.musicVolume, snapshot.musicVolume), effectsVolume: bounded(patch.effectsVolume, snapshot.effectsVolume) };
  try { localStorage.setItem(key, JSON.stringify({ music: snapshot.music, effects: snapshot.effects, musicVolume: snapshot.musicVolume, effectsVolume: snapshot.effectsVolume })); } catch { /* Keep session preferences. */ }
  emit(); sync();
}
export function playSound(name: Sound) {
  if (!rooms || !snapshot.ready || !snapshot.effects || snapshot.effectsVolume === 0 || document.hidden) return;
  const sound = effects.get(name);
  // Never queue old effects while assets load or the browser suspends audio.
  if (sound?.state() !== "loaded" || (Howler.ctx && Howler.ctx.state !== "running")) return;
  sound.stop(); sound.play();
  duckMusic(sound.duration());
}
export const audioStore = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => serverSnapshot,
};
