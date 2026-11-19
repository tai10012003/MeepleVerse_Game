import type { UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import type { UnoRoomView } from "@meepleverse/contracts/room";
/** Keep Expanded data out of Basic's state mapper, controls and animation queue. */
export function expandedRoomView(view: UnoRoomView | UnoExpandedRoomView): UnoExpandedRoomView | null {
  if (view.gameId !== "uno-expanded") return null;
  if (view.game && (view.game.gameId !== "uno-expanded" || view.game.phase !== "prepared" || view.game.self.playerId !== view.selfPlayerId)) return null;
  return view;
}
