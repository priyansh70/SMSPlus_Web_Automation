import { test as base, expect, type Page } from "@playwright/test";
import { displayTestBanner, generateUSNumber } from "../helpers/utils.js";
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

test.describe("Archive Feature Suite", () => {
    test.describe.configure({ mode: "serial" });
    let chatList: ChatListPage;

    test.beforeEach(async ({ page }, testInfo) => {
        const chatsUrl = new URL("/chats", page.url()).toString();
        await page.goto(chatsUrl, { waitUntil: "domcontentloaded" });
        chatList = new ChatListPage(page);
        await chatList.verifyChatListPageLoads();

        // Navigate or wait for a page, then inject a visible banner
        await displayTestBanner(testInfo, page);

        await page.waitForTimeout(1000);
    });

    test("TC1: Verify that user can not archive new conversation without sent message", async ({ page }) => {
        // 1: Initiate New Conversation with a new contact
        const phoneNumber = generateUSNumber();
        await chatList.startNewConversationWith(phoneNumber);

        // 2: Verify that user can not archive the conversation without sending a message   
        const chatDetail = new ChatDetailPage(page);
        expect(await chatDetail.moreActionsButton).not.toBeVisible();
    })

    test("TC2: Verify that user can archive and unarchive the conversation after sending a message", async ({ page }) => {
        // 1: Initiate New Conversation with a new contact
        const phoneNumber = generateUSNumber();
        await chatList.startNewConversationWith(phoneNumber);

        // 2: Send a message to the contact
        const chatDetail = new ChatDetailPage(page);
        await chatDetail.sendMessage("Hello");

        // 3: Open More Actions Menu and Archive the conversation
        await chatDetail.archiveChat();
        await chatList.verifyArchivedConversation(phoneNumber);

        // 4: Open the archived conversation and unarchive it
        await chatDetail.unarchiveChat();
        await chatList.verifyChatListPageLoads();
        await expect(chatList.getChatItemByText(phoneNumber)).toBeVisible({ timeout: 5000 });
    });

    test.only("TC3: Verify user can archive and unarchive a conversation with chat list", async ({ page }) => {
        // 1: Initiate New Conversation with a new contact
        const phoneNumber = generateUSNumber();
        await chatList.startNewConversationWith(phoneNumber);

        // 2: Send a message to the contact
        const chatDetail = new ChatDetailPage(page);
        await chatDetail.sendMessage("Hello");

        // 3: Open More Actions Menu and Archive the conversation
        await chatList.archiveOrUnarchiveChatFromList(phoneNumber);
        await chatList.verifyArchivedConversation(phoneNumber);

        // 4: Unarchive the conversation from the chat list
        await chatList.archiveOrUnarchiveChatFromList(phoneNumber);
        await expect(chatList.getChatRowByText(phoneNumber)).toBeVisible({ timeout: 15000 });
    });

    test("TC4: Verify that archive chat becomes unarchived when user sends a new message to the archived chat", async ({ page }) => {
        // 1: Initiate New Conversation with a new contact
        const phoneNumber = generateUSNumber();
        await chatList.startNewConversationWith(phoneNumber);

        // 2: Send a message to the contact
        const chatDetail = new ChatDetailPage(page);
        await chatDetail.sendMessage("Hello");

        // 3: Open More Actions Menu and Archive the conversation   
        await chatDetail.archiveChat();
        await chatList.verifyArchivedConversation(phoneNumber);

        // 4: send a new message
        await chatDetail.sendMessage("New Message");
        await chatList.verifyChatListPageLoads();
        await expect(chatList.getChatItemByText(phoneNumber)).toBeVisible({ timeout: 5000 });
    })

});
