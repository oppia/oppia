// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for the new Learner dashboard page.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');

var TopicsAndSkillsDashboardPage =
  require('../webdriverio_utils/TopicsAndSkillsDashboardPage.js');
var ExplorationPlayerPage =
  require('../webdriverio_utils/ExplorationPlayerPage.js');
var NewLearnerDashboardPage =
  require('../webdriverio_utils/NewLearnerDashboardPage.js');
var AdminPage = require('../webdriverio_utils/AdminPage.js');
var ReleaseCoordinatorPage = require(
  '../webdriverio_utils/ReleaseCoordinatorPage.js');
var TopicEditorPage = require('../webdriverio_utils/TopicEditorPage.js');
var StoryEditorPage = require('../webdriverio_utils/StoryEditorPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');
var SubscriptionDashboardPage =
  require('../webdriverio_utils/SubscriptionDashboardPage.js');
var TopicAndStoryViewerPage = require(
  '../webdriverio_utils/TopicAndStoryViewerPage.js');
var ExplorationEditorPage =
  require('../webdriverio_utils/ExplorationEditorPage.js');
var SkillEditorPage = require('../webdriverio_utils/SkillEditorPage.js');

describe('New Learner dashboard functionality', function() {
  var topicsAndSkillsDashboardPage = null;
  var adminPage = null;
  var releaseCoordinatorPage = null;
  var libraryPage = null;
  var topicEditorPage = null;
  var storyEditorPage = null;
  var newLearnerDashboardPage = null;
  //   Var subscriptionDashboardPage = null;
  var skillEditorPage = null;

  beforeAll(async function() {
    libraryPage = new LibraryPage.LibraryPage();
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    adminPage = new AdminPage.AdminPage();
    releaseCoordinatorPage = (
      new ReleaseCoordinatorPage.ReleaseCoordinatorPage());
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    topicAndStoryViewerPage = (
      new TopicAndStoryViewerPage.TopicAndStoryViewerPage());
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    newLearnerDashboardPage = new NewLearnerDashboardPage.
      NewLearnerDashboardPage();
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    subscriptionDashboardPage =
      new SubscriptionDashboardPage.SubscriptionDashboardPage();
    await users.createAndLoginCurriculumAdminUser(
      'creator1@learnerDashboard.com', 'creator1LearnerDashboard');
    // The below lines enable the show_redesigned_learner_dashboard flag
    // in dev mode. They should be removed after the
    // show_redesigned_learner_dashboard flag is deprecated.
    await adminPage.get();
    await adminPage.addRole('creator1LearnerDashboard', 'release coordinator');
    await releaseCoordinatorPage.getFeaturesTab();
    var redesignedLearnerDashboardFlag = (
      await releaseCoordinatorPage.
        getRedesignedLearnerDashboardFeatureElement());
    await releaseCoordinatorPage.enableFeatureForTest(
      redesignedLearnerDashboardFlag);
    await users.logout();
  });

  it('should add exploration to lesson you saved for later', async function() {
    var EXPLORATION_FRACTION = 'fraction';
    var EXPLORATION_SINGING = 'singing';
    var CATEGORY_MATHEMATICS = 'Mathematics';
    var CATEGORY_MUSIC = 'Music';
    var LANGUAGE_ENGLISH = 'English';
    var EXPLORATION_OBJECTIVE = 'hold the light of two trees';
    var EXPLORATION_OBJECTIVE2 = 'show us the darkness';

    await users.createUser(
      'creator@learnerDashboard.com', 'creatorLearnerDashboard');
    await users.login('creator@learnerDashboard.com');
    await workflow.createAndPublishExploration(
      EXPLORATION_FRACTION,
      CATEGORY_MATHEMATICS,
      EXPLORATION_OBJECTIVE,
      LANGUAGE_ENGLISH,
      true
    );
    await workflow.createAndPublishExploration(
      EXPLORATION_SINGING,
      CATEGORY_MUSIC,
      EXPLORATION_OBJECTIVE2,
      LANGUAGE_ENGLISH,
      false
    );
    await users.logout();

    await users.createUser(
      'learner@learnerDashboard.com', 'learnerLearnerDashboard');
    await users.login('learner@learnerDashboard.com');
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_FRACTION);
    await libraryPage.addSelectedExplorationToPlaylist();
    await newLearnerDashboardPage.get();
    await newLearnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      EXPLORATION_FRACTION);
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_SINGING);
    await libraryPage.addSelectedExplorationToPlaylist();
    await newLearnerDashboardPage.get();
    await newLearnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      EXPLORATION_SINGING);
    await users.logout();
  });

  it('should display correct topics in edit goals, learn something new ' +
  'section, current goals and continue where you left off section',
  async function() {
    var TOPIC_NAME = 'Learner Dashboard Topic 1';
    var TOPIC_URL_FRAGMENT_NAME = 'ld-topic-one';
    var TOPIC_DESCRIPTION = 'Topic description';
    await users.createAndLoginCurriculumAdminUser(
      'creator@learnerDashboard1.com', 'learnerDashboard1');
    var handle = await browser.getWindowHandle();
    await newLearnerDashboardPage.get();
    await newLearnerDashboardPage.navigateToHomeSection();
    await newLearnerDashboardPage.expectNumberOfTopicsInSuggestedForYou(0);
    await newLearnerDashboardPage.navigateToProgressSection();
    await newLearnerDashboardPage.expectNumberOfStoriesInCompletedStory(0);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    await topicsAndSkillsDashboardPage.createTopic(
      TOPIC_NAME, TOPIC_URL_FRAGMENT_NAME, TOPIC_DESCRIPTION, false);
    await topicEditorPage.expectNumberOfStoriesToBe(0);
    await topicEditorPage.createStory(
      'Story Title', 'storyone', 'Story description',
      '../data/test_svg.svg');
    await storyEditorPage.returnToTopic();

    await topicEditorPage.expectNumberOfStoriesToBe(1);
    await topicEditorPage.expectStoryPublicationStatusToBe('No', 0);
    await topicEditorPage.navigateToStoryWithIndex(0);
    await storyEditorPage.updateMetaTagContent('story meta tag');
    await storyEditorPage.saveStory('Added meta tag.');
    await storyEditorPage.publishStory();
    await storyEditorPage.returnToTopic();
    await topicEditorPage.expectStoryPublicationStatusToBe('Yes', 0);

    var url = await browser.getUrl();
    var topicId = url.split('/')[4].slice(0, -1);
    await general.closeCurrentTabAndSwitchTo(handle);
    await adminPage.editConfigProperty(
      'The details for each classroom page.',
      'List',
      async function(elem) {
        elem = await elem.editItem(0, 'Dictionary');
        elem = await elem.editEntry(4, 'List');
        elem = await elem.addItem('Unicode');
        await elem.setValue(topicId);
      });
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    (
      await
      topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
        'Learner Dashboard Skill 1', 'Concept card explanation', false));

    await skillEditorPage.addRubricExplanationForDifficulty(
      'Easy', 'Second explanation for easy difficulty.');
    await skillEditorPage.saveOrPublishSkill('Edited rubrics');
    // A minimum of three questions are required for skill to get assigned in a
    // topic’s diagnostic test.
    await workflow.createQuestion();
    await workflow.createQuestion();
    await workflow.createQuestion();

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(1);
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      'Learner Dashboard Skill 1', TOPIC_NAME);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToTopicWithIndex(0);

    await topicEditorPage.addDiagnosticTestSkill('Learner Dashboard Skill 1');

    await topicEditorPage.addSubtopic(
      'Learner Dashboard Subtopic 1', 'ld-subtopic-one',
      '../data/test2_svg.svg', 'Subtopic content');
    await topicEditorPage.saveTopic('Added subtopic.');

    await topicEditorPage.navigateToTopicEditorTab();

    await topicEditorPage.replacementDragSkillToSubtopic(0);
    await topicEditorPage.saveTopic('Added skill to subtopic.');

    await topicEditorPage.updateMetaTagContent('meta tag content');
    await topicEditorPage.updatePageTitleFragment('fragment');
    await topicEditorPage.saveTopic('Added meta tag and page title fragment.');

    await topicEditorPage.publishTopic();
    /**  There is one topic on the server named Learner Dashboard Topic 1
   * which is linked to a subtopic named Learner Dashboard Subtopic 1
   * and a story called Story Title. Learner Dashboard Subtopic 1 has one
   * skill in it named Learner Dashboard Skill 1.
   */
    await newLearnerDashboardPage.get();
    await newLearnerDashboardPage.navigateToHomeSection();
    await newLearnerDashboardPage.expectNumberOfTopicsInSuggestedForYou(1);
    await newLearnerDashboardPage.
      expectNumberOfTopicsInContinueWhereYouLeftOff(0);
    await newLearnerDashboardPage.navigateToGoalsSection();
    await newLearnerDashboardPage.expectNameOfTopicInEditGoalsToMatch(
      TOPIC_NAME);
    await newLearnerDashboardPage.addTopicToLearnerGoals();
    await newLearnerDashboardPage.navigateToGoalsSection();
    await newLearnerDashboardPage.expectNameOfTopicInCurrentGoalsToMatch(
      `Learn ${TOPIC_NAME}`);
    await newLearnerDashboardPage.navigateToHomeSection();
    await newLearnerDashboardPage.
      expectNumberOfTopicsInContinueWhereYouLeftOff(1);
    await users.logout();
  });

  it('should create a leaner group', async function() {
    var GROUP_TITLE = 'Group Title';
    var GROUP_DESC = 'Group Desc.';
    var STORY_TITLE = 'Story Title';
    var LEARNER_NAME = 'learner1LearnerDashboard';
    await users.createUser(
      'learner1@learnerDashboard.com', 'learner1LearnerDashboard');
    await users.login('learner1@learnerDashboard.com');
    await users.logout();

    await users.login('creator@learnerDashboard1.com');
    // The below lines enable the learner_groups_are_enabled flag in prod mode.
    // They should be removed after the learner_groups_are_enabled flag is
    // deprecated.
    await adminPage.get();
    await adminPage.addRole('learnerDashboard1', 'release coordinator');
    await releaseCoordinatorPage.getFeaturesTab();
    var learnerGroupFlag = (
      await releaseCoordinatorPage.
        getLearnerGroupFeatureElement());
    await releaseCoordinatorPage.enableFeatureForTest(
      learnerGroupFlag);
    await newLearnerDashboardPage.get();
    await newLearnerDashboardPage.getFacilitatorDashboard();
    await newLearnerDashboardPage.addLearnerGroupDetails(
      GROUP_TITLE, GROUP_DESC);
    await newLearnerDashboardPage.addLearnerGroupSyllabus(STORY_TITLE);
    await newLearnerDashboardPage.inviteLearnerGroupLearner(LEARNER_NAME);
    await newLearnerDashboardPage.get();
    await users.logout();
    await users.login('learner1@learnerDashboard.com');
    await newLearnerDashboardPage.acceptLearnerGroupInvitaion();
    await newLearnerDashboardPage.expectlearnerGroupTitleToMatch(GROUP_TITLE);
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
