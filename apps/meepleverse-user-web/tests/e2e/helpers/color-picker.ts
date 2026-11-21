import { expect, type Page } from "@playwright/test";
export async function chooseAndConfirmColor(page: Page, name: string) {
  const dialog = page.getByRole("dialog", { name: "Đổi sang màu nào?", exact: true });
  await dialog.getByRole("button", { name, exact: true }).click();
  await dialog.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
