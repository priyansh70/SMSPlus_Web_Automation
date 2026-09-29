import { BasePage } from "./BasePage.js";
import { expect } from "@playwright/test";

export class ChatDetailPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators
    this.chatTitle = page.locator("#chatSection h3").last();
    this.composer = page.locator(
      'form:has([data-placeholder="Type a message."])',
    );
    this.messageInput = this.composer.locator(
      '[data-placeholder="Type a message."][contenteditable="plaintext-only"]',
    );
    this.sendButton = this.composer.locator("button.submit-btn");
    this.attachButton = this.composer.locator("i.gallery-icon");
    this.scheduleButton = this.composer.locator(
      'i.schedule-composer-icon[title="Schedule message"]',
    );
    this.deleteDraftButton = this.composer.locator(
      'i.icon:has(svg path[d^="M7 6V6.75"])',
    );
    this.fileInput = page.locator('input[type="file"]');
    this.chatMessageList = page.getByRole("list");
    this.dateSeparator = page.locator("text=/Today|Yesterday|[0-9]{2}\/([0-9]{2})\/([0-9]{4})/i");
    this.searchChatIcon = page.locator(
      '#chatSection button:has(i.icon svg circle)',
    ).first();
    this.searchChatInput = page.getByPlaceholder(/search chat|search messages|search/i).first();
    this.noSearchResultsMessage = page.getByText(/no results found|no messages found|No conversations found/i).first();

    // Top-right chat actions
    // dropdown toggle that exposes Archive/Delete/Block
    this.moreActionsButton = page.locator("#chatSection button#dropdownBasic1");
    this.archiveOption = page.locator("#chatSection button.dropdown-item").filter({ hasText: /Archive/i });
    this.unarchiveOption = page.locator("#chatSection button.dropdown-item").filter({ hasText: /Unarchive/i });
    this.deleteOption = page.locator("#chatSection button.dropdown-item").filter({ hasText: /Delete/i });
    // this.blockOption = page.locator("#chatSection button.dropdown-item").filter({ hasText: /^\s*Block\s*$/i });
    this.blockOption = page.getByRole('button', { name: 'Block', exact: true });
    this.unblockOption = page.locator("#chatSection button.dropdown-item").filter({ hasText: /^\s*Unblock\s*$/i });
    this.confirmDialog = page.getByRole("dialog");
    this.messagePopup = page.locator(".message-popup:visible").last();
    this.forwardMessageOption = this.messagePopup.locator("li").filter({
      hasText: /^\s*Forward\s*$/i,
    });
    this.copyMessageOption = this.messagePopup.locator("li").filter({
      hasText: /^\s*Copy\s*$/i,
    });
    this.deleteMessageOption = this.messagePopup.locator("li").filter({
      hasText: /^\s*Delete\s*$/i,
    });

    // Bottom-left attachments and media controls
    this.videoOption = page.getByText(/Video/i).first();
    this.imageOption = page.getByText(/Image/i).first();
    this.audioOption = page.getByText(/Audio/i).first();
    this.contactOption = page.getByText(/Contact/i).first();
    this.cameraButton = page.getByRole("button", { name: /camera|photo|take picture/i }).first();
    this.microphoneButton = this.composer.locator(
      'i.icon:has(svg path[d^="M19 11V12"])',
    );
  }

  async verifyChatDetailPageLoads(expectedTitle) {
    await expect(this.chatTitle).toBeVisible();
    if (expectedTitle) {
      await expect(this.page.getByRole("heading", { name: new RegExp(expectedTitle, "i") }).first()).toBeVisible();
    }
    await expect(this.messageInput).toBeVisible();
    await expect(this.sendButton).toBeVisible();
  }

  async openMoreActionsMenu() {
    await this.wait(1000);
    await expect(this.moreActionsButton).toBeVisible();
    await this.moreActionsButton.waitFor({ state: "visible", timeout: 5000 });
    await this.moreActionsButton.click();
    await this.wait(1000);
  }

  async archiveChat() {
    await this.openMoreActionsMenu();
    await expect(this.archiveOption).toBeVisible();
    await this.archiveOption.click();
  }

  async unarchiveChat() {
    await this.openMoreActionsMenu();
    await expect(this.unarchiveOption).toBeVisible();
    await this.unarchiveOption.click();
  }

  async deleteChat() {
    await this.openMoreActionsMenu();
    await expect(this.deleteOption).toBeVisible();
    await this.deleteOption.click();
    const confirmDelete = this.confirmDialog.getByRole("button", { name: /^Delete$/i });
    if (await confirmDelete.isVisible().catch(() => false)) {
      await confirmDelete.click();
    }
  }

  async blockChat() {
    await this.openMoreActionsMenu();
    await this.blockOption.waitFor({ state: "visible", timeout: 5000 });
    await this.blockOption.click();
    await this.confirmAction("Block");
    await this.wait(1000);
  }

  async unblockChat() {
    await this.openMoreActionsMenu();
    await expect(this.unblockOption).toBeVisible();
    await this.unblockOption.click();
    await this.confirmAction("Unblock");
  }

  async confirmAction(action) {
    const confirmButton = this.confirmDialog.getByRole("button", {
      name: new RegExp(`^${action}$`, "i"),
    });
    if (await confirmButton.count()) {
      await expect(confirmButton).toBeVisible({ timeout: 5000 });
      await confirmButton.click();
    }
  }

  getMessageContainer(text) {
    const escapedText = text.toString().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.page
      .locator("#chatSection .messages")
      .filter({ hasText: new RegExp(`^\\s*${escapedText}\\s*$`) })
      .last()
      .locator("xpath=ancestor::div[contains(@class, 'message-bubble-shell')][1]");
  }

  async openMessageActions(text) {
    const message = this.getMessageContainer(text);
    await expect(message).toBeVisible({ timeout: 5000 });
    await message.hover();
    const actionsButton = message.getByRole("button", { name: "Message options" });
    await expect(actionsButton).toBeVisible({ timeout: 5000 });
    await actionsButton.click();
  }

  async copyMessage(text) {
    await this.openMessageActions(text);
    await expect(this.copyMessageOption).toBeVisible({ timeout: 5000 });
    await this.copyMessageOption.click();
  }

  async deleteMessage(text) {
    await this.openMessageActions(text);
    await expect(this.deleteMessageOption).toBeVisible({ timeout: 5000 });
    this.page.once("dialog", (dialog) => dialog.accept());
    await this.deleteMessageOption.click();
    await this.confirmAction("Delete");
  }

  async openAttachmentOptions() {
    await expect(this.attachButton).toBeVisible();
    await this.attachButton.click();
  }

  async selectVideoOption() {
    await this.openAttachmentOptions();
    await expect(this.videoOption).toBeVisible({ timeout: 5000 });
    await this.videoOption.click();
  }

  async selectImageOption() {
    await this.openAttachmentOptions();
    await expect(this.imageOption).toBeVisible({ timeout: 5000 });
    await this.imageOption.click();
  }

  async selectAudioOption() {
    await this.openAttachmentOptions();
    await expect(this.audioOption).toBeVisible({ timeout: 5000 });
    await this.audioOption.click();
  }

  async selectContactOption() {
    await this.openAttachmentOptions();
    await expect(this.contactOption).toBeVisible({ timeout: 5000 });
    await this.contactOption.click();
  }

  async verifyAttachmentControlsVisible() {
    await expect(this.attachButton).toBeVisible();
    await expect(this.cameraButton).toBeVisible();
    await expect(this.microphoneButton).toBeVisible();
  }

  async sendMessage(message) {
    await expect(this.messageInput).toBeVisible();
    // If the message input is a contenteditable div, type into it; otherwise use fill()
    const handle = await this.messageInput.elementHandle().catch(()=>null);
    if (handle) {
      const isContentEditable = await handle.evaluate(el => el.getAttribute('contenteditable') !== null || el.isContentEditable).catch(()=>false);
      if (isContentEditable) {
        await this.messageInput.click();
        await this.page.keyboard.type(message);
      } else {
        await this.messageInput.fill(message).catch(()=>{});
      }
    } else {
      await this.messageInput.fill(message).catch(()=>{});
    }
    await expect(this.sendButton).toBeEnabled();
    await this.sendButton.click();
    await this.verifyMessageVisible(message);
    await this.wait(1000);
  }

  getMessageByText(text) {
    return this.page.locator("#chatSection").getByText(new RegExp(text, "i")).first();
  }

  async verifyMessageVisible(text) {
    const message = this.getMessageByText(text);
    await expect(message).toBeVisible({ timeout: 5000 });
  }

  async verifyReceivedMessageVisible(text) {
    await this.verifyMessageVisible(text);
  }
}
