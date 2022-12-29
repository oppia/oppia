const puppeteer = require('puppeteer');
const testConstants = require('./testConstants.js');

module.exports = class puppeteerUtilities {
  page;
  browserObject;
  isCookieAccepted = false;

  /**
   * This is a function that opens a new browser instance for the user.
   * @returns {Promise<puppeteer.Page>} - Returns a promise that resolves to a Page object controlled by Puppeteer.
   */
  async openBrowser(){
   /* currently, headless is set to false and the page viewport
       is maximized so that it would be easy for the developers
       to debug easily while testing.
       We can remove these settings before merging as we have
       to run the tests in headless mode. */
    await puppeteer
      .launch({
        headless: false,
        args: ['--start-fullscreen', '--use-fake-ui-for-media-stream']
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

  /**
   * This function signs in the user with the given email to the Oppia website.
   * @param {string} email - The email of the user.
   */
  async signInWithEmail(email) {
    await this.goto(testConstants.URLs.home);
    if (!this.isCookieAccepted) {
      await this.clickOn('button', 'OK');
      this.isCookieAccepted = true;
    }
    await this.clickOn('span', 'Sign in');
    await this.type(testConstants.SignInDetails.inputField, email);
    await this.clickOn('span', 'Sign In');
    await (this.page).waitForNavigation({waitUntil: 'networkidle0'});
  }

  /**
   * This function signs up a new user with the given username and email.
   * @param {string} userName - The username of the user.
   * @param {string} signInEmail - The email of the user.
   */
  async signUpNewUserWithUserNameAndEmail(userName, signInEmail) {
    await this.signInWithEmail(signInEmail);
    await this.type('input.e2e-test-username-input', userName);
    await this.clickOn('input', 'e2e-test-agree-to-terms-checkbox');
    await this.page.waitForSelector('button.e2e-test-register-user:not([disabled])');
    await this.clickOn('button', 'Submit and start contributing');
    await (this.page).waitForNavigation({waitUntil: 'networkidle0'});
  }

  /**
   * This function waits for a component using its CSS selector to load.
   * @param {string} selector - The CSS selector of the component.
   */
  async waitForPageToLoad(selector) {
    await (this.page).waitForSelector(selector);
  }

  /**
   * This function reloads the current page.
   */
  async reloadPage() {
    await (this.page).reload({ waitUntil: ['networkidle0', 'domcontentloaded'] });
  }
  
  /**
   * This function clicks on any element using its CSS selector or the text written on that element.
   * @param {string} tag - The HTML tag of the element.
   * @param {string} selector - The CSS selector or the text written on the element.
   */
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

  /**
   * This function types the given text in the input field using its CSS selector.
   * @param {string} selector - The CSS selector of the input field.
   * @param {string} text - The text to be typed in the input field.
   */
  async type(selector, text) {
    await (this.page).waitForSelector(selector);
    await (this.page).type(selector, text);
  }

  /**
   * This function navigates to the given URL.
   * @param {string} url - The URL to which the page has to be navigated.
   */
  async goto(url) {
    await (this.page).goto(url, {waitUntil: 'networkidle0'});
  }

  /**
   * This function uploads a file using the given file path.
   * @param {string} filePath - The path of the file to be uploaded.
   */
  async uploadFile(filePath) {
    const inputUploadHandle = await (this.page).$('input[type=file]');
    let fileToUpload = filePath;
    inputUploadHandle.uploadFile(fileToUpload);
  }

  /**
   * This function logs out the current user.
   */
  async logout() {
    await this.goto(testConstants.URLs.logout);
    await this.waitForPageToLoad(testConstants.Dashboard.MainDashboard);
  }

  /**
   * This function closes the current Puppeteer browser instance.
   */
  async closeBrowser() {
    await this.browserObject.close();
  }
};
