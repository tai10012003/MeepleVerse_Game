import { expect, test } from "@playwright/test";
import { Client } from "@colyseus/sdk";
import type { UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";

test("an internal Expanded invite never renders Basic controls, survives reload and can leave", async ({ page }) => {
  const host = await new Client("http://127.0.0.1:5100").create("uno-expanded", { nickname: "Host" });
  host.reconnection.enabled = false;
  let view: UnoExpandedRoomView | null = null;
  host.onMessage("room_view", (next: UnoExpandedRoomView) => { view = next; });
  host.onMessage("game_events", () => {}); host.onMessage("action_reply", () => {});
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto("/room/" + host.roomId);
    await page.locator('input[name="nickname"]').fill("Guest");
    await page.locator('form button[type="submit"]').click();
    const notice = page.getByTestId("expanded-room-notice");
    await expect(notice).toBeVisible(); await expect(notice).toHaveAttribute("data-phase", "lobby");
    await expect(notice).toContainText("Đang phát triển");
    await expect(page.getByTestId("uno-screen")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Bắt đầu ván", exact: true })).toHaveCount(0);
    await expect.poll(() => view?.members.length).toBe(2);
    host.send("action", { requestId: "prepare", action: { type: "START_GAME", expectedRoomRevision: view!.revision } });
    await expect(notice).toHaveAttribute("data-phase", "prepared");
    const matchId = view!.matchId;
    await page.reload();
    await expect(page.getByTestId("expanded-room-notice")).toHaveAttribute("data-phase", "prepared");
    await expect(page.getByTestId("uno-board")).toHaveCount(0);
    await expect.poll(() => view?.paused).toBe(false);
    expect(view!.matchId).toBe(matchId);
    await page.getByRole("button", { name: "Rời phòng", exact: true }).click();
    await expect(page).toHaveURL("/");
    await expect.poll(() => view?.members.length).toBe(1);
    expect(errors).toEqual([]);
  } finally { if (host.connection.isOpen) await host.leave(); }
});
