import { test as base, expect, type Page, type TestInfo } from "@playwright/test";
import { completeFlowForExistingUser } from "../helpers/appFlow.js";
import { AutoReplyPage } from "../pages/AutoReplyPage.js";
import { ChatListPage } from "../pages/ChatListPage.js";
import { displayTestBanner } from "../helpers/utils.js";

type AutoReplyWorkerFixtures = {
  sharedPage: Page;
};

type AutoReplyConfiguration = {
  namePart: string;
  frequency: "Per Message" | "Per Contact";
  option: string;
  condition?: string;
};

async function createAndVerifyConfiguration(
  autoReplyPage: AutoReplyPage,
  configuration: AutoReplyConfiguration,
  testInfo: TestInfo,
) {
  const suffix = `${Date.now()}_${testInfo.project.name}_${testInfo.workerIndex}_${testInfo.retry}`;
  const name = `QA_AutoReply_${configuration.namePart}_${suffix}`;
  const message = `Automated QA test reply for ${configuration.namePart}.`;
  const createdRow = autoReplyPage.getMessageRow(name);

  try {
    await autoReplyPage.openCreateAutoReplyModal();
    await autoReplyPage.fillAutoReplyName(name);
    await autoReplyPage.fillAutoReplyMessage(message);
    await autoReplyPage.setMessageActive(true);
    await autoReplyPage.selectReplyFrequency(configuration.frequency);
    await autoReplyPage.selectMessageOption(configuration.option);
    if (configuration.condition) {
      await autoReplyPage.selectMessageOption(configuration.condition);
    }
    await autoReplyPage.saveAutoReplyMessage();

    await expect(autoReplyPage.messageModalHeading).not.toBeVisible();
    await expect(createdRow).toBeVisible();

    await autoReplyPage.openEditAutoReplyModal(name);
    await expect(autoReplyPage.messageStatusToggle).toBeChecked();
    await expect(autoReplyPage.getReplyFrequencyRadio(configuration.frequency)).toBeChecked();
    await expect(autoReplyPage.getMessageOptionRadio(configuration.option)).toBeChecked();
    if (configuration.condition) {
      await expect(autoReplyPage.getMessageOptionRadio(configuration.condition)).toBeChecked();
    }
    await autoReplyPage.cancelAutoReplyMessage();
    await expect(autoReplyPage.messageModalHeading).not.toBeVisible();
  } finally {
    if (!autoReplyPage.page.isClosed() && await autoReplyPage.messageModalHeading.isVisible()) {
      await autoReplyPage.cancelAutoReplyMessage();
    }
    if (!autoReplyPage.page.isClosed() && await createdRow.count()) {
      await autoReplyPage.deleteMessage(name);
      await expect(createdRow).toHaveCount(0);
      await autoReplyPage.page.reload();
      await expect(createdRow).toHaveCount(0);
    }
  }
}

const test = base.extend<{}, AutoReplyWorkerFixtures>({
  sharedPage: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await completeFlowForExistingUser(page);
    await use(page);
    await page.close();
    await context.close();
  }, { scope: "worker" }],
  page: async ({ sharedPage }, use) => {
    await use(sharedPage);
  },
});

