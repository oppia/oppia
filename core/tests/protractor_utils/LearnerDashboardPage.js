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
  var homeSection =
    element(by.css('.e2e-test-home-section'));
  var goalsSection =
    element(by.css('.e2e-test-goals-section'));
  var progressSection =
    element(by.css('.e2e-test-progress-section'));
  var communityLessonsSection =
    element(by.css('.e2e-test-community-lessons-section'));
  var feedbackSection =
    element(by.css('.e2e-test-feedback-section'));
  var feedbackThread =
    element(by.css('.e2e-test-feedback-thread'));
  var subscriptionName =
    element.all(by.css('.e2e-test-subscription-name'));
  var feedbackExplorationTitle =
    element.all(by.css('.e2e-test-feedback-exploration'));
  var feedbackMessage =
    element.all(by.css('.e2e-test-feedback-message'));
  var addToLearnerGoalsButton =
    element(by.css('.e2e-test-add-topic-to-current-goals-button'));
  var currentGoalsTopicName =
    element(by.css('.e2e-test-topic-name-in-current-goals'));
  var editGoalsTopicName =
    element(by.css('.e2e-test-topic-name-in-edit-goals'));
  var skillProficiencyTopicTitle =
    element(by.css('.e2e-test-skill-proficiency-topic-title'));
  var completedGoalsTopicName =
    element(by.css('.e2e-test-completed-goals-topic-name'));
  var topicNamesInLearnerStorySummaryTiles =
    element.all(by.css(
      '.e2e-test-topic-name-in-learner-story-summary-tile'));
  var storyNamesInLearnerStorySummaryTiles =
      element.all(by.css(
        '.e2e-test-story-name-in-learner-story-summary-tile'));
  var topicNamesInLearnerTopicSummaryTiles =
      element.all(by.css('.e2e-test-learner-topic-summary-tile-title'));
  var incompleteCommunityLessonsSection = element(by.css(
    '.e2e-test-incomplete-community-lessons-section'));
  var completeCommunityLessonsSection = element(by.css(
    '.e2e-test-completed-community-lessons-section'));

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
      '.e2e-test-collection-summary-tile-title', title));
    await waitFor.visibilityOf(
      collectionTitle, 'Unable to find collection ' + title);
    expect(await collectionTitle.isDisplayed()).toBe(true);
  };

  this.expectTitleOfExplorationSummaryTileToBeHidden = async function(title) {
    var items = element.all(by.cssContainingText(
      '.e2e-test-exp-summary-tile-title', title));
    expect(await items.count()).toBe(0);
  };

  this.expectTitleOfExplorationSummaryTileToMatch = async function(title) {
    // This explorationTitleArray is an Array but it will have only one element
    // that is the exploration with the title passed as a parameter.
    var explorationTitle = element(
      by.cssContainingText('.e2e-test-exp-summary-tile-title', title));
    expect(await action.getText(
      'Exploration title', explorationTitle)).toMatch(title);
  };

  this.expectNameOfTopicInEditGoalsToMatch = async function(name) {
    await waitFor.visibilityOf(
      editGoalsTopicName,
      'Topic in Edit Goals takes too long to appear');
    await waitFor.textToBePresentInElement(
      editGoalsTopicName, name,
      `Text "${name}" taking too long to be present in editGoalsTopic`);
    var topicName = element(by.cssContainingText(
      '.e2e-test-topic-name-in-edit-goals', name));
    expect(await action.getText('Topic Name', topicName)).toMatch(name);
  };

  this.expectNameOfTopicInCurrentGoalsToMatch = async function(name) {
    await waitFor.visibilityOf(
      currentGoalsTopicName,
      'Topic in Current Goals takes too long to appear');
    await waitFor.textToBePresentInElement(
      currentGoalsTopicName, name,
      `Text "${name}" taking too long to be present in currentGoalsTopic`);
    var topicName = element(by.cssContainingText(
      '.e2e-test-topic-name-in-current-goals', name));
    expect(await action.getText('Topic Name', topicName)).toMatch(name);
  };

  this.expectNameOfTopicInSkillProficiencyToMatch = async function(name) {
    await waitFor.visibilityOf(
      skillProficiencyTopicTitle,
      'Topic in Skill Proficiency takes too long to appear'
    );
    await waitFor.textToBePresentInElement(
      skillProficiencyTopicTitle, name,
      `Text "${name}" taking too long to be present in skillProficiencyTopic`);
    var topicName = element(by.cssContainingText(
      '.e2e-test-skill-proficiency-topic-title', name));
    expect(await action.getText('Topic Name', topicName)).toMatch(name);
  };

  this.expectNameOfTopicInCompletedGoalsToMatch = async function(name) {
    await waitFor.visibilityOf(
      completedGoalsTopicName,
      'Topic in completed goals takes too long to appear'
    );
    await waitFor.textToBePresentInElement(
      completedGoalsTopicName, name,
      `Text "${name}" taking too long to be present in completedGoalsTopic`);
    var topicName = element(by.cssContainingText(
      '.e2e-test-completed-goals-topic-name', name));
    expect(await action.getText('Topic Name', topicName)).toMatch(name);
  };

  this.expectNumberOfTopicsInSuggestedForYou = async function(value) {
    if (value > 0) {
      await waitFor.visibilityOf(
        topicNamesInLearnerTopicSummaryTiles.first(),
        'Learner Topic Name takes too long to appear');
    }
    expect(await topicNamesInLearnerTopicSummaryTiles.count()).toEqual(value);
  };

  this.expectNumberOfStoriesInCompletedStory = async function(value) {
    if (value > 0) {
      await waitFor.visibilityOf(
        storyNamesInLearnerStorySummaryTiles.first(),
        'Story Name Card takes too long to appear');
    }
    expect(await storyNamesInLearnerStorySummaryTiles.count()).toEqual(value);
  };

  this.expectNumberOfTopicsInContinueWhereYouLeftOff = async function(value) {
    if (value > 0) {
      await waitFor.visibilityOf(
        topicNamesInLearnerStorySummaryTiles.first(),
        'Topic Name Card takes too long to appear');
    }
    expect(await topicNamesInLearnerStorySummaryTiles.count()).toEqual(value);
  };

  this.addTopicToLearnerGoals = async function() {
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

  this.navigateToCommunityLessonsAndCheckIncompleteExplorations = (
    async function(explorationTitle) {
      await this.navigateToCommunityLessonsSection();
      var explorationTitleInIncompleteSection = (
        incompleteCommunityLessonsSection.element(by.cssContainingText(
          '.e2e-test-exp-summary-tile-title', explorationTitle)));
      expect(await action.getText(
        'Incomplete exploration title',
        explorationTitleInIncompleteSection)).toMatch(explorationTitle);
    });

  this.navigateToCommunityLessonsAndCheckCompleteExplorations = async function(
      explorationTitle) {
    await this.navigateToCommunityLessonsSection();
    var explorationTitleInCompleteSection = (
      completeCommunityLessonsSection.element(by.cssContainingText(
        '.e2e-test-exp-summary-tile-title', explorationTitle)));
    expect(await action.getText(
      'Complete exploration title',
      explorationTitleInCompleteSection)).toMatch(explorationTitle);
  };

  this.navigateToCommunityLessonsAndCheckIncompleteCollections = async function(
      collectionTitle) {
    await this.navigateToCommunityLessonsSection();
    var collectionTitleInIncompleteSection = (
      incompleteCommunityLessonsSection.element(by.cssContainingText(
        '.e2e-test-collection-summary-tile-title', collectionTitle)));
    expect(await action.getText(
      'Incomplete collection title',
      collectionTitleInIncompleteSection)).toMatch(collectionTitle);
  };

  this.navigateToCommunityLessonsAndCheckCompleteCollections = async function(
      collectionTitle) {
    await this.navigateToCommunityLessonsSection();
    var collectionTitleInCompleteSection = (
      completeCommunityLessonsSection.element(by.cssContainingText(
        '.e2e-test-collection-summary-tile-title', collectionTitle)));
    expect(await action.getText(
      'Complete collection title',
      collectionTitleInCompleteSection)).toMatch(collectionTitle);
  };
};

exports.LearnerDashboardPage = LearnerDashboardPage;
