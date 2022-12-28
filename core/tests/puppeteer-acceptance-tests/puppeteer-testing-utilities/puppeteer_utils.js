const puppeteer = require("puppeteer");
const testConstants = require("./testConstants.js");

module.exports = class puppeteerUtilities {
  page;
  browserObject;
  isCookieAccepted = false;

  async openBrowser(){
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
        this.browserObject = browser;
        this.page = await browser.newPage();
        await (this.page).setViewport({ width: 0, height: 0 });
        await this.page.on('dialog', async dialog => {  // accepting the alerts that appear in between the tests
          await dialog.accept();
        });
      });

    return this.page;
  }

  async signInWithEmail(email) {
    await this.goto(testConstants.URLs.home);
    if (!this.isCookieAccepted) {
      await this.clickOn("button", "OK");
      this.isCookieAccepted = true;
    }
    await this.clickOn("span", "Sign in");
    await this.type(testConstants.SignInDetails.inputField, email);
    await this.clickOn("span", "Sign In");
    await (this.page).waitForNavigation({waitUntil: 'networkidle0'});
  }

  async signUpNewUserWithUserNameAndEmail(userName, signInEmail) {
    await this.signInWithEmail(signInEmail);
    await this.type('input.e2e-test-username-input', userName);
    await this.clickOn("input", "e2e-test-agree-to-terms-checkbox");
    await this.page.waitForSelector('button.e2e-test-register-user:not([disabled])');
    await this.clickOn("button", "Submit and start contributing");
    await (this.page).waitForNavigation({waitUntil: 'networkidle0'});
  }

  async waitForPageToLoad(selector) {
    await (this.page).waitForSelector(selector);
  }

  async reloadPage() {
    await (this.page).reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
  }
  
  async clickOn(tag, selector) {
    try {
      await (this.page).waitForXPath('//' + tag);
      const [button] = await (this.page).$x('//' + tag + '[contains(text(), "' + selector + '")]');
      await button.click();
    } catch {
      await (this.page).waitForSelector(tag + '.' + selector);
      await (this.page).click(tag + '.' + selector);
    }
  }

  async type(selector, text) {
    await (this.page).waitForSelector(selector);
    await (this.page).type(selector, text);
  }

  async goto(url) {
    await (this.page).goto(url, {waitUntil: "networkidle0"});
  }

  async uploadFile(filePath) {
    const inputUploadHandle = await (this.page).$('input[type=file]');
    let fileToUpload = filePath;
    inputUploadHandle.uploadFile(fileToUpload);
  }

  async logout() {
    await this.goto(testConstants.URLs.logout);
    await this.waitForPageToLoad(testConstants.Dashboard.MainDashboard);
  }

  async closeBrowser() {
    await this.browserObject.close();
  }
};
