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
  var addToLearnerGoalsButton = $(
    '.e2e-test-add-topic-to-current-goals-button');
  var communityLessonsSection = $('.e2e-test-community-lessons-section');
  var completeCommunityLessonsSection = $(
    '.e2e-test-completed-community-lessons-section');
  var completedGoalsTopicName = $('.e2e-test-completed-goals-topic-name');
  var currentGoalsTopicName = $('.e2e-test-topic-name-in-current-goals');
  var editGoalsTopicName = $('.e2e-test-topic-name-in-edit-goals');
  var goalsSection = $('.e2e-test-goals-section');
  var homeSection = $('.e2e-test-home-section');
  var incompleteCommunityLessonsSection = $(
    '.e2e-test-incomplete-community-lessons-section');
  var progressSection = $('.e2e-test-progress-section');
  var subscriptionSection = $('.e2e-test-subscriptions-section');
  var skillProficiencyTopicTitle = $('.e2e-test-skill-proficiency-topic-title');
  var stopicNamesInLearnerTopicSummaryTile = $(
    '.e2e-test-learner-topic-summary-tile-title');
  var stopicNamesInLearnerTopicSummaryTilesSelector = function() {
    return $$('.e2e-test-learner-topic-summary-tile-title');
  };
  var storyNamesInLearnerStorySummaryTile = $(
    '.e2e-test-story-name-in-learner-story-summary-tile');
  var storyNamesInLearnerStorySummaryTilesSelector = function() {
    return $$('.e2e-test-story-name-in-learner-story-summary-tile');
  };
  var topicNamesInLearnerStorySummaryTile = $(
    '.e2e-test-topic-name-in-learner-story-summary-tile');
  var topicNamesInLearnerStorySummaryTilesSelector = function() {
    return $$('.e2e-test-topic-name-in-learner-story-summary-tile');
  };

  var subscriptionNameElement = $('.e2e-test-subscription-name');
  var subscriptionNameSelector = function() {
    return $$('.e2e-test-subscription-name');
  };

  this.get = async function() {
    await browser.url(LEARNER_DASHBOARD_URL);
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
    await waitFor.visibilityOf(
      communityLessonsSection,
      'Commmunity lesson section takes too long to appear'
    );
    await action.click('Community Lessons Section', communityLessonsSection);
  };

  this.expectTitleOfCollectionSummaryTileToMatch = async function(title) {
    var collectionTitle = $(
      `.e2e-test-collection-summary-tile-title=${title}`);
    await waitFor.visibilityOf(
      collectionTitle, 'Unable to find collection ' + title);
    expect(await collectionTitle.isDisplayed()).toBe(true);
  };

  this.expectTitleOfExplorationSummaryTileToBeHidden = async function(title) {
    var items = await $$(
      `.e2e-test-exp-summary-tile-title=${title}`);
    expect(items.length).toBe(0);
  };

  this.expectTitleOfExplorationSummaryTileToMatch = async function(title) {
    // This explorationTitleArray is an Array but it will have only one element
    // that is the exploration with the title passed as a parameter.
    var explorationTitle = $(
      `.e2e-test-exp-summary-tile-title=${title}`);
    var titleOfExplorationSummary = await action.getText(
      'Exploration title', explorationTitle);
    expect(titleOfExplorationSummary).toMatch(title);
  };

  this.expectNameOfTopicInEditGoalsToMatch = async function(name) {
    await waitFor.visibilityOf(
      editGoalsTopicName,
      'Topic in Edit Goals takes too long to appear');
    await waitFor.textToBePresentInElement(
      editGoalsTopicName, name,
      `Text "${name}" taking too long to be present in editGoalsTopic`);
    var topicName = $(
      `.e2e-test-topic-name-in-edit-goals=${name}`);
    expect(await action.getText('Topic Name', topicName)).toMatch(name);
  };

  this.expectNameOfTopicInCurrentGoalsToMatch = async function(name) {
    await waitFor.visibilityOf(
      currentGoalsTopicName,
      'Topic in Current Goals takes too long to appear');
    await waitFor.textToBePresentInElement(
      currentGoalsTopicName, name,
      `Text "${name}" taking too long to be present in currentGoalsTopic`);
    var topicName = $(
      `.e2e-test-topic-name-in-current-goals=${name}`);
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
    var topicName = $(
      `.e2e-test-skill-proficiency-topic-title=${name}`);
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
    var topicName = $(
      `.e2e-test-completed-goals-topic-name*=${name}`);
    expect(await action.getText('Topic Name', topicName)).toMatch(name);
  };

  this.expectNumberOfTopicsInSuggestedForYou = async function(value) {
    if (value > 0) {
      await waitFor.visibilityOf(
        stopicNamesInLearnerTopicSummaryTile,
        'Learner Topic Name takes too long to appear');
    }
    var stopicNamesInLearnerTopicSummaryTiles = (
      await stopicNamesInLearnerTopicSummaryTilesSelector());
    expect(stopicNamesInLearnerTopicSummaryTiles.length).toEqual(value);
  };

  this.expectNumberOfStoriesInCompletedStory = async function(value) {
    if (value > 0) {
      await waitFor.visibilityOf(
        storyNamesInLearnerStorySummaryTile,
        'Story Name Card takes too long to appear');
    }
    var storyNamesInLearnerStorySummaryTiles = (
      await storyNamesInLearnerStorySummaryTilesSelector());
    expect(storyNamesInLearnerStorySummaryTiles.length).toEqual(value);
  };

  this.expectNumberOfTopicsInContinueWhereYouLeftOff = async function(value) {
    if (value > 0) {
      await waitFor.visibilityOf(
        topicNamesInLearnerStorySummaryTile,
        'Topic Name Card takes too long to appear');
    }
    var topicNamesInLearnerStorySummaryTiles = (
      await topicNamesInLearnerStorySummaryTilesSelector());
    expect(topicNamesInLearnerStorySummaryTiles.length).toEqual(value);
  };

  this.addTopicToLearnerGoals = async function() {
    await action.click('Add to learner goals button', addToLearnerGoalsButton);
  };

  this.expectSubscriptionFirstNameToMatch = async function(name) {
    await waitFor.visibilityOf(
      subscriptionSection, 'Subscription section takes too long to appear');
    await subscriptionSection.scrollIntoView();
    await waitFor.visibilityOf(
      subscriptionNameElement,
      'Subscription First Name takes too long to appear');
    var subscriptionName = await subscriptionNameSelector();
    expect(await subscriptionName[0].getText()).toMatch(name);
  };

  this.expectSubscriptionLastNameToMatch = async function(name) {
    var subscriptionName = await subscriptionNameSelector();
    var lastElement = subscriptionName.length - 1;
    await waitFor.visibilityOf(
      subscriptionName[lastElement],
      'Subscription Last Name takes too long to appear');
    expect(await subscriptionName[lastElement].getText()).toMatch(name);
  };

  this.navigateToCommunityLessonsAndCheckIncompleteExplorations = (
    async function(explorationTitle) {
      await this.navigateToCommunityLessonsSection();
      var explorationTitleInIncompleteSection = (
        incompleteCommunityLessonsSection.$(
          `.e2e-test-exp-summary-tile-title=${explorationTitle}`));
      expect(await action.getText(
        'Incomplete exploration title',
        explorationTitleInIncompleteSection)).toMatch(explorationTitle);
    });

  this.navigateToCommunityLessonsAndCheckCompleteExplorations = async function(
      explorationTitle) {
    await this.navigateToCommunityLessonsSection();
    var explorationTitleInCompleteSection = (
      completeCommunityLessonsSection.$(
        `.e2e-test-exp-summary-tile-title=${explorationTitle}`));
    expect(await action.getText(
      'Complete exploration title',
      explorationTitleInCompleteSection)).toMatch(explorationTitle);
  };

  this.navigateToCommunityLessonsAndCheckIncompleteCollections = async function(
      collectionTitle) {
    await this.navigateToCommunityLessonsSection();
    var collectionTitleInIncompleteSection = (
      incompleteCommunityLessonsSection.$(
        `.e2e-test-collection-summary-tile-title=${collectionTitle}`));
    expect(await action.getText(
      'Incomplete collection title',
      collectionTitleInIncompleteSection)).toMatch(collectionTitle);
  };

  this.navigateToCommunityLessonsAndCheckCompleteCollections = async function(
      collectionTitle) {
    await this.navigateToCommunityLessonsSection();
    var collectionTitleInCompleteSection = (
      completeCommunityLessonsSection.$(
        `.e2e-test-collection-summary-tile-title=${collectionTitle}`));
    expect(await action.getText(
      'Complete collection title',
      collectionTitleInCompleteSection)).toMatch(collectionTitle);
  };
};

exports.LearnerDashboardPage = LearnerDashboardPage;
