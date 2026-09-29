import { test, expect } from "@playwright/test";
import { DevicePage } from "../pages/DevicePage.js";
import { RegistrationPage } from "../pages/RegistrationPage.js";
import { generateUSNumber } from "../helpers/utils.js";


const EXTENSION_WEB_URL = process.env.EXTENSION_WEB_URL;

test.describe("Device Verification Suite", () => {
  let devicePage: DevicePage;
  let registrationPage: RegistrationPage;

  test.beforeEach(async ({ page }) => {
    await page.goto(EXTENSION_WEB_URL);
    devicePage = new DevicePage(page);
    registrationPage = new RegistrationPage(page);

    let phoneNumber = generateUSNumber();
    await registrationPage.completePhoneVerification(phoneNumber);

  });

  test("1.1 Select device and confirm compatibility", async ({ page }) => {
    await devicePage.verifyDeviceCheckPageLoads();
    await devicePage.selectDevice();

    const updatedButton = page
      .getByRole("button")
      .filter({ hasText: "Device" })
      .first();
    await expect(updatedButton).toBeVisible();

    await expect(devicePage.dataPlanQuestion).toBeVisible();
  });

  test("1.2 Confirm data plan availability", async ({ page }) => {
    await devicePage.selectDevice();
    await devicePage.confirmDataPlan();

    await expect(page.locator("strong")).toContainText("Android 7");
    await expect(devicePage.osVersionHeading).toBeVisible();
    await expect(devicePage.minimumSupportedVersion).toBeVisible();
    await expect(devicePage.lowerOption).toBeVisible();
  });

  test("1.3 Select OS version - Android 7 or Higher", async ({ page }) => {
    await devicePage.selectDevice();
    await devicePage.confirmDataPlan();
    await devicePage.selectOSVersion("android7");

    const goToRegistrationButton = devicePage.goToRegistrationButton;
    await expect(goToRegistrationButton).toBeVisible();
    await expect(goToRegistrationButton).toBeEnabled();
  });

  test("1.4 Verify no data plan scenario - user cannot proceed", async ({
    page,
  }) => {
    await devicePage.selectDevice();
    await devicePage.noButton.click();
    test.skip();
  });

  test("1.5 Verify lower OS version scenario - not supported", async ({
    page,
  }) => {
    await devicePage.selectDevice();
    await devicePage.confirmDataPlan();
    await devicePage.selectOSVersion("lower");
    test.skip();
  });
});
