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
 * @fileoverview Page object for the learner dashboard, for use in Protractor
 * tests.
 */

var collectionEditor = require('./collectionEditor.js');

var LearnerDashboardPage = function() {
  var LEARNER_DASHBOARD_URL = '/learner_dashboard';
  var completedSection =
    element(by.css('.protractor-test-completed-section'));
  var feedbackSection =
    element(by.css('.protractor-test-feedback-section'));
  var completedCollectionSection =
    element(by.css('.protractor-test-completed-collection-section'));
  var incompleteCollectionSection =
    element(by.css('.protractor-test-incomplete-collection-section'));
  var subscriptionsSection =
    element(by.css('.protractor-test-subscriptions-section'));
  var titleOfSummaryTile =
    element.all(by.css('.protractor-test-collection-summary-tile-title'));

  this.get = function() {
    return browser.get(LEARNER_DASHBOARD_URL);
  };

  this.navigateToCompletedSection = function() {
    completedSection.click();
  };

  this.navigateToIncompleteCollectionSection = function() {
    incompleteCollectionSection.click();
  };

  this.navigateToCompletedCollectionSection = function() {
    completedCollectionSection.click();
  };

  this.navigateToFeedbackSection = function() {
    feedbackSection.click();
  };

  this.navigateToSubscriptionsSection = function() {
    subscriptionsSection.click();
  };

  this.getTitleOfSummaryTile = function() {
    return titleOfSummaryTile.first().getText();
  };
};

exports.LearnerDashboardPage = LearnerDashboardPage;
