import { title } from "process";
import { BasePage } from "./BasePage.js";

const BUSINESS_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export class AutoReplyPage extends BasePage {
  constructor(page) {
    super(page);

    this.pageHeading = page.getByRole("heading", { name: "Auto Reply", exact: true });
    this.pageDescription = page.getByText(
      "Automatically send replies to incoming messages based on your rules.",
      { exact: true },
    );
    this.backLink = page.getByRole("link", { name: "Back", exact: true });

    this.businessHoursSection = page.locator("div.col-12.col-md-12.col-lg-12").filter({ has: page.getByRole("heading", { name: "Business Hours", exact: true }) });
    this.timeZoneSelect = page.locator("div.col-12.col-md-12.col-lg-12").filter({ has: page.getByRole("heading", { name: "Time Zone", exact: true }) }).locator("select.ar-select");
    this.dayToggles = {};
    for (const day of BUSINESS_DAYS) {
      this.dayToggles[day] = page.locator(`#bh-${day}`);
    }
    this.dayClosedLabels = {};
    for (const day of ["Sun", "Sat"]) {
      this.dayClosedLabels[day] = this.businessHoursSection.locator(`#bh-${day}`).locator("..").locator(".ar-closed");
    }
    this.businessHoursSaveButton = page.getByRole("button", { name: "Save", exact: true });
    this.overlapErrorMessage = page.getByText(
      "Time ranges cannot overlap.",
      { exact: true }
    );

    this.messagesSection = page
      .locator(".ar-card")
      .filter({ has: page.getByRole("heading", { name: "Auto Reply Messages", exact: true }) });
    this.addMessageButton = this.messagesSection.getByRole("button", {
      name: "Add Message",
      exact: true,
    });
    this.messageRows = this.messagesSection.locator(".ar-row");

    this.messageModal = page.locator("app-auto-reply-edit");
    this.messageModalHeading = this.messageModal.getByRole("heading", {
      name: /^(Add|Edit) Auto Reply Message$/,
    });
    this.messageStatusToggle = this.messageModal.locator("#ar-active");
    this.messageNameInput = this.messageModal.getByLabel("Name*", { exact: true });
    this.messageTextArea = this.messageModal.getByLabel("Message*", { exact: true });
    this.perMessageRadio = this.messageModal.getByRole("radio", {
      name: "Per Message",
      exact: true,
    });
    this.perContactRadio = this.messageModal.getByRole("radio", {
      name: "Per Contact",
      exact: true,
    });
    this.messageModalSaveButton = this.messageModal.getByRole("button", {
      name: "Save",
      exact: true,
    });
    this.messageModalCancelButton = this.messageModal.getByRole("button", {
      name: "Cancel",
      exact: true,
    });
  }

  getBusinessDayToggle(day) {
    this.validateBusinessDay(day);
    return this.dayToggles[day];
  }

  getBusinessDayRow(day) {
    this.validateBusinessDay(day);
    return this.businessHoursSection
      .locator("div.d-flex.align-items-start.gap-5")
      .filter({ has: this.getBusinessDayToggle(day) });
  }

  getBusinessDayTimeSelects(day) {
    return this.getBusinessDayRow(day).locator("select.ar-time");
  }

  getAddTimeRangeButton(day) {
    return this.getBusinessDayRow(day).getByRole("button", { name: "+", exact: true });
  }

  getRemoveTimeRangeButtons(day) {
    return this.getBusinessDayRow(day).getByRole("button", {
      title: "Remove range",
      exact: true,
    });
  }

  isBusinessDayClosed(day) {
    if (!["Sun", "Sat"].includes(day)) {
      return false;
    }
    return this.dayClosedLabels[day];
  }

  getMessageRow(name) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nameLabel = this.page
      .locator(".ar-row-name")
      .filter({ hasText: new RegExp(`^${escapedName}$`) });
    return this.messageRows.filter({ has: nameLabel });
  }

  getMessageToggle(name) {
    return this.getMessageRow(name).getByRole("switch");
  }

  getMessageEditButton(name) {
    return this.getMessageRow(name).getByRole("button", { name: "Edit", exact: true });
  }

  getMessageDeleteButton(name) {
    return this.getMessageRow(name).getByRole("button", { name: "Delete", exact: true });
  }

  async isBusinessDayEnabled(day) {
    return this.getBusinessDayToggle(day).isChecked();
  }

  async setBusinessDayEnabled(day, enabled) {
    const toggle = this.getBusinessDayToggle(day);
    if (enabled && !(await toggle.isChecked())) {
      await toggle.check();
    } else if (!enabled && (await toggle.isChecked())) {
      await toggle.uncheck();
    }
  }

  async selectBusinessHours(day, rangeIndex, startTime, endTime) {
    const timeSelects = this.getBusinessDayTimeSelects(day);
    const startSelect = timeSelects.nth(rangeIndex * 2);
    const endSelect = timeSelects.nth(rangeIndex * 2 + 1);

    await endSelect.selectOption({ label: endTime });
    await startSelect.selectOption({ label: startTime });
  }

  async addBusinessHoursRange(day) {
    await this.getAddTimeRangeButton(day).click();
  }

  async removeBusinessHoursRange(day, rangeIndex) {
    await this.getRemoveTimeRangeButtons(day).nth(rangeIndex).click();
  }

  async cleanUpBusinessHours(day) {
    const timeSelects = this.getBusinessDayTimeSelects(day);
    await timeSelects.first().waitFor({ state: "visible" });

    const existingCount = await timeSelects.count();
    
    if (existingCount % 2 !== 0) {
      throw new Error(`Unexpected number of business hour time selects for ${day}: ${existingCount}`);
    }

    for (let rangeIndex = existingCount / 2 - 1; rangeIndex >= 1; rangeIndex--) {
      const lastSelect = timeSelects.nth((rangeIndex + 1) * 2 - 1);
      await this.removeBusinessHoursRange(day, rangeIndex);
      await lastSelect.waitFor({ state: "detached" });
    }
  }

  async saveBusinessHours() {
    await this.businessHoursSaveButton.click();
    await this.page.waitForTimeout(1000);
  }

  async selectTimeZone(valueOrLabel) {
    await this.timeZoneSelect.selectOption(valueOrLabel);
  }

  async addAutoReplyMessage() {
    await this.addMessageButton.click();
  }

  async openCreateAutoReplyModal() {
    await this.addAutoReplyMessage();
    await this.messageModalHeading.waitFor({ state: "visible" });
  }

  async openEditAutoReplyModal(name) {
    await this.editMessage(name);
    await this.messageModalHeading.waitFor({ state: "visible" });
  }

  async fillAutoReplyName(name) {
    await this.messageNameInput.fill(name);
  }

  async fillAutoReplyMessage(message) {
    await this.messageTextArea.fill(message);
  }

  async setMessageActive(enabled) {
    const isChecked = await this.messageStatusToggle.isChecked();
    if (enabled && !isChecked) {
      await this.messageStatusToggle.check();
    } else if (!enabled && isChecked) {
      await this.messageModalSaveButton.uncheck();
    }
  }

  async selectReplyFrequency(frequency) {
    const frequencyRadio = frequency === "Per Message" ? this.perMessageRadio : this.perContactRadio;
    await frequencyRadio.check();
  }

  getReplyFrequencyRadio(frequency) {
    return frequency === "Per Message" ? this.perMessageRadio : this.perContactRadio;
  }

  getMessageOptionRadio(option) {
    return this.messageModal.getByRole("radio", { name: option, exact: true });
  }

  async selectMessageOption(option) {
    await this.getMessageOptionRadio(option).check();
  }

  async saveAutoReplyMessage() {
    await this.messageModalSaveButton.click();
  }

  async cancelAutoReplyMessage() {
    await this.messageModalCancelButton.click();
  }

  async isMessageEnabled(name) {
    return this.getMessageToggle(name).isChecked();
  }

  async setMessageEnabled(name, enabled) {
    const toggle = this.getMessageToggle(name);
    if (enabled && !(await toggle.isChecked())) {
      await toggle.check();
    } else if (!enabled && (await toggle.isChecked())) {
      await toggle.uncheck();
    }
  }

  async openMessage(name) {
    await this.getMessageRow(name).getByRole("button", { name: new RegExp(name) }).click();
  }

  async editMessage(name) {
    await this.getMessageEditButton(name).click();
  }

  async deleteMessage(name) {
    await this.getMessageDeleteButton(name).click();

    const confirmDeleteButton = this.page.getByRole("button", {
      name: "Delete",
      exact: true,
    });

    await confirmDeleteButton.waitFor({ state: "visible" });
    await confirmDeleteButton.click();
  }

  validateBusinessDay(day) {
    if (!BUSINESS_DAYS.includes(day)) {
      throw new Error(`Unsupported business day: ${day}`);
    }
  }
}