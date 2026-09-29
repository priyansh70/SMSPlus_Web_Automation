import { Page, expect } from "@playwright/test";
import { PhoneNumberUtil } from "google-libphonenumber";
import { faker } from "@faker-js/faker";
import fs from "fs";
import path from "path";
import xlsx from "xlsx";

const EXTENSION_WEB_URL = process.env.EXTENSION_WEB_URL;
// ==================== HELPER FUNCTIONS ====================

export function logPurchase(customerName, planName, billingCycle) {
  const logPath = path.join(process.cwd(), "data", "purchases.log");
  const entry = `${new Date().toISOString()},${customerName},${planName},${billingCycle}\n`;
  // ensure directory exists
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, entry, "utf8");
}

export function generateUSNumber() {
  const phoneUtil = PhoneNumberUtil.getInstance();
  function randomDigit(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  while (true) {
    // Area Code: first digit 2–9
    const areaCode =
      randomDigit(2, 9).toString() + randomDigit(0, 9) + randomDigit(0, 9);

    // Avoid N11 (211, 311, etc.)
    if (areaCode[1] === "1" && areaCode[2] === "1") continue;

    // Central Office Code: first digit 2–9
    const centralOffice =
      randomDigit(2, 9).toString() + randomDigit(0, 9) + randomDigit(0, 9);

    // Avoid N11 + generic 555
    if (
      (centralOffice[1] === "1" && centralOffice[2] === "1") ||
      centralOffice === "555"
    )
      continue;

    const lineNumber = randomDigit(0, 9999).toString().padStart(4, "0");

    const nationalNumber = `${areaCode}${centralOffice}${lineNumber}`;

    try {
      const parsed = phoneUtil.parse(nationalNumber, "US");

      if (
        phoneUtil.isValidNumber(parsed) &&
        phoneUtil.getRegionCodeForNumber(parsed) === "US"
      ) {
        return nationalNumber; // 🔥 Only 10 digits returned
      }
    } catch (e) {
      // retry
    }
  }
}

export function getRegistrationData(userIndex = process.env.USER_INDEX ?? 0) {
  if (process.env.USE_EXCEL_USERS !== "true") {
    return {
      phoneNumber: generateUSNumber(),
      ...generateUserDetails(),
    };
  }

  const workbookPath = path.resolve(
    process.env.EXCEL_USERS_FILE ?? "data/users.csv",
  );

  if (!fs.existsSync(workbookPath)) {
    throw new Error(
      `Excel user file was not found: ${workbookPath}. Set EXCEL_USERS_FILE or create data/users.xlsx.`,
    );
  }

  const workbook = xlsx.readFile(workbookPath);
  const sheet = workbook.Sheets["Users"] ?? workbook.Sheets[workbook.SheetNames[0]];
  const users = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  const user = users[Number(userIndex)];

  if (!user) {
    throw new Error(
      `No Excel user exists at zero-based USER_INDEX ${userIndex}. The workbook contains ${users.length} user row(s).`,
    );
  }

  const registrationData = {
    phoneNumber: String(user.mobileNumber ?? user.phoneNumber ?? "").trim(),
    firstName: String(user.firstName ?? "").trim(),
    lastName: String(user.lastName ?? "").trim(),
    email: String(user.email ?? "").trim(),
  };

  const missingFields = Object.entries(registrationData)
    .filter(([, value]) => !value)
    .map(([field]) => field);

  if (missingFields.length > 0) {
    throw new Error(
      `Excel user row ${Number(userIndex) + 2} is missing: ${missingFields.join(", ")}.`,
    );
  }

  return registrationData;
}

export function getRegistrationUserIndexes() {
  if (process.env.USE_EXCEL_USERS !== "true") {
    throw new Error(
      "Set USE_EXCEL_USERS=true and provide an Excel/CSV user file to run the multiple-user test.",
    );
  }

  const workbookPath = path.resolve(
    process.env.EXCEL_USERS_FILE ?? "data/users.csv",
  );

  if (!fs.existsSync(workbookPath)) {
    throw new Error(`Excel user file was not found: ${workbookPath}.`);
  }

  const workbook = xlsx.readFile(workbookPath);
  const sheet = workbook.Sheets["Users"] ?? workbook.Sheets[workbook.SheetNames[0]];
  const users = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  if (users.length === 0) {
    throw new Error(`No user rows were found in ${workbookPath}.`);
  }

  return users.map((_, index) => index);
}

export async function completePaymentCardDetails(page) {
  // Navigate to plans page
  const user = await completeRegistrationToPlans(page);

  // Select Basic monthly plan
  await page.getByRole("button", { name: /Basic/i }).first().click();
  await page.getByText(/10.00.*monthly/i).click();
  await page.getByRole("button", { name: /Make Payment/i }).click();

  // Fill card details
  const textboxes = page.getByRole("textbox");
  await textboxes.nth(0).fill("John Smith"); // Holder Name
  await textboxes.nth(1).fill("4532015112830366", { delay: 20 }); // Card number
  await textboxes.nth(2).fill("12/27"); // Expiration Date
  await textboxes.nth(3).fill("123"); // CVV
  await textboxes.nth(4).fill("TestCard"); // Nick Name
  await textboxes.nth(5).fill("123 Main Street, New York, NY 10001"); // Billing Address
  await textboxes.nth(6).fill("10001"); // Postal Code
  await page.getByRole("button", { name: /Submit/i }).click();

  // Wait for payment page
  await expect(page).toHaveURL(/.*\/payment-page/, { timeout: 5000 });

  // log the purchase since this helper also executes a Basic monthly purchase
  logPurchase(`${user.firstName} ${user.lastName}`, "Basic", "monthly");
}

export async function completeRegistrationToPlans(page) {
  // Navigate through device verification
  await page.goto(EXTENSION_WEB_URL);
  await page.getByRole("button", { name: "Select Device" }).click();
  await page.getByText("Device").nth(2).click();
  await page.getByText("Yes").click();
  await page.getByText("Android 7 or Higher").click();
  await page.getByRole("button", { name: "Go to Registration" }).click();

  // Phone verification
  await page.waitForTimeout(1000); // Wait for phone input to be ready
  const phoneNumber = generateUSNumber();
  await fillMaskedPhoneInput(page, phoneNumber);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Request OTP" }).click();

  // Wait for OTP page
  await expect(page).toHaveURL(/.*\/verify-otp/, { timeout: 5000 });

  // OTP verification with code 1234
  const otpFields = page.getByRole("textbox");
  await otpFields.nth(0).type("1", { delay: 100 });
  await otpFields.nth(1).type("2", { delay: 100 });
  await otpFields.nth(2).type("3", { delay: 100 });
  await otpFields.nth(3).type("4", { delay: 100 });
  await page.getByRole("button", { name: "Submit" }).click();

  // Profile creation with random data
  const { firstName, lastName, email } = await generateUserDetails();
  await page.waitForTimeout(2000); // Wait for profile inputs to be ready

  const profileInputs = page.getByRole("textbox");
  await profileInputs.nth(0).fill(firstName);
  await profileInputs.nth(1).fill(lastName);
  await profileInputs.nth(2).fill(email);

  await page.waitForTimeout(1000); // Wait for inputs to be processed
  await page.getByRole("button", { name: "Create Profile" }).click();

  // Wait for plans page
  await expect(page).toHaveURL(/.*\/plans-and-subscription/, { timeout: 5000 });

  // return the generated user details for further processing/logging
  return { firstName, lastName, email };
}

export async function fillMaskedPhoneInput(page, phoneNumber) {
  await page.waitForTimeout(1000); // Ensure input is ready
  const phoneInput = page.getByPlaceholder("718-123-4567");
  await phoneInput.click();
  await phoneInput.clear();

  // Type each digit with delay to allow auto-formatting
  for (const digit of phoneNumber) {
    await phoneInput.type(digit, { delay: 50 });
  }

  // Additional wait for auto-formatting to complete
  await page.waitForTimeout(3000);
}

export function generateUserDetails() {
  // Fill profile details with random data
  // const firstName = faker.person.firstName();
  const firstName = "Automation";
  const lastName = faker.person.lastName();
  const sanitizeEmailPart = (value) =>
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

  const email =
    sanitizeEmailPart(firstName) +
    "." +
    sanitizeEmailPart(lastName) +
    Math.floor(Math.random() * 10000) +
    "@yopmail.com";
  return { firstName, lastName, email };
}
