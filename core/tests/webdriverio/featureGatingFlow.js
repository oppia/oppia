// Copyright 2022 The Oppia Authors. All Rights Reserved.
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

var AdminPage = require('../webdriverio_utils/AdminPage.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');

describe('Feature Gating Flow', function() {
  var ADMIN_USER1_EMAIL = 'admin1@featureGatingFlow.com';
  var ADMIN_USERNAME1 = 'featuregating1';
  var ADMIN_USER2_EMAIL = 'admin2@featureGatingFlow.com';
  var ADMIN_USERNAME2 = 'featuregating2';

  let adminPage = null;

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();

    await users.createAndLoginCurriculumAdminUser(
      ADMIN_USER1_EMAIL, ADMIN_USERNAME1);
    await users.logout();

    await users.createAndLoginCurriculumAdminUser(
      ADMIN_USER2_EMAIL, ADMIN_USERNAME2);
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });

  afterAll(async function() {
    await users.login(ADMIN_USER1_EMAIL, true);

    await adminPage.getFeaturesTab();
    var dummy = await adminPage.getDummyFeatureElement();

    await adminPage.removeAllRulesOfFeature(dummy);
    await adminPage.saveChangeOfFeature(dummy);
    await users.logout();
  });

  it('should not show indicators gated by dummy feature when disabled',
    async() => {
      await users.login(ADMIN_USER1_EMAIL, true);
      await adminPage.getFeaturesTab();

      // Indicator in Angular component that is visible if the dummy_feature
      // is enabled, and the feature status is successfully loaded in the
      // Angular component.
      var agDummyFeatureIndicator = $(
        '.e2e-test-angular-dummy-feature-indicator');

      // Indicator in AngularJS directive that is visible if the dummy_feature
      // is enabled, and the feature status is successfully loaded in the
      // AngularJS directive.
      var ajsDummyFeatureIndicator = $(
        '.e2e-test-angularjs-dummy-feature-indicator');

      expect(await agDummyFeatureIndicator.isExisting()).toBe(false);
      expect(await ajsDummyFeatureIndicator.isExisting()).toBe(false);
      await users.logout();
    }
  );

  it('should show dummy feature in the features tab', async() => {
    await users.login(ADMIN_USER1_EMAIL, true);

    await adminPage.getFeaturesTab();

    var dummy = await adminPage.getDummyFeatureElement();

    expect(await dummy.isExisting()).toBe(true);
    await users.logout();
  });

  it('should not show indicators for dummy_feature to different users',
    async() => {
      await users.login(ADMIN_USER1_EMAIL, true);

      await adminPage.getFeaturesTab();
      var dummy = await adminPage.getDummyFeatureElement();
      await adminPage.enableFeatureForDev(dummy);

      await users.logout();
      await users.login(ADMIN_USER2_EMAIL, true);

      await adminPage.getFeaturesTab();

      // Indicator in Angular component that is visible if the dummy_feature
      // is enabled, and the feature status is successfully loaded in the
      // Angular component.
      var agDummyFeatureIndicator = $(
        '.e2e-test-angular-dummy-feature-indicator');

      // Indicator in Angular component that is visible if the dummy_feature
      // is enabled, and the backend dummy handler is also enabled.
      var agDummyHandlerIndicator = $(
        '.e2e-test-angular-dummy-handler-indicator');

      // Indicator in AngularJS directive that is visible if the dummy_feature
      // is enabled, and the feature status is successfully loaded in the
      // AngularJS directive.
      var ajsDummyFeatureIndicator = $(
        '.e2e-test-angularjs-dummy-feature-indicator');

      expect(await agDummyFeatureIndicator.isExisting()).toBe(false);
      expect(await agDummyHandlerIndicator.isExisting()).toBe(false);
      expect(await ajsDummyFeatureIndicator.isExisting()).toBe(false);
      await users.logout();
    });
});
