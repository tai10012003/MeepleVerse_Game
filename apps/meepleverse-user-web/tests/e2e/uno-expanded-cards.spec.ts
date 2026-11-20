import { expect, test } from "@playwright/test";
const previewPath = "/dev/uno-expanded/cards";
test("card studio: every card family and legal color variant renders with accessible, bounded SVG artwork", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(previewPath);
  await expect(page.getByRole("heading", { name: "Thư viện mặt bài" })).toBeVisible();
  await expect(page.locator("[data-card-group]")).toHaveCount(19);
  await expect(page.locator(".studio-card-grid .expanded-card-face")).toHaveCount(60);
  const artwork = await page.locator(".studio-card-grid .expanded-card-face").evaluateAll(nodes => nodes.map(node => {
    const svg = node as SVGSVGElement; const box = svg.querySelector<SVGGraphicsElement>('[data-artwork="center"]')!.getBBox();
    return { kind: svg.dataset.cardKind, label: svg.getAttribute("aria-label"), x: box.x, y: box.y, right: box.x + box.width, bottom: box.y + box.height };
  }));
  expect(new Set(artwork.map(card => card.kind)).size).toBe(22);
  // SVG getBBox conservatively includes rotated ellipse control bounds (the shared +4 extends 3.14 units).
  for (const card of artwork) {
    expect(card.label).toBeTruthy(); expect(card.x, card.kind).toBeGreaterThanOrEqual(-4); expect(card.y, card.kind).toBeGreaterThanOrEqual(0);
    expect(card.right, card.kind).toBeLessThanOrEqual(104); expect(card.bottom, card.kind).toBeLessThanOrEqual(144);
  }
  expect(await page.locator("svg[id]").count()).toBe(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: info.outputPath("studio-desktop.png") });
  await page.getByRole("button", { name: "Mở rộng", exact: true }).click();
  await expect(page.locator("[data-card-group]")).toHaveCount(14);
  await expect(page.locator(".studio-card-grid .expanded-card-face")).toHaveCount(30);
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
  await expect(page.locator(".studio-card-grid .expanded-card-face")).toHaveCount(10);
  await page.getByRole("button", { name: "Tay bài / trên bàn", exact: true }).click();
  await page.locator('[data-card-group="battle"]').screenshot({ path: info.outputPath("battle-corner-swords.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("card studio: catalog keeps Expanded unavailable and the preview has no gameplay actions", async ({ page }) => {
  await page.goto(previewPath);
  await expect(page.getByRole("button", { name: /Tạo phòng|Vào phòng|Bắt đầu/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Giới thiệu game" }).click();
  await expect(page).toHaveURL(/\/games\/uno-expanded$/);
  await expect(page.getByText("Đang phát triển", { exact: true })).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
});
