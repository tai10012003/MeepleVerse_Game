import { expect, test } from "@playwright/test";
const previewPath = "/dev/uno-expanded/cards";
test("card studio: every card family and legal color variant renders with accessible, bounded SVG artwork", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(previewPath);
  await expect(page.getByRole("heading", { name: "Thư viện mặt bài" })).toBeVisible();
  await expect(page.locator("[data-card-group]")).toHaveCount(20);
  await expect(page.locator(".studio-card-grid .expanded-card-face")).toHaveCount(61);
  const artwork = await page.locator(".studio-card-grid .expanded-card-face").evaluateAll(nodes => nodes.map(node => {
    const svg = node as SVGSVGElement; // Card Swap's long sleeves are clipped to the printed card area.
    const artwork = svg.dataset.cardKind === "wild-card-swap" ? svg.querySelector<SVGGraphicsElement>("clipPath rect") : svg.querySelector<SVGGraphicsElement>('[data-artwork="center"]');
    const box = artwork!.getBBox();
    return { kind: svg.dataset.cardKind, label: svg.getAttribute("aria-label"), x: box.x, y: box.y, right: box.x + box.width, bottom: box.y + box.height };
  }));
  expect(new Set(artwork.map(card => card.kind)).size).toBe(23);
  // SVG getBBox conservatively includes rotated ellipse control bounds (the shared +4 extends 3.14 units).
  for (const card of artwork) {
    expect(card.label).toBeTruthy(); expect(card.x, card.kind).toBeGreaterThanOrEqual(-4); expect(card.y, card.kind).toBeGreaterThanOrEqual(0);
    expect(card.right, card.kind).toBeLessThanOrEqual(104); expect(card.bottom, card.kind).toBeLessThanOrEqual(144);
  }
  // Check the actual transformed paths, including nested SVG viewports, against the oval.
  const containment = await page.locator('.studio-card-grid .expanded-card-face[data-card-kind="number"],.studio-card-grid .expanded-card-face[data-card-kind="wild-up"]').evaluateAll(nodes => nodes.flatMap(node => {
    const oval = node.querySelector<SVGEllipseElement>('[data-card-oval]')!;
    const toOval = oval.getScreenCTM()!.inverse();
    const paths = node.querySelectorAll<SVGPathElement>('[data-artwork="center"] path');
    return Array.from(paths).map(path => {
      const matrix = toOval.multiply(path.getScreenCTM()!);
      const length = path.getTotalLength();
      const samples = Array.from({length:81},(_,i) => path.getPointAtLength(length*i/80).matrixTransform(matrix));
      return {kind:node.getAttribute("data-card-kind"), radius:Math.max(...samples.map(point => ((point.x-50)/38)**2 + ((point.y-72)/52)**2))};
    });
  }));
  expect(containment.length).toBe(12); // Eight 6/9 underlines, four Up arrows.
  for(const shape of containment) expect(shape.radius,shape.kind ?? "artwork").toBeLessThan(.98);
  await page.getByRole("button", { name: "Phóng lớn", exact: true }).click();
  await page.locator('[data-card-group="numbers"]').screenshot({path:info.outputPath("numbers-6-9.png")});
  await page.locator('[data-card-group="up"]').screenshot({path:info.outputPath("up-arrows.png")});
  for(const group of ["seven","skip-two","high-five","wilds","multiply","divide","draw-more","card-swap"]) {
    await page.locator(`[data-card-group="${group}"]`).screenshot({path:info.outputPath(`${group}-artwork.png`)});
  }
  const cornerRows = await page.locator('.studio-card-grid [data-card-kind="skip-two"] [data-artwork="corner"]').evaluateAll(nodes => nodes.map(node => {
    const box = (node as SVGGraphicsElement).getBBox();
    return {height:box.height, bottom:box.y + box.height};
  }));
  for(const row of cornerRows) expect(row.bottom).toBeLessThanOrEqual(14);
  expect(await page.locator("svg[id]").count()).toBe(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: info.outputPath("studio-desktop.png") });
  await page.getByRole("button", { name: "Mở rộng", exact: true }).click();
  await expect(page.locator("[data-card-group]")).toHaveCount(15);
  await expect(page.locator(".studio-card-grid .expanded-card-face")).toHaveCount(31);
  await page.locator(".studio-groups").screenshot({ path: info.outputPath("expanded-all-artwork.png") });
});
test("card studio: filters, large cards and hand/table dimensions fit mobile and tablet", async ({ page }, info) => {
  await page.goto(previewPath);
  for (const width of [375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole("button", { name: "Phóng lớn", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), String(width)).toBe(true);
    const dimensions = await page.locator(".studio-demo-pile>.expanded-card-face,.studio-demo-hand>.expanded-card-face").evaluateAll(nodes => nodes.map(node => getComputedStyle(node).width));
    expect(new Set(dimensions).size).toBe(1);
    await page.screenshot({ path: info.outputPath(`studio-${width}.png`) });
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Mở rộng", exact: true }).click();
  await page.getByLabel("Màu bài", { exact: true }).selectOption("red");
  const red = page.locator(".studio-card-grid .expanded-card-face"); await expect(red).toHaveCount(5);
  for (const face of await red.all()) await expect(face).toHaveAttribute("data-card-color", "red");
  await expect(page.getByRole("img", { name: "Đỏ · Chuyền trái · 7 L" })).toBeVisible();
  await page.getByLabel("Màu bài", { exact: true }).selectOption("wild");
  await expect(page.locator(".studio-card-grid .expanded-card-face")).toHaveCount(11);
  await page.getByRole("button", { name: "Tay bài / trên bàn", exact: true }).click();
  await page.locator('[data-card-group="battle"]').screenshot({ path: info.outputPath("battle-corner-swords.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("card studio: artwork preview stays separate from playable Expanded entry", async ({ page }) => {
  await page.goto(previewPath);
  await expect(page.getByRole("button", { name: /Tạo phòng|Vào phòng|Bắt đầu/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Giới thiệu game" }).click();
  await expect(page).toHaveURL(/\/games\/uno-expanded$/);
  await expect(page.getByText("Đang mở bàn", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo phòng UNO Mở rộng", exact: true })).toBeEnabled();
});
