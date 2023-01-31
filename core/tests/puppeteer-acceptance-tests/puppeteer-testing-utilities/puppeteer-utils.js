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
const { showMessage } = require('./show-message-utils.js');

const rolesEditorTab = testConstants.URLs.RolesEditorTab;
const roleEditorInputField = 'input.e2e-test-username-for-role-editor';
const roleEditorButtonSelector = 'button.e2e-test-role-edit-button';
const rolesSelectDropdown = 'div.mat-select-trigger';
const LABEL_FOR_SUBMIT_BUTTON = 'Submit and start contributing';
const addRoleButton = 'button.oppia-add-role-button';

module.exports = class puppeteerUtilities {
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
        args: ['--start-fullscreen', '--use-fake-ui-for-media-stream']
      })
      .then(async(browser) => {
        this.browserObject = browser;
        this.page = await browser.newPage();
        await this.page.setViewport({ width: 0, height: 0 });
        // Accepting the alerts that appear in between the tests.
        await this.page.on('dialog', async dialog => {
          await dialog.accept();
        });
      });

    return this.page;
  }

  /**
   * Function to sign in the user with the given email to the Oppia website.
   * @param {string} email - The email of the user.
   */
  async signInWithEmail(email) {
    await this.goto(testConstants.URLs.home);
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
      const [button] = await this.page.$x(
        `\/\/*[contains(text(), '${selector}')]`);
      await button.click();
    } catch (error) {
      await this.page.waitForSelector(selector);
      await this.page.click(selector);
    }
  }

  /**
   * The function to assign a role to a user.
   * @param {string} username - The username to which role would be assigned.
   * @param {string} role - The role that would be assigned to the user.
   */
  async assignRoleToUser(username, role) {
    await this.goto(rolesEditorTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.clickOn(addRoleButton);
    await this.clickOn(rolesSelectDropdown);
    await this.page.evaluate(async(role) => {
      const allRoles = document.getElementsByClassName('mat-option-text');
      for (let i = 0; i < allRoles.length; i++) {
        if (allRoles[i].innerText.toLowerCase() === role) {
          allRoles[i].click({waitUntil: 'networkidle0'});
          return;
        }
      }
      throw new Error(`Role ${role} does not exists.`);
    }, role);
  }

  /**
   * The function excepts the user to have the given role.
   * @param {string} username - The username to which role must be assigned.
   * @param {string} role - The role which must be assigned to the user.
   */
  async expectUserToHaveRole(username, role) {
    const currentPageUrl = this.page.url();
    await this.goto(rolesEditorTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    await this.page.evaluate((role) => {
      const userRoles = document.getElementsByClassName(
        'oppia-user-role-description');
      for (let i = 0; i < userRoles.length; i++) {
        if (userRoles[i].innerText.toLowerCase() === role) {
          return;
        }
      }
      throw new Error(`User does not have the ${role} role!`);
    }, role);
    showMessage(`User ${username} has the ${role} role!`);
    await this.goto(currentPageUrl);
  }

  /**
   * The function excepts the user to not have the given role.
   * @param {string} username - The user to which the role must not be assigned.
   * @param {string} role - The role which must not be assigned to the user.
   */
  async expectUserNotToHaveRole(username, role) {
    const currentPageUrl = this.page.url();
    await this.goto(rolesEditorTab);
    await this.type(roleEditorInputField, username);
    await this.clickOn(roleEditorButtonSelector);
    await this.page.waitForSelector('div.justify-content-between');
    await this.page.evaluate((role) => {
      const userRoles = document.getElementsByClassName(
        'oppia-user-role-description');
      for (let i = 0; i < userRoles.length; i++) {
        if (userRoles[i].innerText.toLowerCase() === role) {
          throw new Error(`User has the ${role} role!`);
        }
      }
    }, role);
    showMessage(`User ${username} does not have the ${role} role!`);
    await this.goto(currentPageUrl);
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
    await this.goto(testConstants.URLs.logout);
    await this.page.waitForSelector(testConstants.Dashboard.MainDashboard);
  }

  /**
   * This function closes the current Puppeteer browser instance.
   */
  async closeBrowser() {
    await this.browserObject.close();
  }
};
