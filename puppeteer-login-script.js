// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Login script to access pages behind authentication for
 * lighthouse checks
 * @param {puppeteer.Browser} browser
 * @param {{url: string, options: LHCI.CollectCommand.Options}} context
 */
const ADMIN_URL = 'http://127.0.0.1:8181/admin';
const CREATOR_DASHBOARD_URL = 'http://127.0.0.1:8181/creator-dashboard';
const networkIdle = 'networkidle0';

var emailInput = '.protractor-test-sign-in-email-input';
var signInButton = '.protractor-test-sign-in-button';
var usernameInput = '.protractor-test-username-input';
var agreeToTermsCheckBox = '.protractor-test-agree-to-terms-checkbox';
var registerUser = '.protractor-test-register-user:not([disabled])';
var navbarToggle = '.oppia-navbar-dropdown-toggle';

var updateFormName = '.protractor-update-form-name';
var updateFormSubmit = '.protractor-update-form-submit';
var roleSelect = '.protractor-update-form-role-select';
var statusMessage = '.protractor-test-status-message';

module.exports = async(browser, context) => {
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  // Sign into Oppia.
  if (context.url.includes('admin')) {
    await login(context, page);
  } else if (context.url.includes('emaildashboard')) {
    await setRole(page, 'string:ADMIN');
  } else if (context.url.includes('collection/0')) {
    await createCollections(context, page);
  } else if (context.url.includes('explore/0')) {
    await createExplorations(context, page);
  }
  await page.close();
};

// Needed to relogin after lighthouse_setup.js.
const login = async function(context, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto(ADMIN_URL, {waitUntil: networkIdle});
    await page.waitForSelector(emailInput, {visible: true});
    await page.type(emailInput, 'testadmin@example.com');
    await page.click(signInButton);
    // Checks if the user's account was already made.
    try {
      await page.waitForSelector(usernameInput, {visible: true});
      await page.type(usernameInput, 'username1');
      await page.click(agreeToTermsCheckBox);
      await page.waitForSelector(registerUser);
      await page.click(registerUser);
      await page.waitForSelector(navbarToggle);
    } catch (error) {
      // Already Signed in.
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
};

const setRole = async function(page, role) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto(
      'http://127.0.0.1:8181/admin#/roles', { waitUntil: networkIdle });
    await page.waitForSelector(updateFormName);
    await page.type(updateFormName, 'username1');
    await page.select(roleSelect, role);
    await page.waitForSelector(updateFormSubmit);
    await page.click(updateFormSubmit);
    await page.waitForSelector(statusMessage);
    await page.waitForFunction(
      'document.querySelector(' +
        '".protractor-test-status-message").innerText.includes(' +
        '"successfully updated to")'
    );
    // eslint-disable-next-line dot-notation
    await page.goto(CREATOR_DASHBOARD_URL, { waitUntil: networkIdle});
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
};


const createCollections = async function(context, page) {
  try {
    // eslint-disable-next-line no-console
    console.log('Creating Collections...');
    await setRole(page, 'string:COLLECTION_EDITOR');
    // Load in Collection
    // eslint-disable-next-line dot-notation
    await page.goto('http://127.0.0.1:8181/admin');
    await page.waitForTimeout(2000);
    await page.evaluate('window.confirm = () => true');
    await page.click('#reload-collection-button-id');
    // eslint-disable-next-line no-console
    console.log('Collections Created');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
};

const createExplorations = async function(context, page) {
  try {
    // eslint-disable-next-line no-console
    console.log('Creating Exploration...');
    // Load in Exploration
    // eslint-disable-next-line dot-notation
    await page.goto('http://127.0.0.1:8181/admin', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    await page.evaluate('window.confirm = () => true');
    await page.click(
      '.protractor-test-reload-exploration-button');
    // eslint-disable-next-line no-console
    console.log('Exploration Created');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
};
