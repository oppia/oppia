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
  // Indicator in Angular component that is visible if the dummy_feature
  // is enabled, and the feature status is successfully loaded in the
  // Angular component.
  const agDummyFeatureIndicator = element(
    by.css('.protractor-test-angular-dummy-feature-indicator'));

  // Indicator in AngularJS directive that is visible if the dummy_feature
  // is enabled, and the feature status is successfully loaded in the
  // AngularJS directive.
  const ajsDummyFeatureIndicator = element(
    by.css('.protractor-test-angularjs-dummy-feature-indicator'));

  let adminPage = null;

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });

  afterAll(async function() {
    await users.createAndLoginAdminUser(
      'admin1@featureGatingFlow.com', 'featuregating1');

    await adminPage.getFeaturesTab();
    const dummy = await adminPage.getDummyFeatureElement();
    await adminPage.enableFeatureForDev(dummy);
    await adminPage.removeAllRulesOfFeature(dummy);
    await adminPage.saveChangeOfFeature(dummy);

    await users.logout();
  });

  it('should not show indicators gated by dummy feature when disabled',
    async() => {
      await users.createAndLoginAdminUser(
        'admin2@featureGatingFlow.com', 'featuregating2');

      await adminPage.getFeaturesTab();
      expect(await agDummyFeatureIndicator.isPresent()).toBe(false);
      expect(await ajsDummyFeatureIndicator.isPresent()).toBe(false);

      await users.logout();
    }
  );

  it('should show dummy feature in the features tab', async() => {
    await users.createAndLoginAdminUser(
      'admin3@featureGatingFlow.com', 'featuregating3');

    await adminPage.getFeaturesTab();

    const dummy = await adminPage.getDummyFeatureElement();

    expect(await dummy.isPresent()).toBe(true);
    await users.logout();
  });
});
