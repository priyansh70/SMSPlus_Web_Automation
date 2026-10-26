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

test.describe("Block Feature Suite", () => {
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

    test("TC1: Verify that user can not block new conversation without sent message", async ({ page }) => {
        // 1: Initiate New Conversation with a new contact
        const phoneNumber = generateUSNumber();
        await chatList.startNewConversationWith(phoneNumber);

        // 2: Verify 3 Dots Option not appear.
        const chatDetail = new ChatDetailPage(page);
        expect(await chatDetail.moreActionsButton).not.toBeVisible();
    })

    test("TC2: Verify that user can block the contact after sent message", async ({ page }) => {
        // 1: Initiate New Conversation with a new contact
        const phoneNumber = generateUSNumber();
        await chatList.startNewConversationWith(phoneNumber);

        // 2: Send a message to the contact
        const chatDetail = new ChatDetailPage(page);
        await chatDetail.sendMessage("Hello");

        // 3: Open More Actions Menu and Block the contact
        await chatDetail.blockChat();
        await chatList.verifyBlockedContact(phoneNumber);
    })

    test("TC3: Verify that user can unblock the contact after blocking them", async ({ page }) => {
        // 1: Initiate New Conversation with a new contact
        const phoneNumber = generateUSNumber();

        await chatList.startNewConversationWith(phoneNumber);

        // 2: Send a message to the contact
        const chatDetail = new ChatDetailPage(page);
        await chatDetail.sendMessage("Hello");

        // 3: Open More Actions Menu and Block the contact
        await chatDetail.blockChat();
        await chatList.verifyBlockedContact(phoneNumber);

        // 4: Unblock the contact
        await chatList.blockOrUnblockChatFromList(phoneNumber);
        await chatList.verifyUnlockedContact(phoneNumber);
    });

    test("TC4: Verify that user can not send message to blocked contact", async ({ page }) => {
        // 1: Initiate New Conversation with a new contact
        const phoneNumber = generateUSNumber();
        await chatList.startNewConversationWith(phoneNumber);

        // 2: Send a message to the contact
        const chatDetail = new ChatDetailPage(page);
        await chatDetail.sendMessage("Hello");

        // 3: Open More Actions Menu and Block the contact
        await chatDetail.blockChat();

        // 4: Verify that user can not send message to blocked contact
        await chatList.verifyBlockedContact(phoneNumber);
    });

    test("TC5: Verify user can block chat from chat list page", async ({ page }) => {
        // 1: Initiate New Conversation with a new contact
        const phoneNumber = generateUSNumber();
        await chatList.startNewConversationWith(phoneNumber);

        // 2: Send a message to the contact
        const chatDetail = new ChatDetailPage(page);
        await chatDetail.sendMessage("Hello");

        // 3: Now Select that chat from chat list page and block the contact
        await chatList.blockOrUnblockChatFromList(phoneNumber);
        await chatList.verifyBlockedContact(phoneNumber);
    })

    test("TC6: Verify user can Unblock chat from chat list page", async ({ page }) => {
        // 1: Initiate New Conversation with a new contact
        const phoneNumber = generateUSNumber();
        await chatList.startNewConversationWith(phoneNumber);

        // 2: Send a message to the contact
        const chatDetail = new ChatDetailPage(page);
        await chatDetail.sendMessage("Hello");

        // 3: Now Select that chat from chat list page and block the contact
        await chatList.blockOrUnblockChatFromList(phoneNumber);
        await chatList.verifyBlockedContact(phoneNumber);

        // 4: Now Select that chat from chat list page and unblock the contact
        await chatList.blockOrUnblockChatFromList(phoneNumber);
        await chatList.verifyUnlockedContact(phoneNumber);
    })

});
