import { BasePage } from "./BasePage.js";
import { expect } from "@playwright/test";

export class ChatListPage extends BasePage {
  constructor(page) {
    super(page);

    // Header & Navigation Locators
    this.pageHeading = page.getByRole("heading", { name: /Messages/i }).first();
    this.searchTrigger = page.locator("#sidebar i.icon.search").first();
    this.searchInput = page.locator('input[placeholder*="Search Contact" i], input[type="search"]');
    this.closeSearchInput = page.locator('div.border-bottom.bg-gray > div > i').last()
    this.archiveSection = page.getByRole("heading", { name: "Archived", exact: true });
    this.isViewingArchivedChats = false;

    // Settings Dropdown Main Toggle
    this.settingsButton = page.locator("#dropdownBasic1").first();

    // Settings Menu Options (Inside #dropdownBasic1)
    this.myAccountOption = page.locator("#dropdownSettings");
    this.profileOption = page.locator('button[routerlink="/settings/profile"]');
    this.manageCardOption = page.locator('button[routerlink="/settings/manage-card"]');
    this.managePlanOption = page.locator('button[routerlink="/settings/plans-and-subscription"]');
    this.termsAndConditionOption = page.getByText("Terms & Condition").first();
    this.privacyPolicyOption = page.getByText("Privacy & Policy").first();
    this.logoutOption = page.getByText("Logout").first();
    this.autoReplyOption = page.getByRole("button", { name: "Auto Reply", exact: true });

    // New Chat Toggle & Action Locators
    this.newChatButton = page.locator(
      'button.dropdown-toggle:has(svg path[d^="M12 8V16"])',
    );
    this.startNewConversationOption = page.getByRole("button", {
      name: "Start new conversation",
      exact: true,
    });
    this.startGroupChatOption = page.getByText("Start group chat");

    // Chat List & Conversation Locators
    this.chatItems = page.locator(
      ".list-group-flush > .cursor-pointer, .cursor-pointer:has(h4)",
    );
    this.blockedContactMessage = page.getByText("You have blocked this user.", { exact: true });
    this.selectionActions = page.locator("i.icon.setting:visible");
    this.blockConfirmationButton = page.getByRole("button", { name: "Block", exact: true });
    this.unblockConfirmationButton = page.getByRole("button", { name: "Unblock", exact: true });
    this.cancelConfirmationButton = page.getByRole("button", { name: "Cancel", exact: true });
    this.archivedHeading = page.getByRole("heading", { name: "Archived" });
    this.emptyStateText = page.getByText(/No chats|Start a conversation/i);
    this.newChatInput = page.locator(
      'input[type="text"][placeholder="Enter Number"][aria-label="Search messages"]',
    );
    this.startButton = page.getByRole("button", { name: "Start", exact: true });
  }