test.describe("Auto Reply Feature Suite", () => {
  test.describe.configure({ mode: "serial" });

  let chatList: ChatListPage;
  let autoReplyPage: AutoReplyPage;

  test.beforeAll(async ({ page }) => {
    const chatsUrl = new URL("/chats", page.url()).toString();
    await page.goto(chatsUrl, { waitUntil: "domcontentloaded" });

    chatList = new ChatListPage(page);
    await chatList.verifyChatListPageLoads();
    await chatList.openAutoReplyPage();
  })

  test.beforeEach(async ({ page }, testInfo) => {

    autoReplyPage = new AutoReplyPage(page);
    await expect(autoReplyPage.pageHeading).toBeVisible();
    // await expect(autoReplyPage.messageRows.first()).toBeVisible();

    // Navigate or wait for a page, then inject a visible banner
    await displayTestBanner(testInfo, page);
  });

  test("TC:1 creates Per Message — All Messages", async ({ }, testInfo) => {
    await createAndVerifyConfiguration(autoReplyPage, {
      namePart: "PerMessage_AllMessages",
      frequency: "Per Message",
      option: "All messages",
    }, testInfo);
  });

  test("TC:2 creates Per Message — During Business Hours", async ({ }, testInfo) => {
    await createAndVerifyConfiguration(autoReplyPage, {
      namePart: "PerMessage_DuringHours",
      frequency: "Per Message",
      option: "During Hours Messages",
    }, testInfo);
  });

  test("TC:3 creates Per Message — Outside Business Hours", async ({ }, testInfo) => {
    await createAndVerifyConfiguration(autoReplyPage, {
      namePart: "PerMessage_OutsideHours",
      frequency: "Per Message",
      option: "Out of Hours Messages",
    }, testInfo);
  });

  test("TC:4 creates Per Contact — After Initial Message from a New Contact", async ({ }, testInfo) => {
    await createAndVerifyConfiguration(autoReplyPage, {
      namePart: "PerContact_InitialMessage",
      frequency: "Per Contact",
      option: "After Initial Message from a New Contact",
    }, testInfo);
  });

  test("TC:5 creates Daily Per Contact — At All Times", async ({ }, testInfo) => {
    await createAndVerifyConfiguration(autoReplyPage, {
      namePart: "Daily_AllTimes",
      frequency: "Per Contact",
      option: "Daily Per Contact",
      condition: "At all times",
    }, testInfo);
  });

  test("TC:6 creates Daily Per Contact — Only During Business Hours", async ({ }, testInfo) => {
    await createAndVerifyConfiguration(autoReplyPage, {
      namePart: "Daily_DuringHours",
      frequency: "Per Contact",
      option: "Daily Per Contact",
      condition: "Only during business hours",
    }, testInfo);
  });

  test("TC:7 creates Daily Per Contact — Only Outside Business Hours", async ({ }, testInfo) => {
    await createAndVerifyConfiguration(autoReplyPage, {
      namePart: "Daily_OutsideHours",
      frequency: "Per Contact",
      option: "Daily Per Contact",
      condition: "Only outside business hours",
    }, testInfo);
  });

  test("TC:8 creates Weekly Per Contact — At All Times", async ({ }, testInfo) => {
    await createAndVerifyConfiguration(autoReplyPage, {
      namePart: "Weekly_AllTimes",
      frequency: "Per Contact",
      option: "Weekly Per Contact",
      condition: "At all times",
    }, testInfo);
  });

  test("TC:9 creates Weekly Per Contact — Only During Business Hours", async ({ }, testInfo) => {
    await createAndVerifyConfiguration(autoReplyPage, {
      namePart: "Weekly_DuringHours",
      frequency: "Per Contact",
      option: "Weekly Per Contact",
      condition: "Only during business hours",
    }, testInfo);
  });

  test("TC:10 creates Weekly Per Contact — Only Outside Business Hours", async ({ }, testInfo) => {
    await createAndVerifyConfiguration(autoReplyPage, {
      namePart: "Weekly_OutsideHours",
      frequency: "Per Contact",
      option: "Weekly Per Contact",
      condition: "Only outside business hours",
    }, testInfo);
  });

  test("TC:11 creates Monthly Per Contact — At All Times", async ({ }, testInfo) => {
    await createAndVerifyConfiguration(autoReplyPage, {
      namePart: "Monthly_AllTimes",
      frequency: "Per Contact",
      option: "Monthly Per Contact",
      condition: "At all times",
    }, testInfo);
  });

  test("TC:12 creates Monthly Per Contact — Only During Business Hours", async ({ }, testInfo) => {
    await createAndVerifyConfiguration(autoReplyPage, {
      namePart: "Monthly_DuringHours",
      frequency: "Per Contact",
      option: "Monthly Per Contact",
      condition: "Only during business hours",
    }, testInfo);
  });

  test("TC:13 creates Monthly Per Contact — Only Outside Business Hours", async ({ }, testInfo) => {
    await createAndVerifyConfiguration(autoReplyPage, {
      namePart: "Monthly_OutsideHours",
      frequency: "Per Contact",
      option: "Monthly Per Contact",
      condition: "Only outside business hours",
    }, testInfo);
  });

  test("TC:14 deletes an auto reply message", async ({ }, testInfo) => {
    const suffix = `${Date.now()}_${testInfo.project.name}_${testInfo.workerIndex}_${testInfo.retry}`;
    const name = `QA_AutoReply_DeleteTest_${suffix}`;
    const message = "Automated QA test reply for delete test.";

    await autoReplyPage.openCreateAutoReplyModal();
    await autoReplyPage.fillAutoReplyName(name);
    await autoReplyPage.fillAutoReplyMessage(message);
    await autoReplyPage.setMessageActive(true);
    await autoReplyPage.selectReplyFrequency("Per Message");
    await autoReplyPage.selectMessageOption("All messages");
    await autoReplyPage.saveAutoReplyMessage();

    await expect(autoReplyPage.messageModalHeading).not.toBeVisible();
    const createdRow = autoReplyPage.getMessageRow(name);
    await expect(createdRow).toBeVisible();

    await autoReplyPage.deleteMessage(name);
    await expect(createdRow).toHaveCount(0);
    await autoReplyPage.page.reload();
    await expect(createdRow).toHaveCount(0);
  });

  test("TC:15 toggles auto reply message inactive and active", async ({ }, testInfo) => {
    const suffix = `${Date.now()}_${testInfo.project.name}_${testInfo.workerIndex}_${testInfo.retry}`;
    const name = `QA_AutoReply_ToggleTest_${suffix}`;
    const message = "Automated QA test reply for toggle test.";

    await autoReplyPage.openCreateAutoReplyModal();
    await autoReplyPage.fillAutoReplyName(name);
    await autoReplyPage.fillAutoReplyMessage(message);
    await autoReplyPage.setMessageActive(true);
    await autoReplyPage.selectReplyFrequency("Per Message");
    await autoReplyPage.selectMessageOption("All messages");
    await autoReplyPage.saveAutoReplyMessage();

    await expect(autoReplyPage.messageModalHeading).not.toBeVisible();
    const createdRow = autoReplyPage.getMessageRow(name);
    await expect(createdRow).toBeVisible();

    expect(await autoReplyPage.isMessageEnabled(name)).toBeTruthy();

    await autoReplyPage.setMessageEnabled(name, false);
    expect(await autoReplyPage.isMessageEnabled(name)).toBeFalsy();

    await autoReplyPage.setMessageEnabled(name, true);
    expect(await autoReplyPage.isMessageEnabled(name)).toBeTruthy();

    await autoReplyPage.deleteMessage(name);
    await expect(createdRow).toHaveCount(0);
    await autoReplyPage.page.reload();
    await expect(createdRow).toHaveCount(0);
  });

  test("TC:16 edits an auto reply message", async ({ }, testInfo) => {
    const suffix = `${Date.now()}_${testInfo.project.name}_${testInfo.workerIndex}_${testInfo.retry}`;
    const name = `QA_AutoReply_EditTest_${suffix}`;
    const message = "Automated QA test reply for edit test.";
    const updatedName = `QA_AutoReply_Edited_${suffix}`;
    const updatedMessage = "Updated automated QA test reply.";

    await autoReplyPage.openCreateAutoReplyModal();
    await autoReplyPage.fillAutoReplyName(name);
    await autoReplyPage.fillAutoReplyMessage(message);
    await autoReplyPage.setMessageActive(true);
    await autoReplyPage.selectReplyFrequency("Per Message");
    await autoReplyPage.selectMessageOption("All messages");
    await autoReplyPage.saveAutoReplyMessage();

    await expect(autoReplyPage.messageModalHeading).not.toBeVisible();
    const createdRow = autoReplyPage.getMessageRow(name);
    await expect(createdRow).toBeVisible();

    await autoReplyPage.openEditAutoReplyModal(name);
    await expect(autoReplyPage.messageModalHeading).toBeVisible();
    await autoReplyPage.fillAutoReplyName(updatedName);
    await autoReplyPage.fillAutoReplyMessage(updatedMessage);
    await autoReplyPage.saveAutoReplyMessage();

    await expect(autoReplyPage.messageModalHeading).not.toBeVisible();
    const updatedRow = autoReplyPage.getMessageRow(updatedName);
    await expect(updatedRow).toBeVisible();
    await expect(createdRow).toHaveCount(0);

    await autoReplyPage.openEditAutoReplyModal(updatedName);
    await expect(autoReplyPage.messageNameInput).toHaveValue(updatedName);
    await expect(autoReplyPage.messageTextArea).toHaveValue(updatedMessage);
    await autoReplyPage.cancelAutoReplyMessage();

    await autoReplyPage.deleteMessage(updatedName);
    await expect(updatedRow).toHaveCount(0);
    await autoReplyPage.page.reload();
    await expect(updatedRow).toHaveCount(0);
  });

  test("TC:17 validates required fields when creating auto reply message", async ({ }, testInfo) => {
    const suffix = `${Date.now()}_${testInfo.project.name}_${testInfo.workerIndex}_${testInfo.retry}`;
    const name = `QA_AutoReply_Validation_${suffix}`;

    await autoReplyPage.openCreateAutoReplyModal();
    await expect(autoReplyPage.messageModalHeading).toBeVisible();

    await autoReplyPage.messageModalSaveButton.click();
    const nameError = autoReplyPage.page.getByText("Please enter a name.", { exact: true });
    const messageError = autoReplyPage.page.getByText("Please enter a message.", { exact: true });
    await expect(nameError).toBeVisible();
    await expect(messageError).toBeVisible();

    await autoReplyPage.fillAutoReplyName(name);
    await autoReplyPage.messageModalSaveButton.click();
    await expect(nameError).not.toBeVisible();
    await expect(messageError).toBeVisible();

    await autoReplyPage.fillAutoReplyMessage("Test message");
    await autoReplyPage.messageModalSaveButton.click();
    await expect(messageError).not.toBeVisible();

    await expect(autoReplyPage.messageModalHeading).not.toBeVisible();
    const createdRow = autoReplyPage.getMessageRow(name);
    await expect(createdRow).toBeVisible();

    await autoReplyPage.deleteMessage(name);
    await expect(createdRow).toHaveCount(0);
    await autoReplyPage.page.reload();
    await expect(createdRow).toHaveCount(0);
  });

  test.only("TC:18 Delete All Existing Auto Reply Messages", async ({ }, testInfo) => {
    await autoReplyPage.page.waitForLoadState("networkidle");
    const messageRows = autoReplyPage.messageRows;
    let remainingCount = await messageRows.count();
    console.log(`Found ${remainingCount} auto reply messages to delete.`);

    while (remainingCount > 0) {
      const firstRow = messageRows.first();
      const name = await firstRow.locator(".ar-row-name").innerText();
      console.log(`Deleting auto reply message with name: ${name}`);
      await autoReplyPage.deleteMessage(name);
      remainingCount--;
      await expect(messageRows).toHaveCount(remainingCount);
    }

    await autoReplyPage.page.reload();
    await expect(autoReplyPage.messageRows).toHaveCount(0);
  });

  test.describe("Business Hours Configuration", () => {
    test.beforeEach(async () => {
      await expect(autoReplyPage.businessHoursSection).toBeVisible();
    });

    test("TC:18 turns on and off a specific business day", async ({ }, testInfo) => {
      const day = "Sun";

      await autoReplyPage.setBusinessDayEnabled(day, false);
      expect(await autoReplyPage.isBusinessDayEnabled(day)).toBeFalsy();

      await autoReplyPage.setBusinessDayEnabled(day, true);
      expect(await autoReplyPage.isBusinessDayEnabled(day)).toBeTruthy();

      await autoReplyPage.setBusinessDayEnabled(day, false);
      expect(await autoReplyPage.isBusinessDayEnabled(day)).toBeFalsy();
    });

    test("TC:19 adds multiple time slots for a business day", async ({ }, testInfo) => {
      const day = "Tue";

      await autoReplyPage.setBusinessDayEnabled(day, true);
      await autoReplyPage.cleanUpBusinessHours(day);

      await autoReplyPage.selectBusinessHours(day, 0, "09:00 AM", "12:00 PM");

      await autoReplyPage.addBusinessHoursRange(day);
      await autoReplyPage.page.waitForTimeout(500);
      await autoReplyPage.selectBusinessHours(day, 1, "01:00 PM", "05:00 PM");

      await autoReplyPage.addBusinessHoursRange(day);
      await autoReplyPage.page.waitForTimeout(500);
      await autoReplyPage.selectBusinessHours(day, 2, "06:00 PM", "09:00 PM");

      await autoReplyPage.saveBusinessHours();
      await autoReplyPage.page.reload();

      expect(await autoReplyPage.isBusinessDayEnabled(day)).toBeTruthy();

      const timeSelects = autoReplyPage.getBusinessDayTimeSelects(day);
      await expect(timeSelects.nth(0)).toHaveValue("09:00 AM");
      await expect(timeSelects.nth(1)).toHaveValue("12:00 PM");
      await expect(timeSelects.nth(2)).toHaveValue("01:00 PM");
      await expect(timeSelects.nth(3)).toHaveValue("05:00 PM");
      await expect(timeSelects.nth(4)).toHaveValue("06:00 PM");
      await expect(timeSelects.nth(5)).toHaveValue("09:00 PM");
    });

    test("TC:20 prevents overlapping time slots on the same day", async ({ }, testInfo) => {
      const day = "Wed";

      await autoReplyPage.setBusinessDayEnabled(day, true);
      await autoReplyPage.selectBusinessHours(day, 0, "09:00 AM", "12:00 PM");

      await autoReplyPage.addBusinessHoursRange(day);
      await autoReplyPage.selectBusinessHours(day, 1, "11:00 AM", "02:00 PM");

      const errorMessage = autoReplyPage.overlapErrorMessage;
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      await autoReplyPage.selectBusinessHours(day, 1, "01:00 PM", "03:00 PM");
      await autoReplyPage.saveBusinessHours();

      await expect(errorMessage).not.toBeVisible();
    });

    test("TC:21 Removes a time slot range", async ({ }, testInfo) => {
      const day = "Thu";

      await autoReplyPage.setBusinessDayEnabled(day, true);

      // Clean up any pre-existing time slots (keep only the first one)
      await autoReplyPage.cleanUpBusinessHours(day);

      await autoReplyPage.selectBusinessHours(day, 0, "09:00 AM", "12:00 PM");

      await autoReplyPage.addBusinessHoursRange(day);
      await autoReplyPage.selectBusinessHours(day, 1, "01:00 PM", "05:00 PM");

      await autoReplyPage.removeBusinessHoursRange(day, 1);

      await autoReplyPage.saveBusinessHours();

      const remainingSelects = autoReplyPage.getBusinessDayTimeSelects(day);
      await expect(remainingSelects).toHaveCount(2);
      await expect(remainingSelects.nth(0)).toHaveValue("09:00 AM");
      await expect(remainingSelects.nth(1)).toHaveValue("12:00 PM");
    });

    test("TC:22 persists business hours after save and reload", async ({ }, testInfo) => {
      const day = "Sat";

      // Clean up any pre-existing time slots (keep only the first one)
      await autoReplyPage.setBusinessDayEnabled(day, true);
      await autoReplyPage.cleanUpBusinessHours(day);

      await autoReplyPage.selectBusinessHours(day, 0, "10:00 AM", "02:00 PM");
      await autoReplyPage.addBusinessHoursRange(day);
      await autoReplyPage.selectBusinessHours(day, 1, "03:00 PM", "06:00 PM");
      await autoReplyPage.saveBusinessHours();

      await autoReplyPage.page.reload();

      expect(await autoReplyPage.isBusinessDayEnabled(day)).toBeTruthy();
      const timeSelects = autoReplyPage.getBusinessDayTimeSelects(day);
      await expect(timeSelects).toHaveCount(4);
      await expect(timeSelects.nth(0)).toHaveValue("10:00 AM");
      await expect(timeSelects.nth(1)).toHaveValue("02:00 PM");
      await expect(timeSelects.nth(2)).toHaveValue("03:00 PM");
      await expect(timeSelects.nth(3)).toHaveValue("06:00 PM");
    });
  });
});
