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

var general = require('./general.js');

var LearnerDashboardPage = function() {
  var LEARNER_DASHBOARD_URL = '/learner_dashboard';
  var completedSection =
    element(by.css('.protractor-test-completed-section'));
  var feedbackSection =
    element(by.css('.protractor-test-feedback-section'));
  var feedbackThread =
    element(by.css('.protractor-test-feedback-thread'));
  var completedCollectionsSection =
    element(by.css('.protractor-test-completed-collection-section'));
  var incompleteCollectionsSection =
    element(by.css('.protractor-test-incomplete-collection-section'));
  var subscriptionsSection =
    element(by.css('.protractor-test-subscriptions-section'));
  var subscriptionName =
    element.all(by.css('.protractor-test-subscription-name'));
  var titleOfSummaryTile =
    element.all(by.css('.protractor-test-collection-summary-tile-title'));
  var feedbackExplorationTitle =
    element.all(by.css('.protractor-test-feedback-exploration'));
  var feedbackMessage =
    element.all(by.css('.protractor-test-feedback-message'));

  this.get = function() {
    return browser.get(LEARNER_DASHBOARD_URL);
  };

  this.navigateToCompletedSection = function() {
    completedSection.click();
    browser.waitForAngular();
  };

  this.navigateToIncompleteCollectionsSection = function() {
    incompleteCollectionsSection.click();
    browser.waitForAngular();
    general.waitForSystem();
  };

  this.navigateToCompletedCollectionsSection = function() {
    completedCollectionsSection.click();
    browser.waitForAngular();
    general.waitForSystem();
  };

  this.navigateToFeedbackSection = function() {
    feedbackSection.click();
    browser.waitForAngular();
  };

  this.navigateToFeedbackThread = function() {
    feedbackThread.click();
    browser.waitForAngular();
  };

  this.navigateToSubscriptionsSection = function() {
    subscriptionsSection.click();
    browser.waitForAngular();
  };

  this.expectTitleOfSummaryTileToMatch = function(title) {
    expect(
      titleOfSummaryTile.first().getText()
    ).toMatch(title);
  };

  this.expectSubscriptionFirstNameToMatch = function(name) {
    expect(
      subscriptionName.first().getText()
    ).toMatch(name);
  };

  this.expectSubscriptionLastNameToMatch = function(name) {
    expect(
      subscriptionName.last().getText()
    ).toMatch(name);
  };

  this.expectFeedbackExplorationTitleToMatch = function(title) {
    expect(
      feedbackExplorationTitle.first().getText()
    ).toMatch(title);
  };

  this.expectFeedbackMessageToMatch = function(message) {
    expect(
      feedbackMessage.first().getText()
    ).toMatch(message);
  };
};

exports.LearnerDashboardPage = LearnerDashboardPage;
