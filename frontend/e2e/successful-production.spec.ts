import { test, expect } from "@playwright/test";
import {
  loginAs,
  createAndSubmitOrder,
  findOrder,
  openVerification,
  recordCounts,
  approveOrder,
} from "./helpers";

test("successful cutting to sewing workflow", async ({ browser }) => {
  const rollId = `E2E-GREEN-${Date.now()}`;

  // 1. Cutting Supervisor creates and submits order.
  const cutting = await loginAs(browser, "cutting");

  const orderNumber = await createAndSubmitOrder(cutting, rollId);

  await cutting.close();

  // 2. Cutting Verifier records all GREEN counts.
  const verifier = await loginAs(browser, "verifier");

  await openVerification(verifier, orderNumber);
  await recordCounts(verifier, false);
  await approveOrder(verifier, orderNumber);

  await verifier.close();

  // 3. Sewing Supervisor sees and starts the approved order.
  const sewing = await loginAs(browser, "sewing");

  const row = await findOrder(sewing, orderNumber);

  await row.getByRole("button", { name: "Details" }).click();

  const dialog = sewing.getByRole("dialog", {
    name: `Batch ${orderNumber}`,
  });

  await expect(dialog.getByText("Verified Production Batch")).toBeVisible();

  await dialog
    .getByRole("button", {
      name: "Start Sewing Assembly",
    })
    .click();

  await sewing
    .getByRole("dialog", {
      name: "Start sewing assembly?",
    })
    .getByRole("button", {
      name: "Start Sewing",
    })
    .click();

  await expect(
    sewing.getByText("Sewing assembly started successfully"),
  ).toBeVisible();

  await expect(await findOrder(sewing, orderNumber)).toBeVisible();

  await sewing.close();
});
