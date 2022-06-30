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
 * @fileoverview Page object for the learner dashboard, for use in WebdriverIO
 * tests.
 */

var waitFor = require('./waitFor.js');
var action = require('./action.js');

var LearnerDashboardPage = function() {
  var LEARNER_DASHBOARD_URL = '/learner-dashboard';

  this.get = async function() {
    await browser.url(LEARNER_DASHBOARD_URL);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToHomeSection = async function() {
    var homeSection = await $('.e2e-test-home-section');
    await action.click('Home Section', homeSection);
  };

  this.navigateToGoalsSection = async function() {
    var goalsSection = await $('.e2e-test-goals-section');
    await action.click('Goals Section', goalsSection);
  };

  this.navigateToProgressSection = async function() {
    var progressSection = await $('.e2e-test-progress-section');
    await action.click('Progress Section', progressSection);
  };

  this.navigateToCommunityLessonsSection = async function() {
    var communityLessonsSection = await $(
      '.e2e-test-community-lessons-section');
    await action.click('Community Lessons Section', communityLessonsSection);
  };

  this.navigateToFeedbackSection = async function() {
    var feedbackSection = await $('.e2e-test-feedback-section');
    await action.click('Feedback Section', feedbackSection);
  };

  this.navigateToFeedbackThread = async function() {
    var feedbackThread = await $('.e2e-test-feedback-thread');
    await action.click('Feedback Thread', feedbackThread);
  };

  this.expectTitleOfCollectionSummaryTileToMatch = async function(title) {
    var collectionTitle = await $(
      `.e2e-test-collection-summary-tile-title=${title}`);
    await waitFor.visibilityOf(
      collectionTitle, 'Unable to find collection ' + title);
    expect(await collectionTitle.isDisplayed()).toBe(true);
  };

  this.expectTitleOfExplorationSummaryTileToBeHidden = async function(title) {
    var items = await $$(
      `.e2e-test-exp-summary-tile-title=${title}`);
    expect(await items.length).toBe(0);
  };

  this.expectTitleOfExplorationSummaryTileToMatch = async function(title) {
    // This explorationTitleArray is an Array but it will have only one element
    // that is the exploration with the title passed as a parameter.
    var explorationTitle = await $(
      `.e2e-test-exp-summary-tile-title=${title}`);
    expect(await action.getText(
      'Exploration title', explorationTitle)).toMatch(title);
  };

  this.expectNameOfTopicInEditGoalsToMatch = async function(name) {
    var editGoalsTopicName = await $('.e2e-test-topic-name-in-edit-goals');
    await waitFor.visibilityOf(
      editGoalsTopicName,
      'Topic in Edit Goals takes too long to appear');
    await waitFor.textToBePresentInElement(
      editGoalsTopicName, name,
      `Text "${name}" taking too long to be present in editGoalsTopic`);
    var topicName = await $(
      `.e2e-test-topic-name-in-edit-goals=${name}`);
    expect(await action.getText('Topic Name', topicName)).toMatch(name);
  };

  this.expectNameOfTopicInCurrentGoalsToMatch = async function(name) {
    var currentGoalsTopicName = await $(
      '.e2e-test-topic-name-in-current-goals');
    await waitFor.visibilityOf(
      currentGoalsTopicName,
      'Topic in Current Goals takes too long to appear');
    await waitFor.textToBePresentInElement(
      currentGoalsTopicName, name,
      `Text "${name}" taking too long to be present in currentGoalsTopic`);
    var topicName = await $(
      `.e2e-test-topic-name-in-current-goals=${name}`);
    expect(await action.getText('Topic Name', topicName)).toMatch(name);
  };

  this.expectNameOfTopicInSkillProficiencyToMatch = async function(name) {
    var skillProficiencyTopicTitle = await $(
      '.e2e-test-skill-proficiency-topic-title');
    await waitFor.visibilityOf(
      skillProficiencyTopicTitle,
      'Topic in Skill Proficiency takes too long to appear'
    );
    await waitFor.textToBePresentInElement(
      skillProficiencyTopicTitle, name,
      `Text "${name}" taking too long to be present in skillProficiencyTopic`);
    var topicName = await $(
      `.e2e-test-skill-proficiency-topic-title=${name}`);
    expect(await action.getText('Topic Name', topicName)).toMatch(name);
  };

  this.expectNameOfTopicInCompletedGoalsToMatch = async function(name) {
    var completedGoalsTopicName = await $(
      '.e2e-test-completed-goals-topic-name');
    await waitFor.visibilityOf(
      completedGoalsTopicName,
      'Topic in completed goals takes too long to appear'
    );
    await waitFor.textToBePresentInElement(
      completedGoalsTopicName, name,
      `Text "${name}" taking too long to be present in completedGoalsTopic`);
    var topicName = await $(
      `.e2e-test-completed-goals-topic-name=${name}`);
    expect(await action.getText('Topic Name', topicName)).toMatch(name);
  };

  this.expectNumberOfTopicsInSuggestedForYou = async function(value) {
    var topicNamesInLearnerTopicSummaryTiles = await $$(
      '.e2e-test-learner-topic-summary-tile-title');
    if (value > 0) {
      await waitFor.visibilityOf(
        topicNamesInLearnerTopicSummaryTiles[0],
        'Learner Topic Name takes too long to appear');
    }
    expect(await topicNamesInLearnerTopicSummaryTiles.length).toEqual(value);
  };

  this.expectNumberOfStoriesInCompletedStory = async function(value) {
    var storyNamesInLearnerStorySummaryTiles = await $$(
      '.e2e-test-story-name-in-learner-story-summary-tile');
    if (value > 0) {
      await waitFor.visibilityOf(
        storyNamesInLearnerStorySummaryTiles[0],
        'Story Name Card takes too long to appear');
    }
    expect(await storyNamesInLearnerStorySummaryTiles.length).toEqual(value);
  };

  this.expectNumberOfTopicsInContinueWhereYouLeftOff = async function(value) {
    var topicNamesInLearnerStorySummaryTiles = await $$(
      '.e2e-test-topic-name-in-learner-story-summary-tile');
    if (value > 0) {
      await waitFor.visibilityOf(
        topicNamesInLearnerStorySummaryTiles[0],
        'Topic Name Card takes too long to appear');
    }
    expect(await topicNamesInLearnerStorySummaryTiles.length).toEqual(value);
  };

  this.addTopicToLearnerGoals = async function() {
    var addToLearnerGoalsButton = await $(
      '.e2e-test-add-topic-to-current-goals-button');
    await action.click('Add to learner goals button', addToLearnerGoalsButton);
  };

  this.expectSubscriptionFirstNameToMatch = async function(name) {
    var subscriptionName = await $$('.e2e-test-subscription-name');
    await waitFor.visibilityOf(
      subscriptionName[0],
      'Subscription First Name takes too long to appear');
    expect(await subscriptionName[0].getText()).toMatch(name);
  };

  this.expectSubscriptionLastNameToMatch = async function(name) {
    var subscriptionName = await $$('.e2e-test-subscription-name');
    var lastElement = subscriptionName.length - 1;
    await waitFor.visibilityOf(
      subscriptionName[lastElement],
      'Subscription Last Name takes too long to appear');
    expect(await subscriptionName[lastElement].getText()).toMatch(name);
  };

  this.expectFeedbackExplorationTitleToMatch = async function(title) {
    var feedbackExplorationTitle = await $$(
      '.e2e-test-feedback-exploration');
    await waitFor.visibilityOf(
      feedbackExplorationTitle[0],
      'Feedback Exploration Title takes too long to appear');
    expect(await feedbackExplorationTitle[0].getText()).toMatch(title);
  };

  this.expectFeedbackMessageToMatch = async function(message) {
    var feedbackMessage = await $$('.e2e-test-feedback-message');
    await waitFor.visibilityOf(
      feedbackMessage[0], 'Feedback Message takes too long to appear');
    expect(await feedbackMessage[0].getText()).toMatch(message);
  };

  this.navigateToCommunityLessonsAndCheckIncompleteExplorations = (
    async function(explorationTitle) {
      await this.navigateToCommunityLessonsSection();
      var incompleteCommunityLessonsSection = await $(
        '.e2e-test-incomplete-community-lessons-section');
      var explorationTitleInIncompleteSection = await (
        incompleteCommunityLessonsSection.$(
          `.e2e-test-exp-summary-tile-title=${explorationTitle}`));
      expect(await action.getText(
        'Incomplete exploration title',
        explorationTitleInIncompleteSection)).toMatch(explorationTitle);
    });

  this.navigateToCommunityLessonsAndCheckCompleteExplorations = async function(
      explorationTitle) {
    await this.navigateToCommunityLessonsSection();
    var completeCommunityLessonsSection = await $(
      '.e2e-test-completed-community-lessons-section');
    var explorationTitleInCompleteSection = await (
      completeCommunityLessonsSection.$(
        `.e2e-test-exp-summary-tile-title=${explorationTitle}`));
    expect(await action.getText(
      'Complete exploration title',
      explorationTitleInCompleteSection)).toMatch(explorationTitle);
  };

  this.navigateToCommunityLessonsAndCheckIncompleteCollections = async function(
      collectionTitle) {
    await this.navigateToCommunityLessonsSection();
    var incompleteCommunityLessonsSection = await $(
      '.e2e-test-incomplete-community-lessons-section');
    var collectionTitleInIncompleteSection = await (
      incompleteCommunityLessonsSection.$(
        `.e2e-test-collection-summary-tile-title=${collectionTitle}`));
    expect(await action.getText(
      'Incomplete collection title',
      collectionTitleInIncompleteSection)).toMatch(collectionTitle);
  };

  this.navigateToCommunityLessonsAndCheckCompleteCollections = async function(
      collectionTitle) {
    await this.navigateToCommunityLessonsSection();
    var completeCommunityLessonsSection = await $(
      '.e2e-test-completed-community-lessons-section');
    var collectionTitleInCompleteSection = await (
      completeCommunityLessonsSection.$(
        `.e2e-test-collection-summary-tile-title=${collectionTitle}`));
    expect(await action.getText(
      'Complete collection title',
      collectionTitleInCompleteSection)).toMatch(collectionTitle);
  };
};

exports.LearnerDashboardPage = LearnerDashboardPage;
