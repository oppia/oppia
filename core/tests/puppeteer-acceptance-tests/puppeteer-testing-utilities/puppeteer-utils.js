// Copyright 2023 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utility File for the Acceptance Tests.
 */

const puppeteer = require('puppeteer');
const testConstants = require('./test-constants.js');

const LABEL_FOR_SUBMIT_BUTTON = 'Submit and start contributing';
/** We accept the empty message because this is what is sent on
 * 'beforeunload' due to an issue with Chromium (see
 * https://github.com/puppeteer/puppeteer/issues/3725). */
const acceptedBrowserAlerts = [
  '',
  'Changes that you made may not be saved.',
  'This action is irreversible. Are you sure?'
];

module.exports = class baseUser {
  constructor() {
    this.page;
    this.browserObject;
    this.userHasAcceptedCookies = false;
  }

  /**
   * This is a function that opens a new browser instance for the user.
   * @returns {Promise<puppeteer.Page>} - Returns a promise that resolves
   * to a Page object controlled by Puppeteer.
   */
  async openBrowser() {
    await puppeteer
      .launch({
        /** TODO(#17761): Right now some acceptance tests are failing on
         * headless mode. As per the expected behavior we need to make sure
         * every test passes on both modes. */
        headless: false,
        args: ['--start-fullscreen', '--use-fake-ui-for-media-stream']
      })
      .then(async(browser) => {
        this.browserObject = browser;
        this.page = await browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        this.page.on('dialog', async(dialog) => {
          const alertText = dialog.message();
          if (acceptedBrowserAlerts.includes(alertText)) {
            await dialog.accept();
          } else {
            throw new Error(`Unexpected alert: ${alertText}`);
          }
        });
      });

    return this.page;
  }

  /**
   * Function to sign in the user with the given email to the Oppia website.
   * @param {string} email - The email of the user.
   */
  async signInWithEmail(email) {
    await this.goto(testConstants.URLs.Home);
    if (!this.userHasAcceptedCookies) {
      await this.clickOn('OK');
      this.userHasAcceptedCookies = true;
    }
    await this.clickOn('Sign in');
    await this.type(testConstants.SignInDetails.inputField, email);
    await this.clickOn('Sign In');
    await this.page.waitForNavigation({waitUntil: 'networkidle0'});
  }

  /**
   * This function signs up a new user with the given username and email.
   * @param {string} userName - The username of the user.
   * @param {string} signInEmail - The email of the user.
   */
  async signUpNewUser(userName, signInEmail) {
    await this.signInWithEmail(signInEmail);
    await this.type('input.e2e-test-username-input', userName);
    await this.clickOn('input.e2e-test-agree-to-terms-checkbox');
    await this.page.waitForSelector(
      'button.e2e-test-register-user:not([disabled])');
    await this.clickOn(LABEL_FOR_SUBMIT_BUTTON);
    await this.page.waitForNavigation({waitUntil: 'networkidle0'});
  }

  /**
   * Function to reload the current page.
   */
  async reloadPage() {
    await this.page.reload({waitUntil: ['networkidle0', 'domcontentloaded']});
  }

  /**
   * The function clicks the element using the text on the button.
   * @param {string} selector - The text on the button or the CSS selector of
   * the element to be clicked
   */
  async clickOn(selector) {
    try {
      /** Normalize-space is used to remove the extra spaces in the text.
       * Check the documentation for the normalize-space function here :
       * https://developer.mozilla.org/en-US/docs/Web/XPath/Functions/normalize-space */
      const [button] = await this.page.$x(
        `\/\/*[contains(text(), normalize-space('${selector}'))]`);
      await button.click();
    } catch (error) {
      await this.page.waitForSelector(selector);
      await this.page.click(selector);
    }
  }

  /**
   * This function types the text in the input field using its CSS selector.
   * @param {string} selector - The CSS selector of the input field.
   * @param {string} text - The text to be typed in the input field.
   */
  async type(selector, text) {
    await this.page.waitForSelector(selector);
    await this.page.type(selector, text);
  }

  /**
   * This selects a value in a dropdown.
   * @param {string} selector - The CSS selector of the input field.
   * @param {string} option - The option to be selected.
   */
  async select(selector, option) {
    await this.page.waitForSelector(selector);
    await this.page.select(selector, option);
  }

  /**
   * This function navigates to the given URL.
   * @param {string} url - The URL to which the page has to be navigated.
   */
  async goto(url) {
    await this.page.goto(url, {waitUntil: 'networkidle0'});
  }

  /**
   * This function uploads a file using the given file path.
   * @param {string} filePath - The path of the file to be uploaded.
   */
  async uploadFile(filePath) {
    const inputUploadHandle = await this.page.$('input[type=file]');
    let fileToUpload = filePath;
    inputUploadHandle.uploadFile(fileToUpload);
  }

  /**
   * This function logs out the current user.
   */
  async logout() {
    await this.goto(testConstants.URLs.Logout);
    await this.page.waitForSelector(testConstants.Dashboard.MainDashboard);
  }

  /**
   * This function closes the current Puppeteer browser instance.
   */
  async closeBrowser() {
    await this.browserObject.close();
  }
};
