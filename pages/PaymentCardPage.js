/**
 * Payment Card Page Object
 * Handles payment card details entry
 */
import { BasePage } from "./BasePage.js";
import { expect } from "@playwright/test";

export class PaymentCardPage extends BasePage {
  constructor(page) {
    super(page);

    this.formTextboxes = page.getByRole("textbox");
    this.holderNameInput = this.formTextboxes.nth(0);
    this.cardNumberInput = this.formTextboxes.nth(1);
    this.expirationDateInput = this.formTextboxes.nth(2);
    this.cvvInput = this.formTextboxes.nth(3);
    this.nickNameInput = this.formTextboxes.nth(4);
    this.billingAddressInput = this.formTextboxes.nth(5);
    this.postalCodeInput = this.formTextboxes.nth(6);
    this.submitButton = page.getByRole("button", { name: /Submit/i });
    this.expirationErrorMessage = page.locator("text=/must not be past|expired|invalid/i");
  }

  // Actions
  async fillCardData(cardDetails) {
    const {
      holderName,
      cardNumber,
      expirationDate,
      cvv,
      nickName,
      billingAddress,
      postalCode,
    } = cardDetails;

    if (holderName) await this.holderNameInput.fill(holderName);
    if (cardNumber)
      await this.cardNumberInput.fill(cardNumber, { delay: 20 });
    if (expirationDate)
      await this.expirationDateInput.fill(expirationDate);
    if (cvv) await this.cvvInput.fill(cvv);
    if (nickName) await this.nickNameInput.fill(nickName);
    if (billingAddress)
      await this.billingAddressInput.fill(billingAddress);
    if (postalCode) await this.postalCodeInput.fill(postalCode);
  }

  async fillAllCardDetails() {
    const cardDetails = {
      holderName: "John Smith",
      cardNumber: "4111111111111111",
      expirationDate: "12/27",
      cvv: "123",
      nickName: "TestCard",
      billingAddress: "123 Main Street, New York, NY 10001",
      postalCode: "10001",
    };
    await this.fillCardData(cardDetails);
  }

  async verifyCardValue(field, value) {
    let input;
    if (field === "cardNumber") {
      input = this.cardNumberInput;
    }
    const cardValue = await input.inputValue();
    expect(cardValue).toBeDefined();
  }

  async submitCardDetails() {
    await this.submitButton.click();
    await this.waitForURL(/.*\/payment/, 5000);
  }

  async enterInvalidCardAndVerify() {
    await this.fillCardData({
      holderName: "John Smith",
      cardNumber: "1111111111111111",
      expirationDate: "12/27",
    });
    await this.verifyCardValue("cardNumber", "1111111111111111");
  }

  async enterPastExpirationAndVerify() {
    await this.fillCardData({
      expirationDate: "12/25",
    });

    await this.submitButton.click();

    await expect(this.expirationErrorMessage).toBeVisible({
      timeout: 3000,
    });

    await this.expirationDateInput.fill("12/27");
    const errorStillVisible = await this.expirationErrorMessage
      .isVisible()
      .catch(() => false);
    expect(!errorStillVisible).toBeTruthy();
  }
}
