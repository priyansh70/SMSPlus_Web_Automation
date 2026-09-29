import { test, expect } from "@playwright/test";
import { PlansPage } from "../pages/PlansPage.js";
import { completeRegistrationToPlans } from "../helpers/appFlow.js";

test.describe("Plan Selection Suite", () => {

  test("3.1 Select Basic plan with monthly duration", async ({ page }) => {
    await completeRegistrationToPlans(page);

    const plansPage = new PlansPage(page);

    await plansPage.selectPlan("Basic", "monthly");
    await plansPage.proceedToPayment();

    await expect(page).toHaveURL(/.*\/manage-card/, { timeout: 5000 });
  });

  test("3.2 Select Premium plan with yearly duration", async ({ page }) => {
    await completeRegistrationToPlans(page);

    const plansPage = new PlansPage(page);

    await plansPage.selectPlan("Premium", "yearly");
    await plansPage.proceedToPayment();

    await expect(page).toHaveURL(/.*\/manage-card/, { timeout: 5000 });
  });

  test("3.3 Switch between plans before payment", async ({ page }) => {
    await completeRegistrationToPlans(page);

    const plansPage = new PlansPage(page);

    await plansPage.selectPlan("Basic", "monthly");
    await plansPage.selectPlan("Premium", "yearly");

    await expect(plansPage.makePaymentButton).toBeEnabled();
  });

  test("3.4 Verify Make Payment button disabled without plan selection", async ({
    page,
  }) => {
    await completeRegistrationToPlans(page);

    const plansPage = new PlansPage(page);
    await plansPage.verifyMakePaymentDisabled();
  });

});