import { BasePage } from "./BasePage.js";
import { expect } from "@playwright/test";

export class RegistrationPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators 
    this.phoneInput = page.getByPlaceholder("718-123-4567");
    this.agreementCheckbox = page.getByRole("checkbox");
    this.continueButtonLocator = page.getByRole("button", { name: "Continue" });
    this.errorMessage = page.locator("text=/Oops! Wrong number entered./i");
    this.otpFields = page.getByRole("textbox");
    this.submitButton = page.getByRole("button", { name: "Submit" });
    this.resendOTPText = page.locator("text=/Resend OTP|Didn't you receive|resend/i");
    this.resendQuestion = page.getByText(/Didn't you receive any code/i);
  }


  // Actions
  async enterPhoneNumber(phoneNumber) {
    await this.wait(1000);
    const phoneInput = this.phoneInput;
    await phoneInput.click();
    await phoneInput.clear();

    for (const digit of phoneNumber) {
      await phoneInput.type(digit, { delay: 50 });
    }
    await this.wait(3000);
  }

  async checkAgreement() {
    await this.agreementCheckbox.click();
  }

  async verifyRegistrationPageLoads() {
    await expect(this.phoneInput).toBeVisible();
    await expect(this.agreementCheckbox).toBeVisible();
    await expect(this.continueButtonLocator).toBeVisible();
    await expect(this.continueButtonLocator).toBeEnabled();
  }

  async continueButton() {
    await this.continueButtonLocator.click();
    await this.waitForURL(/.*\/(check|verify-otp)/, 5000);
  }

  async enterOTP(code = "1234") {
    const otpFields = this.otpFields;
    const digits = code.split("");
    for (let i = 0; i < digits.length; i++) {
      await otpFields.nth(i).fill(digits[i]);
    }
  }

  async verifyOTP() {
    await this.enterOTP("1234");
    await this.submitButton.click();
    await expect(
      this.page.getByRole("heading", { name: /Device|Profile/i }),
    ).toBeVisible({ timeout: 10000 });
  }

  async verifyResendOptionAvailable() {
    await expect(this.resendOTPText).toBeVisible({ timeout: 3000 });
    await expect(this.resendQuestion).toBeVisible();
  }

  async completePhoneVerification(phoneNumber) {
    await this.enterPhoneNumber(phoneNumber);
    await this.checkAgreement();
    await this.continueButton();
  }
}
