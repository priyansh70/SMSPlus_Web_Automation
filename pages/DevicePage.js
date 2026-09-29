/**
 * Device Check Page Object
 * Handles device selection and compatibility checks
 */
import { BasePage } from "./BasePage.js";
import { expect } from "@playwright/test";

export class DevicePage extends BasePage {
  constructor(page) {
    super(page);

    // Locators
    this.selectDeviceButton = page.getByRole("button", { name: "Select Device" });
    this.selectYourDeviceText = page.getByText("Select your device");
    this.deviceSelector = page.locator(".select-device");
    this.deviceList = this.deviceSelector.locator("ul.dropdown-menu");
    this.deviceOptions = this.deviceList.locator("li a.dropdown-item");
    this.dataPlanQuestion = page.getByText("Do you have a data plan on your phone?");
    this.yesButton = page.getByText("Yes");
    this.noButton = page.getByText("No");
    this.osVersionHeading = page.getByRole("heading", { name: "Which version do you have?" });
    this.minimumSupportedVersion = page.locator(".note strong");
    this.lowerOption = page.getByText("Lower");
    this.goToRegistrationButton = page.getByRole("button", { name: "Request OTP" });
  }

  // Actions
  async verifyDeviceCheckPageLoads() {
    await expect(this.selectYourDeviceText).toBeVisible();
    await expect(this.selectDeviceButton).toBeVisible();
  }

  async selectDevice() {
    await this.selectDeviceButton.click();
    await expect(this.deviceList).toBeVisible();
    await expect(this.deviceOptions.first()).toBeVisible();
    await this.deviceOptions.first().click();
  }

  async confirmDataPlan() {
    await expect(this.dataPlanQuestion).toBeVisible();
    await this.yesButton.click();
  }

  async selectOSVersion(version = "higher") {
    await expect(this.osVersionHeading).toBeVisible();
    if (version === "lower") {
      await this.lowerOption.click();
    } else {
      const minimumVersion = (await this.minimumSupportedVersion.textContent())?.trim();
      if (!minimumVersion) {
        throw new Error("The minimum supported device version was not displayed.");
      }

      const escapedVersion = minimumVersion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const higherOption = this.page.getByText(
        new RegExp(`^${escapedVersion}\\s+or Higher$`),
      );
      await expect(higherOption).toBeVisible();
      await higherOption.click();
    }
  }

  async proceedToRegistration() {
    const btn = this.goToRegistrationButton;
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await btn.click();
  }

  async completeDeviceCheck() {
    await this.verifyDeviceCheckPageLoads();
    await this.selectDevice();
    await this.confirmDataPlan();
    await this.selectOSVersion("higher");
    await this.proceedToRegistration();
  }
}
