import { expect, test } from "@playwright/test";

for (const edition of ["basic", "expanded"]) for (const players of [3, 4]) {
  test(`${edition}: ${players} players keep side hands below avatars and clear of the deck`, async ({ browser, request }, info) => {
    await request.post("http://127.0.0.1:5101/scenario/normal");
    const contexts = await Promise.all(Array.from({ length: players }, () => browser.newContext()));
    try {
      const pages = await Promise.all(contexts.map(context => context.newPage()));
      const host = pages[0]!;
      await host.goto(`/games/uno-${edition}`);
      await host.getByLabel("Mọi người gọi bạn là gì?").fill("Host");
      await host.getByRole("button", { name: edition === "basic" ? "Tạo phòng UNO" : "Tạo phòng UNO Mở rộng", exact: true }).click();
      await expect(host).toHaveURL(/\/room\/[A-Z0-9]{4}$/);
      for (let i = 1; i < players; i++) {
        await pages[i]!.goto(host.url());
        await pages[i]!.getByLabel("Mọi người gọi bạn là gì?").fill(`Guest${i}`);
        await pages[i]!.getByRole("button", { name: "Vào phòng", exact: true }).click();
        await expect(pages[i]!.getByRole("button", { name: "Chờ chủ phòng bắt đầu" })).toBeVisible();
      }
      await host.getByRole("button", { name: "Bắt đầu ván", exact: true }).click();
      await expect(host.locator(edition === "basic" ? ".uno-table" : ".expanded-table")).toBeVisible();
      for (const viewport of [{width:1366,height:650},{width:1366,height:768},{width:1920,height:1080},{width:1024,height:768},{width:820,height:1180},{width:390,height:844},{width:844,height:390}]) {
        await host.setViewportSize(viewport);
        const layout = await host.evaluate(() => {
          const rect = (element: Element) => { const r = element.getBoundingClientRect(); return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}; };
          const deck = rect(document.querySelector(".draw-dock, .expanded-draw")!);
          const sides = [...document.querySelectorAll(".opponent-left, .opponent-right, .seat-left, .seat-right")].map(seat => ({
            identity: rect(seat.querySelector(".opponent-identity, .expanded-identity")!),
            hand: rect(seat.querySelector(".opponent-hand")!),
            count: seat.querySelectorAll(".opponent-card-back").length,
          }));
          const top = document.querySelector(".opponent-top, .seat-top");
          return {deck,sides,top:top ? {identity:rect(top.querySelector(".opponent-identity, .expanded-identity")!),hand:rect(top.querySelector(".opponent-hand")!)} : null, overflow:document.documentElement.scrollWidth > innerWidth};
        });
        expect(layout.sides).toHaveLength(2);
        expect(layout.overflow).toBe(false);
        for (const side of layout.sides) {
          expect(side.hand.y, JSON.stringify({edition,players,viewport,layout})).toBeGreaterThanOrEqual(side.identity.bottom + 3);
          expect(Math.abs(side.hand.x + side.hand.width/2 - side.identity.x - side.identity.width/2)).toBeLessThan(1);
          expect(side.count).toBe(7);
          // Desktop spreads match the top seat; tablet and phone fans stay compact.
          if (viewport.width >= 1200 && viewport.height >= 621) {
            expect(side.hand.width).toBe(208);
            if (layout.top) expect(side.hand.width).toBe(layout.top.hand.width);
          } else {
            expect(side.hand.width).toBeLessThanOrEqual(146);
          }
          const overlap = side.hand.x < layout.deck.right && side.hand.right > layout.deck.x && side.hand.y < layout.deck.bottom && side.hand.bottom > layout.deck.y;
          expect(overlap, JSON.stringify({edition,players,viewport,layout})).toBe(false);
        }
        if (layout.top) expect(layout.top.hand.x).toBeGreaterThan(layout.top.identity.right);
        if (viewport.width === 390 || viewport.width === 1366) await host.screenshot({path:info.outputPath(`${viewport.width}.png`)});
      }
    } finally { await Promise.all(contexts.map(context => context.close())); }
  });
}
