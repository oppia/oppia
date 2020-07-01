// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Login script to access pages behind authentication for
 * lighthouse checks
 * @param {puppeteer.Browser} browser
 * @param {{url: string, options: LHCI.CollectCommand.Options}} context
 */

module.exports = async(browser, context) => {
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
    // Sign into Oppia.
  if(context.url.includes('admin')) {
    try {
      // eslint-disable-next-line dot-notation
      await page.goto(context.url);
      await page.click('#admin');
      await Promise.all([
        page.waitForNavigation(),
        page.click('#submit-login'),
      ]);

      await page.type('#username', 'username1');
      await page.click('#terms-checkbox');
      await page.waitFor(5000);

      await Promise.all([
        page.waitForNavigation(),
        await page.click('#signup-submit')
      ]);
    } catch (e) {
      // Already logged into Oppia
    }
  }
  else if(context.url.includes('emaildashboard')) {
    // eslint-disable-next-line dot-notation
    await page.goto('http://127.0.0.1:8181/admin#/roles');
    await page.waitFor(2000);
    await page.type('#update-role-username-textbook', 'username1');
    await page.select('#update-role-input', 'string:ADMIN');
    await page.waitFor(5000);
    await page.click('#update-button-id');
    await page.waitFor(2000);
  }
  else if(context.url.includes('collection/0')) {
    // eslint-disable-next-line dot-notation
    await page.goto('http://127.0.0.1:8181/admin#/roles');
    await page.waitFor(2000);
    await page.type('#update-role-username-textbook', 'username1');
    await page.select('#update-role-input', 'string:COLLECTION_EDITOR');
    await page.waitFor(5000);
    await page.click('#update-button-id');
    await page.waitFor(2000);
    // Load in Collection
    // eslint-disable-next-line dot-notation
    await page.goto('http://127.0.0.1:8181/admin');
    await page.waitFor(2000);
    await page.evaluate('window.confirm = () => true');
    await page.click('#reload-collection-button-id');
  }
  await page.close();
};
