import { BasePage } from "./BasePage.js";
import { expect } from "@playwright/test";

export class PaymentPage extends BasePage {
  constructor(page) {
    super(page);

    // Centralized locators
    this.orderSummaryHeading = page.getByRole("heading", {
      name: /order summary/i,
    });
    this.planDescriptionText = page.getByText(/Charges the customer every/i);
    this.changePlanButton = page.getByRole("button", { name: /change plan/i });
    this.payNowButton = page.getByRole("button", { name: /pay now/i });
    this.successDialog = page.getByRole('heading', { name: 'Payment Successful' }).first();
    this.successMessage = page.getByRole("text", { name: /Your payment has been processed successfully/i }).first();
    this.continueLink = page.getByRole('button', { name: 'Continue' })

  }

  // ---------- Dynamic Locators ----------

  planNameText(planName) {
    return this.page.getByText(new RegExp(planName, "i"));
  }

  // priceText(amount) {
  //   return this.page.getByText(new RegExp(amount));
  // }

  // ---------- Assertions ----------

  async expectOrderSummaryVisible() {
    await expect(this.orderSummaryHeading.first()).toBeVisible();
  }

  async expectPlanDetails({ planName, billingCycle }) {
    await this.expectOrderSummaryVisible();

    if (planName) {
      await this.planNameText(planName).waitFor({ state: "visible" });
      await expect(this.planNameText(planName)).toBeVisible();
    }

    if (billingCycle) {
      await expect(this.planDescriptionText).toBeVisible();
    }

    // if (price) {
    //   await expect(this.priceText(price)).toBeVisible();
    // }
  }

  async expectChangePlanAvailable() {
    await expect(this.changePlanButton).toBeVisible();
    await expect(this.changePlanButton).toBeEnabled();
  }

  async expectPayNowEnabled() {
    await expect(this.payNowButton).toBeVisible();
    await expect(this.payNowButton).toBeEnabled();
  }

  // ---------- Actions ----------

  async clickChangePlan() {
    await this.changePlanButton.click();
    await this.waitForURL(/\/plans-and-subscription/, 5000);
  }

  async clickPayNow() {
    await this.payNowButton.click();
  }

  async completePayment() {
    await this.clickPayNow();
    await this.page.waitForLoadState("networkidle");
    await this.successDialog.waitFor({ state: "visible", timeout: 10000 }); 
    await expect(this.successDialog).toBeVisible({ timeout: 10000 });
  }

  async continueAfterPayment() {
    await this.continueLink.waitFor({ state: "visible" });
    await this.continueLink.click();
    await this.waitForURL(/\/chats/, 5000);
  }
}
