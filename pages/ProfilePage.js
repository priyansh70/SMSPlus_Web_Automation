/**
 * Profile Page Object
 * Handles user profile creation
 */
import { BasePage } from "./BasePage.js";
import { expect } from "@playwright/test";

export class ProfilePage extends BasePage {
  constructor(page) {
    super(page);

    this.pageHeading = page.getByRole("heading", { name: "Profile" });
    this.subtitle = page.getByText(/Take a moment to personalize your profile/i);
    this.textboxes = page.getByRole("textbox");
    this.createProfileButton = page.getByRole("button", { name: "Create Profile" });
  }

  // Actions
  async verifyProfilePageLoads() {
    await expect(this.pageHeading).toBeVisible();
    await expect(this.subtitle).toBeVisible();
  }

  async fillProfileDetails(firstName, lastName, email) {
    await this.wait(2000);
    const inputs = this.textboxes;
    await inputs.nth(0).fill(firstName);
    await inputs.nth(1).fill(lastName);
    await inputs.nth(2).fill(email);
  }

  async verifyProfileDetailsFilled(firstName, lastName, email) {
    const inputs = this.textboxes;
    await expect(inputs.nth(0)).toHaveValue(firstName);
    await expect(inputs.nth(1)).toHaveValue(lastName);
    await expect(inputs.nth(2)).toHaveValue(email);
  }

  async submitProfile() {
    await this.wait(1000);
    await this.createProfileButton.click();
    await this.waitForURL(/.*\/plans-and-subscription/, 5000);
  }

  async createProfile(firstName, lastName, email) {
    await this.verifyProfilePageLoads();
    await this.fillProfileDetails(firstName, lastName, email);
    await this.verifyProfileDetailsFilled(firstName, lastName, email);
    await this.submitProfile();
  }
}
