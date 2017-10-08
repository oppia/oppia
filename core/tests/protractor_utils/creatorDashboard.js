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

var CreatorDashboard = function() {
  var CREATOR_DASHBOARD_URL = '/creator_dashboard';
  var feedbackCount =
    element(by.css('.protractor-test-exploration-feedback-count'));
  var explorationDashboardCard =
    element(by.css('.protractor-test-exploration-dashboard-card'));

  this.get = function() {
    return browser.get(CREATOR_DASHBOARD_URL);
  };

  this.getNumberOfFeedbackMessages = function() {
    return feedbackCount.getText().then(function(text) {
      return parseInt(text);
    });
  };

  this.navigateToExplorationEditor = function() {
    explorationDashboardCard.click();
  };
};
