import { test, expect } from "@playwright/test";
import { PaymentCardPage } from "../pages/PaymentCardPage.js";
import { PaymentPage } from "../pages/PaymentPage.js";
import { PlansPage } from "../pages/PlansPage.js";
import {
  completeRegistrationToPlans,
  completePaymentCardDetails,
} from "../helpers/appFlow.js";

test.describe("Payment Suite", () => {
  test("4.1 Complete payment with all card details", async ({ page }) => {
    await completeRegistrationToPlans(page);

    const plansPage = new PlansPage(page);
    await plansPage.selectPlan("Basic", "monthly");
    await plansPage.proceedToPayment();

    const paymentCardPage = new PaymentCardPage(page);
    await paymentCardPage.fillAllCardDetails();
    await paymentCardPage.submitCardDetails();

    const paymentPage = new PaymentPage(page);
    await paymentPage.expectOrderSummaryVisible();
  });

  test("4.2 Verify order summary before payment", async ({ page }) => {
    await completePaymentCardDetails(page);

    const paymentPage = new PaymentPage(page);
    await paymentPage.expectPlanDetails({ planName: "Basic", billingCycle: "month" });
    await expect(paymentPage.changePlanButton).toBeVisible();
    await paymentPage.expectPayNowEnabled();
  });

  test("4.3 Complete payment confirmation", async ({ page }) => {
    await completePaymentCardDetails(page);

    const paymentPage = new PaymentPage(page);
    await paymentPage.clickPayNow();
    await expect(paymentPage.successDialog).toBeVisible({ timeout: 10000 });
    await paymentPage.continueAfterPayment();
  });

  test("4.4 Invalid card number validation", async ({ page }) => {
    await completeRegistrationToPlans(page);

    const plansPage = new PlansPage(page);
    await plansPage.selectPlan("Basic", "monthly");
    await plansPage.proceedToPayment();

    const paymentCardPage = new PaymentCardPage(page);
    await paymentCardPage.enterInvalidCardAndVerify();
  });

  test("4.5 Past expiration date validation", async ({ page }) => {
    await completeRegistrationToPlans(page);

    const plansPage = new PlansPage(page);
    await plansPage.selectPlan("Basic", "monthly");
    await plansPage.proceedToPayment();

    const paymentCardPage = new PaymentCardPage(page);
    await paymentCardPage.enterPastExpirationAndVerify();
  });

  test("4.6 Change plan from payment page", async ({ page }) => {
    await completePaymentCardDetails(page);

    const paymentPage = new PaymentPage(page);
    await paymentPage.clickChangePlan();

    const plansPage = new PlansPage(page);
    await plansPage.selectPlan("Premium", "yearly");

    await expect(plansPage.makePaymentButton).toBeEnabled();
  });
});
