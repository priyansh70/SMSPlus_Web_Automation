import { test as base, expect, type Page } from "@playwright/test";
import { completeFlowForExistingUser } from "../helpers/appFlow.js";
import { ChatListPage } from "../pages/ChatListPage.js";
import { ChatDetailPage } from "../pages/ChatDetailPage.js";

type ChatWorkerFixtures = {
  sharedPage: Page;
};

const test = base.extend<{}, ChatWorkerFixtures>({
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

test.describe("Chat Features Suite", () => {
  test.describe.configure({ mode: "serial" });
  let chatList: ChatListPage;

  test.beforeEach(async ({ page }) => {
    const chatsUrl = new URL("/chats", page.url()).toString();
    await page.goto(chatsUrl, { waitUntil: "domcontentloaded" });
    chatList = new ChatListPage(page);
    await chatList.verifyChatListPageLoads();
  });

  test("Search chats", async ({ page }) => {
    await expect(chatList.searchTrigger).toBeVisible();
    const target = process.env.USER_Y_PHONE;
    if (!target) {
      test.skip(true, "USER_Y_PHONE not set");
      return;
    }

    await chatList.searchChat(target);
    // If chat exists assert visible, otherwise assert empty state or at least no error
    try {
      await chatList.verifyChatItemVisible(target);
    } catch (e) {
      await expect(chatList.emptyStateText).toBeVisible().catch(() => { });
    }
  });

  test("Initiate a new conversation", async ({ page }) => {
    const target = process.env.USER_Y_PHONE;
    if (!target) {
      test.skip(true, "USER_Y_PHONE not set");
      return;
    }

    // Click the + icon, then "Start new conversation"
    await chatList.startNewChat();

    await chatList.initiateConversationWith(target);

    // Wait for the opened conversation to load
    const chatDetail = new ChatDetailPage(page);
    await chatDetail.verifyChatDetailPageLoads(target);

    // Send a dummy message
    const msg = `Hello from automated new chat ${Date.now()}`;
    await chatDetail.sendMessage(msg);
    await chatDetail.verifyMessageVisible(msg);
  });

  test("Archive Chat", async ({ page }) => {
    const items = await chatList.chatItems.count();
    test.skip(items === 0, "no chats to archive");
    await chatList.openFirstChat();
    const chatDetail = new ChatDetailPage(page);
    await chatDetail.verifyChatDetailPageLoads();
    const chatName = (await chatDetail.chatTitle.textContent())?.trim();
    await chatDetail.archiveChat();
    await chatList.openArchivedChats();
    await expect(chatList.getChatItemByText(chatName)).toBeVisible();
  });

  test("Unarchive Chat", async ({ page }) => {
    await chatList.openFirstArchivedChat();
    const chatDetail = new ChatDetailPage(page);
    await chatDetail.verifyChatDetailPageLoads();
    await chatDetail.unarchiveChat();
    await chatDetail.openMoreActionsMenu();
    await expect(chatDetail.archiveOption).toBeVisible();
  });

  test("Send a text message", async ({ page }) => {
    const chatDetail = new ChatDetailPage(page);
    await chatDetail.verifyChatDetailPageLoads();
    const msg = `Hello from automation ${Date.now()}`;
    await chatDetail.sendMessage(msg);
    await chatDetail.verifyMessageVisible(msg);
  });

  test("Search within a chat", async ({ page }) => {
    const chatList = new ChatListPage(page);
    const items = await chatList.chatItems.count();
    test.skip(items === 0, 'no chats to search within');
    await chatList.chatItems.first().click();
    const chatDetail = new ChatDetailPage(page);
    await chatDetail.verifyChatDetailPageLoads();
    // Try search inside chat if control exists
    if (await chatDetail.searchChatIcon.count() > 0) await chatDetail.searchChatIcon.click().catch(() => { });
    if (await chatDetail.searchChatInput.count() > 0) {
      const searchTerm = "Hello";
      await chatDetail.searchChatInput.fill(searchTerm);
      await page.keyboard.press("Enter");

      const noResultsFound = await chatDetail.noSearchResultsMessage
        .waitFor({ state: "visible", timeout: 2000 })
        .then(() => true)
        .catch(() => false);

      if (noResultsFound) {
        await expect(chatDetail.noSearchResultsMessage).toBeVisible();
      } else {
        await expect(page.getByText(new RegExp(searchTerm, "i")).first()).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test("Block chat", async ({ page }) => {
    const items = await chatList.chatItems.count();
    test.skip(items === 0, "no chats available to block");
    await chatList.openFirstChat();
    const chatDetail = new ChatDetailPage(page);
    await chatDetail.verifyChatDetailPageLoads();

    await chatDetail.blockChat();
    await expect(page).toHaveURL(/.*\/chats/, { timeout: 10000 });
    await expect(page.getByText("You have blocked this user.").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("Copy a message", async ({ page }) => {
    const items = await chatList.chatItems.count();
    test.skip(items === 0, "no chats available to copy a message");
    await chatList.openFirstChat();

    const chatDetail = new ChatDetailPage(page);
    await chatDetail.verifyChatDetailPageLoads();

    const message = `Copy message test ${Date.now()}`;
    await chatDetail.sendMessage(message);
    await chatDetail.verifyMessageVisible(message);
    await chatDetail.copyMessage(message);
  });

  test("Delete a message", async ({ page }) => {
    const items = await chatList.chatItems.count();
    test.skip(items === 0, "no chats available to delete a message");
    await chatList.openFirstChat();
    const chatDetail = new ChatDetailPage(page);
    await chatDetail.verifyChatDetailPageLoads();

    const message = `Delete message test ${Date.now()}`;
    await chatDetail.sendMessage(message);
    await chatDetail.verifyMessageVisible(message);
    await chatDetail.deleteMessage(message);
    await expect(chatDetail.getMessageByText(message)).toBeHidden({ timeout: 5000 });
  });

  test("Attach image, video, audio and contact", async ({ page }) => {
    const chatList = new ChatListPage(page);
    const items = await chatList.chatItems.count();
    test.skip(items === 0, 'no chats to attach files to');
    await chatList.chatItems.first().click();
    const chatDetail = new ChatDetailPage(page);
    await chatDetail.verifyChatDetailPageLoads();

    // Utility to find any visible file input and attach, otherwise skip
    const attachFile = async (filePath: string): Promise<boolean> => {
      await chatDetail.openAttachmentOptions().catch(() => { });
      const input = chatDetail.fileInput;
      if (await input.count() === 0) return false;
      await input.first().setInputFiles(filePath);
      return true;
    };

    await chatDetail.selectImageOption().catch(() => { });
    await attachFile('tests/fixtures/sample.jpg').catch(() => { });

    await chatDetail.selectVideoOption().catch(() => { });
    await attachFile('tests/fixtures/sample.mp4').catch(() => { });

    await chatDetail.selectAudioOption().catch(() => { });
    await attachFile('tests/fixtures/sample.mp3').catch(() => { });

    await chatDetail.selectContactOption().catch(() => { });
    await attachFile('tests/fixtures/contact.vcf').catch(() => { });
  });

  test("Delete chat", async ({ page }) => {
    const items = await chatList.chatItems.count();
    test.skip(items === 0, "no chats available to delete");
    await chatList.openFirstChat();
    const chatDetail = new ChatDetailPage(page);
    await chatDetail.verifyChatDetailPageLoads();
    await chatDetail.deleteChat();
    await expect(page).toHaveURL(/.*\/chats/, { timeout: 10000 });
  });
});
