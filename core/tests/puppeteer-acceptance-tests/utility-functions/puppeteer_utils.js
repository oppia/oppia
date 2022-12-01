const puppeteer = require("puppeteer");
const testConstants = require("./testConstants.js");
module.exports = class browser {
  page;
  browser;

  async initialize(){
    /* currently, headless is set to false and the page viewport
       is maximized so that it would be easy for the developers
       to debug easily while testing.
       We can remove these settings before merging as we have
       to run the tests in headless mode. */
    await puppeteer
      .launch({
        headless: false,
        args: ["--start-fullscreen", "--use-fake-ui-for-media-stream"]
      })
      .then(async (browser) => {
        this.browser = await browser;
        this.page = await browser.newPage();
        await (this.page).setViewport({ width: 0, height: 0 });
      });

      return this.page;
  }

  async signInWithEmail(email) {
    await this.goto(testConstants.URLs.home);
    await this.clickOn("button", "OK");
    await this.clickOn("span", "Sign in");
    await this.type(testConstants.SignInDetails.inputField, email);
    await this.clickOn("span", "Sign In");
  }
  
  async clickOn(tag, selector, time = 0) {
    try {
      await (this.page).waitForXPath('//' + tag);
      await (this.page).waitForTimeout(time);
      const [button] = await (this.page).$x('//' + tag + '[contains(text(), "' + selector + '")]');
      await button.click();
    } catch {
      await (this.page).waitForSelector(tag + '.' + selector);
      await (this.page).waitForTimeout(time);
      await (this.page).click(tag + '.' + selector);
    }
  }

  async type(selector, text) {
    await (this.page).waitForSelector(selector);
    await (this.page).type(selector, text);
  }

  async goto(url, selector = null) {
    if (selector !== null) {
      await (this.page).waitForSelector(selector);
    }
    await (this.page).goto(url, {waitUntil: "networkidle0"});
  }

  async uploadFile(filePath) {
    const inputUploadHandle = await (this.page).$('input[type=file]');
    let fileToUpload = filePath;
    inputUploadHandle.uploadFile(fileToUpload);
  }

  async closeBrowser() {
    await this.browser.close();
  }
};