  getChatItemByText(text) {
    const value = text.toString();
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const last4 = value.slice(-4).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`${escapedValue}|\\+1\\s*${escapedValue}|${last4}`, "i");
    const chatRow = this.chatItems.filter({ hasText: pattern });
    const headingContainer = this.page
      .getByRole("heading")
      .filter({ hasText: pattern })
      .locator("xpath=..");
    return chatRow.or(headingContainer).first();
  }

  getChatRowByText(text) {
    const value = text.toString();
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const last4 = value.slice(-4).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`${escapedValue}|\\+1\\s*${escapedValue}|${last4}`, "i");
    return this.chatItems.filter({ hasText: pattern }).first();
  }

  async verifyChatListPageLoads() {
    await expect(this.pageHeading).toBeVisible();
    // try {
    //   await expect(this.chatItems.first()).toBeVisible({ timeout: 10000 });
    // } catch {
    //   await expect(this.emptyStateText.first()).toBeVisible({ timeout: 5000 });
    // }
  }

  /**
   * Opens the main Settings menu
   */
  async openSettingsMenu() {
    await expect(this.settingsButton).toBeVisible();
    await this.settingsButton.click();
  }

  async openAutoReplyPage() {
    await this.openMyAccountSubmenu();
    await expect(this.autoReplyOption).toBeVisible();
    await this.autoReplyOption.click();
    await this.waitForURL(/\/settings\/auto-reply\/?$/);
  }

  /**
   * Opens the My Account submenu
   */
  async openMyAccountSubmenu() {
    await this.openSettingsMenu();
    await expect(this.myAccountOption).toBeVisible();
    await this.myAccountOption.click();
  }

  /**
   * Searches for a chat by phone number or name
   */
  async searchChat(text) {
    if (await this.searchTrigger.count()) {
      await this.searchTrigger.click().catch(() => { });
    }
    const input = this.searchInput;
    await expect(input).toBeVisible();
    // await expect(input).toBeEnabled();
    await input.fill("");
    await expect(input).toHaveValue("");
    await input.type(text, { delay: 100 });
    await this.page.keyboard.press("Enter");
    await this.wait(2000);
  }

  async openChatByText(text) {
    const chatItem = this.getChatItemByText(text);
    await expect(chatItem).toBeVisible({ timeout: 5000 });
    await chatItem.click();
  }

  async openChatByNumber(number) {
    await this.openChatByText(number);
  }

  // async holdSearchResult(text, duration = 5000) {
  //   await this.searchChat(text);
  //   const chatItem = this.getChatItemByText(text);
  //   await expect(chatItem).toBeVisible({ timeout: 15000 });
  //   await chatItem.click({ delay: duration });

  //   if (!(await this.selectionActionsVisible())) {
  //     const refreshedChatItem = this.getChatItemByText(text);
  //     await refreshedChatItem.dispatchEvent("pointerdown", {
  //       button: 0,
  //       buttons: 1,
  //       pointerType: "mouse",
  //       isPrimary: true,
  //     });
  //     await this.wait(duration);
  //     await refreshedChatItem.dispatchEvent("pointerup", {
  //       button: 0,
  //       buttons: 0,
  //       pointerType: "mouse",
  //       isPrimary: true,
  //     });
  //   }

  //   await this.verifySelectionActionsVisible();
  // }

  async holdSearchResult(text, duration = 5000) {
    await this.searchChat(text);
    await this.holdChatRow(this.getChatRowByText(text), text, duration);
  }

  async holdChatRow(chatItem, text, duration = 5000) {
    await expect(chatItem).toBeVisible({ timeout: 15000 });
    await chatItem.scrollIntoViewIfNeeded();
    const box = await chatItem.boundingBox();
    if (!box) throw new Error(`Could not get bounding box for chat item: "${text}"`);

    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.waitForTimeout(duration);
    await this.page.mouse.move(x, y + box.height + 20, { steps: 5 });
    await this.page.mouse.up();
    await this.verifySelectionActionsVisible();
  }

  async verifyBlockOrUnblockOptionVisible() {
    await expect(this.selectionActions.nth(2)).toBeVisible({ timeout: 5000 });
  }

  async verifySelectionActionsVisible() {
    await expect
      .poll(() => this.selectionActions.count(), { timeout: 5000 })
      .toBeGreaterThanOrEqual(4);
  }

  async selectionActionsVisible() {
    return (await this.selectionActions.count()) >= 4;
  }

  async blockOrUnblockChatFromList(phoneNumber) {
    await this.holdSearchResult(phoneNumber);
    await this.selectionActions.nth(2).click();
    const confirmationButton = this.page.getByRole("button", { name: /^(Block|Unblock)$/ });
    await expect(confirmationButton).toBeVisible({ timeout: 5000 });
    if (await this.blockConfirmationButton.isVisible()) {
      await this.blockConfirmationButton.click();
    } else {
      await this.unblockConfirmationButton.click();
    }
    await this.wait(1000);
  }

  async archiveOrUnarchiveChatFromList(phoneNumber) {
    const archivedChat = this.getChatRowByText(phoneNumber);

    if (this.isViewingArchivedChats) {
      if (await this.searchInput.isVisible()) {
        await this.searchInput.fill("");
        await this.page.keyboard.press("Enter");
      }
      await this.holdChatRow(archivedChat, phoneNumber);
    } else {
      await this.holdSearchResult(phoneNumber);
    }

    await this.selectionActions.nth(1).click();

    if (this.isViewingArchivedChats) {
      await expect(this.getChatRowByText(phoneNumber)).toBeVisible({ timeout: 15000 });
      this.isViewingArchivedChats = false;
    }
  }

  async openFirstChat() {
    await expect(this.chatItems.first()).toBeVisible({ timeout: 5000 });
    await this.chatItems.first().click();
  }

  async openArchivedChats() {
    await expect(this.archivedHeading).toBeVisible({ timeout: 5000 });
    await this.archivedHeading.click();
    await expect(this.chatItems.first()).toBeVisible({ timeout: 5000 });
  }

  async verifyArchivedConversation(text) {
    await expect(this.archiveSection).toBeVisible({ timeout: 15000 });
    await this.archiveSection.click();
    await expect(this.getChatRowByText(text)).toBeVisible({ timeout: 15000 });
    this.isViewingArchivedChats = true;
  }

  async openFirstArchivedChat() {
    await this.openArchivedChats();
    await this.chatItems.first().click();
  }

  async verifyChatItemVisible(text) {
    await expect(this.getChatItemByText(text)).toBeVisible();
  }

  async verifyBlockedContact(phoneNumber) {
    await this.searchChat(phoneNumber);
    const blockedChat = this.getChatItemByText(phoneNumber);
    await expect(blockedChat).toBeVisible({ timeout: 10000 });
    await expect(blockedChat).toContainText("You have blocked this user.");
  }

  async verifyUnlockedContact(phoneNumber) {
    await this.searchChat(phoneNumber);
    const blockedChat = this.getChatItemByText(phoneNumber);
    await expect(blockedChat).toBeVisible({ timeout: 10000 });
    await expect(blockedChat).not.toContainText("You have blocked this user.");
  }

  async startNewChat() {
    await expect(this.newChatButton).toBeVisible({ timeout: 10000 });
    await this.newChatButton.click();
    await expect(this.startNewConversationOption).toBeVisible({ timeout: 5000 });
    await this.startNewConversationOption.click();
  }

  async initiateConversationWith(phoneNumber) {
    // Fill Phone Number 
    await expect(this.newChatInput).toBeVisible({ timeout: 5000 });
    await this.newChatInput.fill(phoneNumber);

    // Click on Start Button 
    await expect(this.startButton).toBeVisible({ timeout: 5000 });
    await this.startButton.click();
  }

  async startNewConversationWith(phoneNumber) {
    await this.startNewChat();
    await this.initiateConversationWith(phoneNumber);
  }
}
