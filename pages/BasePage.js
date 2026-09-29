export class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(url, options = {}) {
    let retries = 3;
    while (retries > 0) {
      try {
        await this.page.goto(url, { waitUntil: "domcontentloaded", ...options });
        return;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  async waitForURL(pattern, timeout = 10000) {
    const opts = typeof timeout === 'number' ? { timeout } : timeout;
    await this.page.waitForURL(pattern, opts);
  }

  async wait(ms) {
    await this.page.waitForTimeout(ms);
  }
}

