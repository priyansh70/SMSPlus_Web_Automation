import { expect } from "@playwright/test";
import { BasePage } from "./BasePage.js";

export class ArchivePage extends BasePage {
	constructor(page) {
		super(page);

		// The archive view is the left sidebar shown in the archive screenshot.
		this.archiveSection = page.locator("#sidebar");
		this.archivedHeading = this.archiveSection.getByRole("heading", { name: "Archived" });
		this.searchButton = this.archiveSection.locator("i.search").first();
		this.chatItems = this.archiveSection.locator(".list-group-flush > .cursor-pointer");
	}

	getChatItemByText(text) {
		const value = text.toString();
		const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const last4 = value.slice(-4).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const pattern = new RegExp(`${escapedValue}|\\+1\\s*${escapedValue}|${last4}`, "i");
		return this.chatItems.filter({ hasText: pattern }).first();
	}

	async verifyArchiveSectionVisible() {
		await expect(this.archiveSection).toBeVisible();
		await expect(this.archivedHeading).toBeVisible();
	}

	async openChatByText(text) {
		const chatItem = this.getChatItemByText(text);
		await expect(chatItem).toBeVisible({ timeout: 5000 });
		await chatItem.click();
	}

	async openFirstChat() {
		await expect(this.chatItems.first()).toBeVisible({ timeout: 5000 });
		await this.chatItems.first().click();
	}
}
