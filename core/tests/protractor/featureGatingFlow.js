// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests to login, check various pages
 * and then logout.
 */

const { AdminPage } = require(
  '../protractor_utils/AdminPage.js');
const general = require('../protractor_utils/general.js');
const users = require('../protractor_utils/users.js');
const waitFor = require('../protractor_utils/waitFor.js');

describe('Feature Gating Flow', function() {
  const ADMIN_USER_EMAIL = 'admin@featureGatingFlow.com';
  const ADMIN_USERNAME = 'featuregating';

  let adminPage = null;

  beforeAll(async function() {
    adminPage = new AdminPage();
    await users.createAdmin(ADMIN_USER_EMAIL, ADMIN_USERNAME);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });

  it('should not show indicators gated by dummy feature', async() => {
    await users.login(ADMIN_USER_EMAIL, true);
    await adminPage.get();
    expect(
      await element(by.css('.protractor-test-angular-dummy-feature-indicator'))
        .isPresent()
    ).toBe(false);
    expect(
      await element(by.css(
        '.protractor-test-angularjs-dummy-feature-indicator'))
        .isPresent()
    ).toBe(false);
  });

  it('should show dummy in the features tab', async() => {
    await users.login(ADMIN_USER_EMAIL, true);

    await adminPage.getFeaturesTab();
    await waitFor.invisibilityOf(
      element(by.css('.protractor-test-no-feature')));

    const dummyFeatureElement = element.all(
      by.css('.protractor-test-feature-flag')
    )
      .filter(async elem => {
        return (await elem.element(by.css('h2.feature-name')).getText()) ===
          'dummy_feature';
      })
      .first();


    const addRuleButton = dummyFeatureElement.element(
      by.css('.protractor-test-feature-add-rule-button')
    );


    expect(element(by.css('.protractor-test-no-rule-indicator')).isPresent())
      .toBe(true);

    await addRuleButton.click();
    await waitFor.pageToFullyLoad();

    expect(
      await element(by.css('.protractor-test-no-rule-indicator')).isPresent()
    )
      .toBe(false);
  });
  // it('should land on the learner dashboard after successful login',
  //   async function() {
  //     expect(await browser.getCurrentUrl()).toEqual(
  //       'http://localhost:9001/learner-dashboard');
  //   });
});
