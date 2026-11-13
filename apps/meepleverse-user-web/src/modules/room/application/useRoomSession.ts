"use client";
import { useEffect, useSyncExternalStore } from "react";
import { roomSession } from "../infrastructure/room-session";
export function useRoomSession(roomId?: string) {
  const state = useSyncExternalStore(roomSession.subscribe, roomSession.getSnapshot, roomSession.getServerSnapshot);
  useEffect(() => { void roomSession.restore(roomId); }, [roomId]);
  return { ...state, session: roomSession };
}
