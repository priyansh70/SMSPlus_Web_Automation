import { test, expect } from "@playwright/test";
import { generateUSNumber, generateUserDetails } from "../helpers/utils.js";
import { DevicePage } from "../pages/DevicePage.js";
import { RegistrationPage } from "../pages/RegistrationPage.js";
import { ProfilePage } from "../pages/ProfilePage.js";
import { PlansPage } from "../pages/PlansPage.js";

const EXTENSION_WEB_URL = process.env.EXTENSION_WEB_URL;

test.describe("Registration Suite", () => {

  let registrationPage: RegistrationPage;

  test.beforeEach(async ({ page }) => {
    registrationPage = new RegistrationPage(page);
    await registrationPage.goto(EXTENSION_WEB_URL);

  });

  test("2.1 Complete phone verification with valid US number", async ({
    page,
  }) => {
    const phoneNumber = generateUSNumber();
    await registrationPage.enterPhoneNumber(phoneNumber);

    await registrationPage.checkAgreement();
    await registrationPage.continueButton();
  });

  test("2.2 Verify OTP with static code 1234", async ({ page }) => {

    const phoneNumber = generateUSNumber();
    await registrationPage.completePhoneVerification(phoneNumber);

    const devicePage = new DevicePage(page);
    await devicePage.completeDeviceCheck();

    await registrationPage.verifyOTP();

    const profilePage = new ProfilePage(page);
    await profilePage.verifyProfilePageLoads();
    await expect(profilePage.pageHeading).toBeVisible();
  });

  test("2.3 Create user profile with random data", async ({ page }) => {

    const phoneNumber = generateUSNumber();
    await registrationPage.completePhoneVerification(phoneNumber);

    const devicePage = new DevicePage(page);
    await devicePage.completeDeviceCheck();

    await registrationPage.verifyOTP();

    const profilePage = new ProfilePage(page);
    const { firstName, lastName, email } = generateUserDetails();
    await profilePage.createProfile(firstName, lastName, email);

    const plansPage = new PlansPage(page);
    await plansPage.verifyPlansPageLoads();
  });

  test("2.4 Invalid phone number validation - wrong format", async ({
    page,
  }) => {

    await registrationPage.verifyRegistrationPageLoads();
    await registrationPage.phoneInput.click();
    await registrationPage.phoneInput.type("000000000000", { delay: 150 });
    await registrationPage.checkAgreement();

    await registrationPage.phoneInput.click();
    await registrationPage.continueButtonLocator.click();

    expect(registrationPage.errorMessage).toBeVisible({
      timeout: 5000,
    });
  });

  test("2.5 Missing agreement checkbox validation", async ({ page }) => {

    const phoneNumber = generateUSNumber();
    await registrationPage.phoneInput.click();
    await registrationPage.phoneInput.type(phoneNumber, { delay: 50 });

    const agreementCheckbox = registrationPage.agreementCheckbox;
    await expect(agreementCheckbox).not.toBeChecked();

    // Click button without expecting navigation (validation should fail)
    await registrationPage.continueButtonLocator.click();

    // Wait for error message related to agreement checkbox
    const errorMessage = page.locator(
      "text=/check|terms|services/i",
    );
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test("2.6 Verify user resumes Profile page after login when profile is incomplete", async ({ page }) => {

    const phoneNumber = process.env.USER_WITH_INCOMPLETE_PROFILE ?? generateUSNumber();

    await registrationPage.completePhoneVerification(phoneNumber);

    const devicePage = new DevicePage(page);
    await devicePage.completeDeviceCheck();

    await registrationPage.verifyOTP();

    const profilePage = new ProfilePage(page);
    await profilePage.verifyProfilePageLoads();
    await expect(profilePage.pageHeading).toBeVisible();
  });

  test("2.7 Verify user lands on Plan Selection page after login when profile is completed but payment is pending", async ({ page }) => {

    const phoneNumber = generateUSNumber();
    await registrationPage.completePhoneVerification(phoneNumber);

    const devicePage = new DevicePage(page);
    await devicePage.completeDeviceCheck();

    await registrationPage.verifyOTP();

    const profilePage = new ProfilePage(page);
    const { firstName, lastName, email } = generateUserDetails();
    await profilePage.createProfile(firstName, lastName, email);

    const plansPage = new PlansPage(page);
    await plansPage.verifyPlansPageLoads();
    await expect(page).toHaveURL(/.*\/plans-and-subscription/, { timeout: 5000 });
  });

  test("2.8 Verify completed profile redirects user to Plan Selection page", async ({ page }) => {

    const phoneNumber = generateUSNumber();
    await registrationPage.completePhoneVerification(phoneNumber);

    const devicePage = new DevicePage(page);
    await devicePage.completeDeviceCheck();

    await registrationPage.verifyOTP();

    const profilePage = new ProfilePage(page);
    const { firstName, lastName, email } = generateUserDetails();
    await profilePage.fillProfileDetails(firstName, lastName, email);
    await profilePage.verifyProfileDetailsFilled(firstName, lastName, email);
    await profilePage.submitProfile();

    const plansPage = new PlansPage(page);
    await plansPage.verifyPlansPageLoads();
  });

  test("2.9 Verify valid OTP verification redirects user to Profile page when user does not exist", async ({ page }) => {

    const phoneNumber = generateUSNumber();
    await registrationPage.completePhoneVerification(phoneNumber);

    const devicePage = new DevicePage(page);
    await devicePage.completeDeviceCheck();

    await registrationPage.verifyOTP();

    const profilePage = new ProfilePage(page);
    await profilePage.verifyProfilePageLoads();
  });

});
