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
const { element } = require('protractor');

var LearnerDashboardPage = function() {
  var LEARNER_DASHBOARD_URL = '/learner-dashboard';
  var homeSection =
    element(by.css('.protractor-test-home-section'));
  var goalsSection =
    element(by.css('.protractor-test-goals-section'));
  var progressSection =
    element(by.css('.protractor-test-progress-section'));
  var communityLessonsSection =
    element(by.css('.protractor-test-community-lessons-section'));
  var feedbackSection =
    element(by.css('.protractor-test-feedback-section'));
  var feedbackThread =
    element(by.css('.protractor-test-feedback-thread'));
  var subscriptionName =
    element.all(by.css('.protractor-test-subscription-name'));
  var feedbackExplorationTitle =
    element.all(by.css('.protractor-test-feedback-exploration'));
  var feedbackMessage =
    element.all(by.css('.protractor-test-feedback-message'));
  var addToLearnerGoalsButton =
    element.all(by.css('.protractor-test-add-topic-to-current-goals-button'));
  var currentGoalsTopic =
    element(by.css('.protractor-test-topic-name-in-current-goals'));
  var skillProficiencyTopic =
    element(by.css('.protractor-test-skill-proficiency-topic-title'));
  var completedGoalsTopic =
    element(by.css('.protractor-test-completed-goals-topic-name'));
  var continueWhereYouLeftOffTopicName =
    element.all(by.css(
      '.protractor-test-topic-name-in-learner-story-summary-tile'));
  var completedStoriesName =
      element.all(by.css(
        '.protractor-test-story-name-in-learner-story-summary-tile'));
  var suggestedForYouTopicName =
      element.all(by.css('.protractor-test-learner-topic-summary-tile-title'));

  this.get = async function() {
    await browser.get(LEARNER_DASHBOARD_URL);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToHomeSection = async function() {
    await action.click('Home Section', homeSection);
  };

  this.navigateToGoalsSection = async function() {
    await action.click('Goals Section', goalsSection);
  };

  this.navigateToProgressSection = async function() {
    await action.click('Progress Section', progressSection);
  };

  this.navigateToCommunityLessonsSection = async function() {
    await action.click('Community Lessons Section', communityLessonsSection);
  };

  this.navigateToFeedbackSection = async function() {
    await action.click('Feedback Section', feedbackSection);
  };

  this.navigateToFeedbackThread = async function() {
    await action.click('Feedback Thread', feedbackThread);
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

  this.expectNameOfTopicInEditGoalsToMatch = async function(name) {
    var topicName = element(by.cssContainingText(
      '.protractor-test-topic-name-in-edit-goals', name));
    expect(await topicName.getText()).toMatch(name);
  };

  this.expectNameOfTopicInCurrentGoalsToMatch = async function(name) {
    await waitFor.visibilityOf(
      currentGoalsTopic,
      'Topic in Current Goals takes too long to appear');
    await waitFor.textToBePresentInElement(
      currentGoalsTopic, name, 'No Current goals Text');
    var topicName = element(by.cssContainingText(
      '.protractor-test-topic-name-in-current-goals', name));
    expect(await topicName.getText()).toMatch(name);
  };

  this.expectNameOfTopicInSkillProficiencyToMatch = async function(name) {
    await waitFor.visibilityOf(
      skillProficiencyTopic,
      'Topic in Skill Proficiency takes too long to appear'
    );
    await waitFor.textToBePresentInElement(
      skillProficiencyTopic, name, 'No Skill Proficiency text');
    var topicName = element(by.cssContainingText(
      '.protractor-test-skill-proficiency-topic-title', name));
    expect(await topicName.getText()).toMatch(name);
  };

  this.expectNameOfTopicInCompletedGoalsToMatch = async function(name) {
    await waitFor.visibilityOf(
      completedGoalsTopic,
      'Topic in completed goals takes too long to appear'
    );
    await waitFor.textToBePresentInElement(
      completedGoalsTopic, name, 'No Completed Goals text');
    var topicName = element(by.cssContainingText(
      '.protractor-test-completed-goals-topic-name', name));
    expect(await topicName.getText()).toMatch(name);
  };

  this.expectCountOfTopicInSuggestedForYou = async function(value) {
    await waitFor.visibilityOf(
      suggestedForYouTopicName.first(),
      'Learner Topic Name takes too long to appear');
    expect(await suggestedForYouTopicName.count()).toEqual(value);
  };

  this.expectCountOfStoryInCompletedStory = async function(value) {
    await waitFor.visibilityOf(
      completedStoriesName.first(),
      'Story Name Card takes too long to appear');
    expect(await completedStoriesName.count()).toEqual(value);
  };

  this.expectCountOfTopicInContinueWhereYouLeftOff = async function(value) {
    await waitFor.visibilityOf(
      continueWhereYouLeftOffTopicName.first(),
      'Topic Name Card takes too long to appear');
    expect(await continueWhereYouLeftOffTopicName.count()).toEqual(value);
  };

  this.addTopicToLearnerGoals = async function() {
    await waitFor.visibilityOf(
      addToLearnerGoalsButton,
      'Add to learner goals button takes too long to appear');
    await action.click('Add to learner goals button', addToLearnerGoalsButton);
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

  this.checkIncompleteExplorationInCommunityLessonsTab = async function(
      explorationTitle) {
    await this.navigateToCommunityLessonsSection();
    await this.expectTitleOfExplorationSummaryTileToMatch(explorationTitle);
  };

  this.checkCompleteExplorationInCommunityLessonsTab = async function(
      explorationTitle) {
    await this.navigateToCommunityLessonsSection();
    await this.expectTitleOfExplorationSummaryTileToMatch(
      explorationTitle);
  };

  this.checkIncompleteCollectionInCommunityLessonsTab = async function(
      collectionTitle) {
    await this.navigateToCommunityLessonsSection();
    await this.expectTitleOfCollectionSummaryTileToMatch(collectionTitle);
  };

  this.checkCompleteCollectionInCommunityLessonsTab = async function(
      collectionTitle) {
    await this.navigateToCommunityLessonsSection();
    await this.expectTitleOfCollectionSummaryTileToMatch(
      collectionTitle);
  };
};

exports.LearnerDashboardPage = LearnerDashboardPage;
