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
var action = require('./action.js');

var LearnerDashboardPage = function() {
  var LEARNER_DASHBOARD_URL = '/learner-dashboard';
  var completedSection =
    element(by.css('.protractor-test-completed-section'));
  var playLaterSection =
      element(by.css('.protractor-test-play-later-section'));
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
  var feedbackExplorationTitle =
    element.all(by.css('.protractor-test-feedback-exploration'));
  var feedbackMessage =
    element.all(by.css('.protractor-test-feedback-message'));

  this.get = async function() {
    await browser.get(LEARNER_DASHBOARD_URL);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToPlayLaterExplorationSection = async function() {
    await action.click('Play Later Section', playLaterSection);
  };

  this.navigateToCompletedSection = async function() {
    await action.click('Completed Section', completedSection);
  };

  this.navigateToInCompleteSection = async function() {
    await action.click('Incomplete Section', incompleteSection);
  };

  this.navigateToIncompleteCollectionsSection = async function() {
    await action.click(
      'Incomplete Collections Section', incompleteCollectionsSection);
  };

  this.navigateToIncompleteExplorationsSection = async function() {
    await action.click(
      'Incomplete Explorations Section', incompleteExplorationsSection);
  };

  this.navigateToCompletedCollectionsSection = async function() {
    await action.click(
      'Completed Collections Section', completedCollectionsSection);
  };

  this.navigateToCompletedExplorationsSection = async function() {
    await action.click(
      'Completed Explorations Section', completedExplorationsSection);
  };

  this.navigateToFeedbackSection = async function() {
    await action.click('Feedback Section', feedbackSection);
  };

  this.navigateToFeedbackThread = async function() {
    await action.click('Feedback Thread', feedbackThread);
  };

  this.navigateToSubscriptionsSection = async function() {
    await action.click('Subscriptions Section', subscriptionsSection);
  };

  this.expectTitleOfCollectionSummaryTileToMatch = async function(title) {
    var collectionTitle = element(by.cssContainingText(
      '.protractor-test-collection-summary-tile-title', title));
    await waitFor.visibilityOf(
      collectionTitle, 'Unable to find collection ' + title);
    expect(await collectionTitle.isDisplayed()).toBe(true);
  };

  this.expectTitleOfExplorationSummaryTileToBeHidden = async function(title) {
    var items = element.all(by.cssContainingText(
      '.protractor-test-exp-summary-tile-title', title));
    expect(await items.count()).toBe(0);
  };

  this.expectTitleOfExplorationSummaryTileToMatch = async function(title) {
    // This explorationTitleArray is an Array but it will have only one element
    // that is the exploration with the title passed as a parameter.
    var explorationTitle = element(
      by.cssContainingText('.protractor-test-exp-summary-tile-title', title));
    expect(await explorationTitle.getText()).toMatch(title);
  };

  this.expectSubscriptionFirstNameToMatch = async function(name) {
    await waitFor.visibilityOf(
      subscriptionName.first(),
      'Subscription First Name takes too long to appear');
    expect(await subscriptionName.first().getText()).toMatch(name);
  };

  this.expectSubscriptionLastNameToMatch = async function(name) {
    await waitFor.visibilityOf(
      subscriptionName.last(),
      'Subscription Last Name takes too long to appear');
    expect(await subscriptionName.last().getText()).toMatch(name);
  };

  this.expectFeedbackExplorationTitleToMatch = async function(title) {
    await waitFor.visibilityOf(
      feedbackExplorationTitle.first(),
      'Feedback Exploration Title takes too long to appear');
    expect(await feedbackExplorationTitle.first().getText()).toMatch(title);
  };

  this.expectFeedbackMessageToMatch = async function(message) {
    await waitFor.visibilityOf(
      feedbackMessage.first(), 'Feedback Message takes too long to appear');
    expect(await feedbackMessage.first().getText()).toMatch(message);
  };

  this.checkIncompleteExplorationSection = async function(explorationTitle) {
    await this.navigateToInCompleteSection();
    await this.navigateToIncompleteExplorationsSection();
    await this.expectTitleOfExplorationSummaryTileToMatch(
      explorationTitle);
  };

  this.checkCompleteExplorationSection = async function(explorationTitle) {
    await this.navigateToCompletedSection();
    await this.navigateToCompletedExplorationsSection();
    await this.expectTitleOfExplorationSummaryTileToMatch(
      explorationTitle);
  };

  this.checkIncompleteCollectionSection = async function(collectionTitle) {
    await this.navigateToInCompleteSection();
    await this.navigateToIncompleteCollectionsSection();
    await this.expectTitleOfCollectionSummaryTileToMatch(
      collectionTitle);
  };

  this.checkCompleteCollectionSection = async function(collectionTitle) {
    await this.navigateToCompletedSection();
    await this.navigateToCompletedCollectionsSection();
    await this.expectTitleOfCollectionSummaryTileToMatch(
      collectionTitle);
  };
};

exports.LearnerDashboardPage = LearnerDashboardPage;
