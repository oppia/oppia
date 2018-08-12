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

var waitFor = require('./waitFor.js');

var LearnerDashboardPage = function() {
  var LEARNER_DASHBOARD_URL = '/learner_dashboard';
  var completedSection =
    element(by.css('.protractor-test-completed-section'));
  var incompleteSection =
    element(by.css('.protractor-test-incomplete-section'));
  var feedbackSection =
    element(by.css('.protractor-test-feedback-section'));
  var feedbackThread =
    element(by.css('.protractor-test-feedback-thread'));
  var completedCollectionsSection =
    element(by.css('.protractor-test-completed-collection-section'));
  var completedExplorationsSection =
    element(by.css('.protractor-test-completed-exp-section'));
  var incompleteCollectionsSection =
    element(by.css('.protractor-test-incomplete-collection-section'));
  var incompleteExplorationsSection =
    element(by.css('.protractor-test-incomplete-exp-section'));
  var subscriptionsSection =
    element(by.css('.protractor-test-subscriptions-section'));
  var subscriptionName =
    element.all(by.css('.protractor-test-subscription-name'));
  var titleOfExplorationSummaryTile =
    element.all(by.css('.protractor-test-exp-summary-tile-title'));
  var titleOfCollectionSummaryTile =
    element.all(by.css('.protractor-test-collection-summary-tile-title'));
  var feedbackExplorationTitle =
    element.all(by.css('.protractor-test-feedback-exploration'));
  var feedbackMessage =
    element.all(by.css('.protractor-test-feedback-message'));

  this.get = function() {
    browser.get(LEARNER_DASHBOARD_URL);
    return waitFor.pageToFullyLoad();
  };

  this.navigateToCompletedSection = function() {
    waitFor.elementToBeClickable(
      completedSection, 'Completed tab takes too long to be clickable');
    completedSection.click();
  };

  this.navigateToInCompleteSection = function() {
    waitFor.elementToBeClickable(
      incompleteSection, 'In Progress tab takes too long to be clickable');
    incompleteSection.click();
  };

  this.navigateToIncompleteCollectionsSection = function() {
    waitFor.elementToBeClickable(
      incompleteCollectionsSection,
      'Incomplete Collection Section tab takes too long to be clickable');
    incompleteCollectionsSection.click();
  };

  this.navigateToIncompleteExplorationsSection = function() {
    waitFor.elementToBeClickable(
      incompleteExplorationsSection,
      'Incomplete Collection Section tab takes too long to be clickable');
    incompleteExplorationsSection.click();
  };

  this.navigateToCompletedCollectionsSection = function() {
    waitFor.elementToBeClickable(
      completedCollectionsSection,
      'Completed Collection Section tab takes too long to be clickable');
    completedCollectionsSection.click();
  };

  this.navigateToCompletedExplorationsSection = function() {
    waitFor.elementToBeClickable(
      completedExplorationsSection,
      'Completed Collection Section tab takes too long to be clickable');
    completedExplorationsSection.click();
  };

  this.navigateToFeedbackSection = function() {
    waitFor.elementToBeClickable(
      feedbackSection, 'Feedback Section tab takes too long to be clickable');
    feedbackSection.click();
  };

  this.navigateToFeedbackThread = function() {
    waitFor.elementToBeClickable(
      feedbackThread, 'Feedback Thread tab takes too long to be clickable');
    feedbackThread.click();
  };

  this.navigateToSubscriptionsSection = function() {
    waitFor.elementToBeClickable(
      subscriptionsSection,
      'Subscriptions Section tab takes too long to be clickable');
    subscriptionsSection.click();
  };

  this.expectTitleOfCollectionSummaryTileToBeHidden = function(title) {
    element.all(by.cssContainingText(
      '.protractor-test-collection-summary-tile-title', title))
      .then(function(items) {
        expect(items.length).toBe(0);
      });
  };

  this.expectTitleOfCollectionSummaryTileToMatch = function(title) {
    var collectionTitle = element(by.cssContainingText(
      '.protractor-test-collection-summary-tile-title', title));
    waitFor.visibilityOf(
      collectionTitle, 'Unable to find collection ' + title);
    expect(collectionTitle.isDisplayed()).toBe(true);
  };

  this.expectTitleOfExplorationSummaryTileToBeHidden = function(title) {
    element.all(by.cssContainingText(
      '.protractor-test-exp-summary-tile-title', title)).then(function(items) {
      expect(items.length).toBe(0);
    });
  };

  this.expectTitleOfExplorationSummaryTileToMatch = function(title) {
    var explorationTitle = element(
      by.cssContainingText('.protractor-test-exp-summary-tile-title', title));
    waitFor.visibilityOf(
      explorationTitle, 'Unable to find exploration ' + title);
    expect(explorationTitle.isDisplayed()).toBe(true);
  };

  this.expectSubscriptionFirstNameToMatch = function(name) {
    waitFor.visibilityOf(
      subscriptionName.first(),
      'Subscription First Name takes too long to appear');
    expect(subscriptionName.first().getText()).toMatch(name);
  };

  this.expectSubscriptionLastNameToMatch = function(name) {
    waitFor.visibilityOf(
      subscriptionName.last(),
      'Subscription Last Name takes too long to appear');
    expect(subscriptionName.last().getText()).toMatch(name);
  };

  this.expectFeedbackExplorationTitleToMatch = function(title) {
    waitFor.visibilityOf(
      feedbackExplorationTitle.first(),
      'Feedback Exploration Title takes too long to appear');
    expect(feedbackExplorationTitle.first().getText()).toMatch(title);
  };

  this.expectFeedbackMessageToMatch = function(message) {
    waitFor.visibilityOf(
      feedbackMessage.first(), 'Feedback Message takes too long to appear');
    expect(feedbackMessage.first().getText()).toMatch(message);
  };

  this.checkIncompleteExplorationSection = function(explorationTitle) {
    this.navigateToInCompleteSection();
    this.navigateToIncompleteExplorationsSection();
    this.expectTitleOfExplorationSummaryTileToMatch(
      explorationTitle);
  };

  this.checkCompleteExplorationSection = function(explorationTitle) {
    this.navigateToCompletedSection();
    this.navigateToCompletedExplorationsSection();
    this.expectTitleOfExplorationSummaryTileToMatch(
      explorationTitle);
  };

  this.checkIncompleteCollectionSection = function(collectionTitle) {
    this.navigateToInCompleteSection();
    this.navigateToIncompleteCollectionsSection();
    this.expectTitleOfCollectionSummaryTileToMatch(
      collectionTitle);
  };

  this.checkCompleteCollectionSection = function(collectionTitle) {
    this.navigateToCompletedSection();
    this.navigateToCompletedCollectionsSection();
    this.expectTitleOfCollectionSummaryTileToMatch(
      collectionTitle);
  };
};

exports.LearnerDashboardPage = LearnerDashboardPage;
