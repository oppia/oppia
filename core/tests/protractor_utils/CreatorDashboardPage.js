// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the creator dashboard, for use in Protractor
 * tests.
 */

var CreatorDashboardPage = function() {
  var CREATOR_DASHBOARD_URL = '/creator_dashboard';
  var explorationFeedbackCount =
    element(by.css('.protractor-test-exploration-feedback-count'));
  var explorationDashboardCard =
    element(by.css('.protractor-test-exploration-dashboard-card'));
  var collectionCard = element(by.css('.protractor-test-collection-card'));
  var subscriptionTab = element(by.css('.protractor-test-subscription-tab'));
  var createActivityButton =
    element(by.css('.protractor-test-create-activity'));
  var createCollectionButton =
    element(by.css('.protractor-test-create-collection'));
  var createExplorationButton =
    element(by.css('.protractor-test-create-exploration'));

    // Returns a promise of all explorations with the given name.
  var _getExplorationElements = function(explorationTitle) {
    return element.all(by.css('.protractor-test-exploration-dashboard-card'))
      .filter(function(tile) {
        return tile.element(by.css('.protractor-test-exp-summary-tile-title')).
          getText().then(function(tileTitle) {
            return (tileTitle === explorationTitle);
          });
      }
      );
  };

  this.get = function() {
    return browser.get(CREATOR_DASHBOARD_URL);
  };

  this.getNumberOfFeedbackMessages = function() {
    return explorationFeedbackCount.getText().then(function(text) {
      return parseInt(text);
    });
  };

  this.navigateToExplorationEditor = function() {
    explorationDashboardCard.click();
  };

  this.clickCreateActivityButton = function() {
    createActivityButton.click();
  };

  this.clickCreateCollectionButton = function() {
    createCollectionButton.click();
  };

  this.clickCreateExplorationButton = function() {
    createExplorationButton.click();
  };

  this.navigateToCollectionEditor = function() {
    collectionCard.click();
  };

  this.navigateToSubscriptionDashboard = function() {
    subscriptionTab.click();
  };

  this.editExploration = function(explorationTitle) {
    _getExplorationElements(explorationTitle).then(function(elems) {
      if (elems.length === 0) {
        throw 'Could not find exploration tile with name ' + explorationTitle;
      }
      elems[0].element(by.css('.mask-wrap')).click();
    });
  };
};

exports.CreatorDashboardPage = CreatorDashboardPage;
