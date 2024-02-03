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
 * @fileoverview Page object for the release-coordinator page, for use in
 * WebdriverIO tests.
 */

var action = require('./action.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');

var ReleaseCoordinatorPage = function() {
  var RELEASE_COORDINATOR_URL_SUFFIX = '/release-coordinator';
  var featureFlagElementsSelector = function() {
    return $$('.e2e-test-feature-flag');
  };
  var featureFlagElement = $('.e2e-test-feature-flag');
  var featureNameLocator = '.e2e-test-feature-name';
  var featuresTab = $('.e2e-test-features-tab');
  var saveButtonLocator = '.e2e-test-save-button';
  var valueSelectorLocator = '.e2e-test-value-selector';
  var statusMessage = $('.e2e-test-status-message');
  var featureFlagRolloutPercentage = (
    '.e2e-test-rollout-percentage');

  this.get = async function() {
    await browser.url(RELEASE_COORDINATOR_URL_SUFFIX);
    await waitFor.pageToFullyLoad();
  };

  this.getFeaturesTab = async function() {
    await this.get();
    await action.click('Release coordinator features tab', featuresTab);
    await waitFor.visibilityOf(
      featureFlagElement, 'Feature flags not showing up');
  };

  // Remove this method after the dummy_feature_flag_for_e2e_tests feature flag
  // is deprecated.
  this.getDummyFeatureFlagForE2ETests = async function() {
    var featureFlagElements = await featureFlagElementsSelector();
    var count = featureFlagElements.length;
    for (let i = 0; i < count; i++) {
      var elem = featureFlagElements[i];
      if ((await elem.$(featureNameLocator).getText()) ===
          'dummy_feature_flag_for_e2e_tests') {
        return elem;
      }
    }

    return null;
  };

  this.getImprovementsTabFeatureElement = async function() {
    var featureFlagElements = await featureFlagElementsSelector();
    var count = featureFlagElements.length;
    for (let i = 0; i < count; i++) {
      var elem = featureFlagElements[i];
      if ((await elem.$(featureNameLocator).getText()) ===
          'is_improvements_tab_enabled') {
        return elem;
      }
    }

    return null;
  };

  // Remove this method after the end_chapter_celebration feature flag
  // is deprecated.
  this.getEndChapterCelebrationFeatureElement = async function() {
    var featureFlagElements = await featureFlagElementsSelector();
    var count = featureFlagElements.length;
    for (let i = 0; i < count; i++) {
      var elem = featureFlagElements[i];
      if ((await elem.$(featureNameLocator).getText()) ===
          'end_chapter_celebration') {
        return elem;
      }
    }

    return null;
  };

  // Remove this method after the checkpoint_celebration feature flag
  // is deprecated.
  this.getCheckpointCelebrationFeatureElement = async function() {
    var featureFlagElements = await featureFlagElementsSelector();
    var count = featureFlagElements.length;
    for (let i = 0; i < count; i++) {
      var elem = featureFlagElements[i];
      if ((await elem.$(featureNameLocator).getText()) ===
          'checkpoint_celebration') {
        return elem;
      }
    }

    return null;
  };

  // TODO(#18881): Remove this method after the cd_admin_dashboard_new_ui
  // feature flag is deprecated.
  this.getCdAdminDashboardNewUiFeatureElement = async function() {
    var featureFlagElements = await featureFlagElementsSelector();
    var count = featureFlagElements.length;
    for (let i = 0; i < count; i++) {
      var elem = featureFlagElements[i];
      if ((await elem.$(featureNameLocator).getText()) ===
          'cd_admin_dashboard_new_ui') {
        return elem;
      }
    }

    return null;
  };

  // Remove this method after the serial_chapter_launch_curriculum_admin_view
  // feature flag is deprecated.
  this.getSerialChapterCurriculumAdminFeatureElement = async function() {
    var featureFlagElements = await featureFlagElementsSelector();
    var count = featureFlagElements.length;
    for (let i = 0; i < count; i++) {
      var elem = featureFlagElements[i];
      if (await action.getText('Feature Flag', elem.$(featureNameLocator)) ===
          'serial_chapter_launch_curriculum_admin_view') {
        return elem;
      }
    }

    return null;
  };

  // This function is meant to be used to enable a feature gated behind
  // a feature flag.
  this.enableFeature = async function(featureElement) {
    await waitFor.visibilityOf(
      featureElement.$(valueSelectorLocator),
      'Enabling force-enable property takes too long to appear'
    );

    await (featureElement.$(valueSelectorLocator)).selectByVisibleText('Yes');
    await this.saveChangeOfFeature(featureElement);
  };

  this.disableFeatureFlag = async function(featureFlagElement) {
    await waitFor.visibilityOf(
      featureFlagElement.$(valueSelectorLocator),
      'Disabling force-enable property takes too long to appear'
    );

    await (
      featureFlagElement.$(valueSelectorLocator)).selectByVisibleText('No');
    await this.saveChangeOfFeature(featureFlagElement);
  };

  this.setRolloutPercentageForFeatureFlag = async function(
      featureFlagElement, rolloutPercentage) {
    await waitFor.visibilityOf(
      featureFlagElement.$(featureFlagRolloutPercentage),
      'Setting rollout-percentage property takes too long to appear'
    );
    await action.setValue(
      'rolloutPercentage',
      featureFlagElement.$(featureFlagRolloutPercentage).$(
        '.e2e-test-editor-int'),
      rolloutPercentage);
    await this.saveChangeOfFeature(featureFlagElement);
  };

  this.expectRolloutPercentageToMatch = async function(
      featureFlagElement, rolloutPercentage) {
    await waitFor.visibilityOf(
      featureFlagElement.$(featureFlagRolloutPercentage),
      'Rollout-percentage property takes too long to appear'
    );
    var value = await action.getValue(
      'rolloutPercentage',
      featureFlagElement.$(featureFlagRolloutPercentage).$(
        '.e2e-test-editor-int')
    );
    expect(value).toBe(rolloutPercentage);
  };

  this.saveChangeOfFeature = async function(featureElement) {
    await action.click(
      'Save feature button',
      featureElement
        .$(saveButtonLocator)
    );

    await general.acceptAlert();
    await waitFor.visibilityOf(statusMessage);
  };
};

exports.ReleaseCoordinatorPage = ReleaseCoordinatorPage;
