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
 * @fileoverview End-to-end tests to login, enable feature and re-login.
 */

const AdminPage = require('../protractor_utils/AdminPage.js');
const general = require('../protractor_utils/general.js');
const users = require('../protractor_utils/users.js');

describe('Feature Gating Flow', function() {
  const ADMIN_USER1_EMAIL = 'admin1@featureGatingFlow.com';
  const ADMIN_USERNAME1 = 'featuregating1';
  const ADMIN_USER2_EMAIL = 'admin2@featureGatingFlow.com';
  const ADMIN_USERNAME2 = 'featuregating2';

  // Indicator in Angular component that is visible if the dummy_feature
  // is enabled, and the feature status is successfully loaded in the
  // Angular component.
  const agDummyFeatureIndicator = element(
    by.css('.protractor-test-angular-dummy-feature-indicator'));

  // Indicator in Angular component that is visible if the dummy_feature
  // is enabled, and the backend dummy handler is also enabled.
  const agDummyHandlerIndicator = agDummyFeatureIndicator.element(
    by.css('.protractor-test-angular-dummy-handler-indicator'));

  // Indicator in AngularJS directive that is visible if the dummy_feature
  // is enabled, and the feature status is successfully loaded in the
  // AngularJS directive.
  const ajsDummyFeatureIndicator = element(
    by.css('.protractor-test-angularjs-dummy-feature-indicator'));

  let adminPage = null;

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    await users.createUser(ADMIN_USER1_EMAIL, ADMIN_USERNAME1);
    await users.createUser(ADMIN_USER2_EMAIL, ADMIN_USERNAME2);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });

  afterAll(async function() {
    await users.login(ADMIN_USER1_EMAIL, true);

    await adminPage.getFeaturesTab();
    const dummy = await adminPage.getDummyFeatureElement();

    await adminPage.removeAllRulesOfFeature(dummy);
    await adminPage.saveChangeOfFeature(dummy);
  });

  it('should not show indicators gated by dummy feature when disabled',
    async() => {
      await users.login(ADMIN_USER1_EMAIL, true);
      await adminPage.getFeaturesTab();

      expect(await agDummyFeatureIndicator.isPresent()).toBe(false);
      expect(await ajsDummyFeatureIndicator.isPresent()).toBe(false);
    }
  );

  it('should show dummy feature in the features tab', async() => {
    await users.login(ADMIN_USER1_EMAIL, true);

    await adminPage.getFeaturesTab();

    const dummy = await adminPage.getDummyFeatureElement();

    expect(await dummy.isPresent()).toBe(true);
  });

  it('should show indicators after enabling dummy_feature', async() => {
    await users.login(ADMIN_USER1_EMAIL, true);

    await adminPage.getFeaturesTab();
    const dummy = await adminPage.getDummyFeatureElement();
    await adminPage.enableFeatureForDev(dummy);

    await users.logout();
    await users.login(ADMIN_USER2_EMAIL, true);

    await adminPage.getFeaturesTab();

    expect(await agDummyFeatureIndicator.isPresent()).toBe(true);
    expect(await agDummyHandlerIndicator.isPresent()).toBe(true);
    expect(await ajsDummyFeatureIndicator.isPresent()).toBe(true);
  });
});
