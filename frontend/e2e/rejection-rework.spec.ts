import { test, expect } from "@playwright/test";
import {
  loginAs,
  createAndSubmitOrder,
  findOrder,
  openVerification,
  recordCounts,
  approveOrder,
} from "./helpers";

test("RED shortage rejection and rework workflow", async ({ browser }) => {
  const rollId = `E2E-REWORK-${Date.now()}`;

  // 1. Create and submit a cutting order.
  const cutting = await loginAs(browser, "cutting");

  const orderNumber = await createAndSubmitOrder(cutting, rollId);

  await cutting.close();

  // 2. Cutting Verifier records a RED shortage.
  const verifier = await loginAs(browser, "verifier");

  const dialog = await openVerification(verifier, orderNumber);

  await recordCounts(verifier, true);

  await expect(
    dialog.getByRole("button", {
      name: "Approve",
      exact: true,
    }),
  ).toBeDisabled();

  // 3. Reject with a reason.
  await dialog
    .getByRole("button", {
      name: "Reject",
    })
    .click();

  const rejectionDialog = verifier.getByRole("dialog", {
    name: "Reject Batch",
  });

  await rejectionDialog
    .getByPlaceholder(/Enter rejection reason/i)
    .fill("Front panel shortage found during verification");

  await rejectionDialog
    .getByRole("button", {
      name: "Reject",
    })
    .click();

  await expect(rejectionDialog).toBeHidden();

  await verifier.close();

  // 4. Supervisor reopens and resubmits the rejected order.
  const supervisor = await loginAs(browser, "cutting");

  const row = await findOrder(supervisor, orderNumber);
  await row.getByRole("button", { name: "View" }).click();

  await supervisor
    .getByRole("button", {
      name: "Reopen for Rework",
    })
    .click();

  await supervisor
    .getByRole("dialog", {
      name: "Reopen rejected order?",
    })
    .getByRole("button", {
      name: "Reopen Order",
    })
    .click();

  // Reopen the order details and submit again.
  const refreshed = await findOrder(supervisor, orderNumber);
  await refreshed
    .getByRole("button", {
      name: "View",
    })
    .click();

  await supervisor
    .getByRole("button", {
      name: "Submit for Verification",
    })
    .click();

  await supervisor
    .getByRole("dialog", {
      name: "Submit cutting order?",
    })
    .getByRole("button", {
      name: "Submit Order",
    })
    .click();

  await supervisor.close();

  // 5. Verifier records corrected counts and approves.
  const verifierAgain = await loginAs(browser, "verifier");

  await openVerification(verifierAgain, orderNumber);
  await recordCounts(verifierAgain, false);
  await approveOrder(verifierAgain, orderNumber);

  await verifierAgain.close();
});
