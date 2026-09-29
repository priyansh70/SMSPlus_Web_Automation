import { test } from "@playwright/test";
import { getRegistrationUserIndexes } from "../helpers/utils.js";
import {
  completeBasicMonthlyFlow,
  completeBasicYearlyFlow,
  completePremiumMonthlyFlow,
  completePremiumYearlyFlow,
  completeFlowForExistingUser,
  completePlanFlow,
} from "../helpers/appFlow.js";

const createUsersPlan = process.env.CREATE_USERS_PLAN ?? "basic";
const createUsersBilling = process.env.CREATE_USERS_BILLING ?? "monthly";

test.describe("End-to-End Flow Suite", () => {
  test("5.1 Basic Monthly Subscription", async ({ page }) => {
    await completeBasicMonthlyFlow(page);
  });

  test.only("5.2 Basic Yearly Subscription", async ({ page }) => {
    await completeBasicYearlyFlow(page);
  });

  test("5.3 Premium Monthly Subscription", async ({ page }) => {
    await completePremiumMonthlyFlow(page);
  });

  test("5.4 Premium Yearly Subscription", async ({ page }) => {
    await completePremiumYearlyFlow(page);
  });

  test("5.5 Create Multiple Users", async ({ browser }) => {
    test.setTimeout(30 * 60 * 1000);

    const userIndexes = getRegistrationUserIndexes();
    for (const userIndex of userIndexes) {
      const userPage = await browser.newPage();
      try {
        await completePlanFlow(
          userPage,
          createUsersPlan,
          createUsersBilling,
          userIndex,
        );
      } finally {
        await userPage.close();
      }
    }
  });

  test("Existing User Flow", async ({ page }) => {
    await completeFlowForExistingUser(page);
  })
});
