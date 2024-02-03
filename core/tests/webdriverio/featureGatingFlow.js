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

var ReleaseCoordinatorPage = require(
  '../webdriverio_utils/ReleaseCoordinatorPage.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');

describe('Feature Gating Flow', function() {
  var RELEASE_COORDINATOR_USER1_EMAIL = (
    'releasecoordinator1@featureGatingFlow.com');
  var RELEASE_COORDINATOR_USERNAME1 = 'featuregating1';
  var RELEASE_COORDINATOR_USER2_EMAIL = (
    'releasecoordinator2@featureGatingFlow.com');
  var RELEASE_COORDINATOR_USERNAME2 = 'featuregating2';

  let releaseCoordinatorPage = null;

  beforeAll(async function() {
    releaseCoordinatorPage = (
      new ReleaseCoordinatorPage.ReleaseCoordinatorPage());

    await users.createUserWithRole(
      RELEASE_COORDINATOR_USER1_EMAIL,
      RELEASE_COORDINATOR_USERNAME1,
      'release coordinator');

    await users.createUserWithRole(
      RELEASE_COORDINATOR_USER2_EMAIL,
      RELEASE_COORDINATOR_USERNAME2,
      'release coordinator');
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });

  afterAll(async function() {
    await users.login(RELEASE_COORDINATOR_USER1_EMAIL, true);

    await releaseCoordinatorPage.getFeaturesTab();
    var dummy = await releaseCoordinatorPage.getDummyFeatureFlagForE2ETests();

    await releaseCoordinatorPage.saveChangeOfFeature(dummy);
    await users.logout();
  });

  it('should not show indicators gated by dummy feature when disabled',
    async() => {
      await users.login(RELEASE_COORDINATOR_USER1_EMAIL, true);
      await releaseCoordinatorPage.getFeaturesTab();

      // Indicator in Angular component that is visible if the
      // dummy_feature_flag_for_e2e_tests is enabled, and the feature status
      // is successfully loaded in the Angular component.
      var agDummyFeatureIndicator = $(
        '.e2e-test-angular-dummy-feature-indicator');

      expect(await agDummyFeatureIndicator.isExisting()).toBe(false);
      await users.logout();
    }
  );

  it('should show dummy feature in the features tab', async() => {
    await users.login(RELEASE_COORDINATOR_USER1_EMAIL, true);

    await releaseCoordinatorPage.getFeaturesTab();

    var dummy = await releaseCoordinatorPage.getDummyFeatureFlagForE2ETests();

    expect(await dummy.isExisting()).toBe(true);
    await users.logout();
  });

  it('should show indicators for dummy_feature_flag_for_e2e_tests ' +
  'to different users when feature is enabled', async() => {
    await users.login(RELEASE_COORDINATOR_USER1_EMAIL, true);

    // Indicator in Angular component that is visible if the
    // dummy_feature_flag_for_e2e_tests is enabled, and the feature status
    // is successfully loaded in the Angular component.
    var agDummyFeatureIndicator = $(
      '.e2e-test-angular-dummy-feature-indicator');

    // Indicator in Angular component that is visible if the
    // dummy_feature_flag_for_e2e_tests is enabled, and the backend
    // dummy handler is also enabled.
    var agDummyHandlerIndicator = $(
      '.e2e-test-angular-dummy-handler-indicator');

    await releaseCoordinatorPage.getFeaturesTab();
    expect(await agDummyFeatureIndicator.isExisting()).toBe(false);
    expect(await agDummyHandlerIndicator.isExisting()).toBe(false);
    var dummy = await releaseCoordinatorPage.getDummyFeatureFlagForE2ETests();
    await releaseCoordinatorPage.enableFeature(dummy);

    await users.logout();
    await users.login(RELEASE_COORDINATOR_USER2_EMAIL, true);

    await releaseCoordinatorPage.getFeaturesTab();

    expect(await agDummyFeatureIndicator.isExisting()).toBe(true);
    expect(await agDummyHandlerIndicator.isExisting()).toBe(true);
    await releaseCoordinatorPage.disableFeatureFlag(dummy);
    await users.logout();
  });

  it('should set rollout-percentage for feature flag', async() => {
    await users.login(RELEASE_COORDINATOR_USER1_EMAIL, true);
    await releaseCoordinatorPage.getFeaturesTab();

    var dummy = await releaseCoordinatorPage.getDummyFeatureFlagForE2ETests();

    // Here we are sending the expected rollout-percentage as a string
    // because the webdriverio is not context aware when fetching the value,
    // It fetches the value as a string.
    await releaseCoordinatorPage.expectRolloutPercentageToMatch(dummy, '0');

    await releaseCoordinatorPage.setRolloutPercentageForFeatureFlag(dummy, 50);
    await releaseCoordinatorPage.getFeaturesTab();

    await releaseCoordinatorPage.expectRolloutPercentageToMatch(dummy, '50');
  });
});
