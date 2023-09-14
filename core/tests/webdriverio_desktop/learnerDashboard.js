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
 * @fileoverview End-to-end tests for the learner dashboard page.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');
var waitFor = require('../webdriverio_utils/waitFor.js');

var TopicsAndSkillsDashboardPage =
  require('../webdriverio_utils/TopicsAndSkillsDashboardPage.js');
var ExplorationPlayerPage =
  require('../webdriverio_utils/ExplorationPlayerPage.js');
var LearnerDashboardPage =
  require('../webdriverio_utils/LearnerDashboardPage.js');
var AdminPage = require('../webdriverio_utils/AdminPage.js');
var TopicEditorPage = require('../webdriverio_utils/TopicEditorPage.js');
var StoryEditorPage = require('../webdriverio_utils/StoryEditorPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');
var SubscriptionDashboardPage =
  require('../webdriverio_utils/SubscriptionDashboardPage.js');
var TopicAndStoryViewerPage = require(
  '../webdriverio_utils/TopicAndStoryViewerPage.js');
var forms = require('../webdriverio_utils/forms.js');
var ExplorationEditorPage =
  require('../webdriverio_utils/ExplorationEditorPage.js');
var Constants = require('../webdriverio_utils/WebdriverioConstants.js');
var SkillEditorPage = require('../webdriverio_utils/SkillEditorPage.js');
var DiagnosticTestPage = require('../webdriverio_utils/DiagnosticTestPage.js');

describe('Learner dashboard functionality', function() {
  var explorationPlayerPage = null;
  var topicsAndSkillsDashboardPage = null;
  var adminPage = null;
  var libraryPage = null;
  var topicEditorPage = null;
  var storyEditorPage = null;
  var topicAndStoryViewerPage = null;
  var explorationEditorMainTab = null;
  var learnerDashboardPage = null;
  var subscriptionDashboardPage = null;
  var skillEditorPage = null;
  var dummyExplorationIds = [];

  var createDummyExplorations = async function() {
    var EXPLORATION = {
      category: 'Biology',
      objective: 'The goal is to check story viewer functionality.',
      language: 'English'
    };

    for (var i = 1; i <= 3; i++) {
      await workflow.createAndPublishTwoCardExploration(
        `Learner Dashboard Exploration ${i}`,
        EXPLORATION.category,
        EXPLORATION.objective,
        EXPLORATION.language,
        i === 1,
        true
      );
      dummyExplorationIds.push(await general.getExplorationIdFromEditor());
    }
  };

  beforeAll(function() {
    libraryPage = new LibraryPage.LibraryPage();
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    adminPage = new AdminPage.AdminPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    learnerDashboardPage = new LearnerDashboardPage.LearnerDashboardPage();
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    topicAndStoryViewerPage = (
      new TopicAndStoryViewerPage.TopicAndStoryViewerPage());
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    subscriptionDashboardPage =
      new SubscriptionDashboardPage.SubscriptionDashboardPage();
    diagnosticTestPage = new DiagnosticTestPage.DiagnosticTestPage();
  });

  it('should display learners subscriptions', async function() {
    await users.createUser(
      'learner1@learnerDashboard.com', 'learner1learnerDashboard');
    var creator1Id = 'creatorName';
    await users.createUser(creator1Id + '@learnerDashboard.com', creator1Id);
    var creator2Id = 'collectionAdm';
    await users.createUser(
      creator2Id + '@learnerDashboard.com', creator2Id);
    await users.login(creator1Id + '@learnerDashboard.com');
    await workflow.createAndPublishExploration(
      'Activations',
      'Chemistry',
      'Learn about different types of chemistry activations.',
      'English',
      true
    );
    await users.logout();

    await users.login('learner1@learnerDashboard.com');
    // Subscribe to both the creators.
    await subscriptionDashboardPage.navigateToUserSubscriptionPage(creator1Id);
    await subscriptionDashboardPage.clickSubscribeButton();
    await subscriptionDashboardPage.navigateToUserSubscriptionPage(creator2Id);
    await subscriptionDashboardPage.clickSubscribeButton();

    // Completing exploration 'Activations' to activate /learner_dashboard.
    await libraryPage.get();
    await libraryPage.findExploration('Activations');
    await libraryPage.playExploration('Activations');
    await explorationPlayerPage.expectExplorationNameToBe('Activations');
    await explorationPlayerPage.rateExploration(4);

    // Both creators should be present in the subscriptions section of the
    // dashboard.
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToCommunityLessonsSection();
    // The last user (creatorName) that learner subsribes to is placed first
    // in the list.
    await learnerDashboardPage.expectSubscriptionFirstNameToMatch(
      'creator...');
    // The first user (collectionAdm) that learner subscribes to is placed
    // last in the list.
    await learnerDashboardPage.expectSubscriptionLastNameToMatch('collect...');
    await users.logout();
  });

  it('should add exploration to play later list', async function() {
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
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToCommunityLessonsSection();
    await learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      EXPLORATION_FRACTION);
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_SINGING);
    await libraryPage.addSelectedExplorationToPlaylist();
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToCommunityLessonsSection();
    await learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
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
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToHomeSection();
    await learnerDashboardPage.expectNumberOfTopicsInSuggestedForYou(0);
    await learnerDashboardPage.navigateToProgressSection();
    await learnerDashboardPage.expectNumberOfStoriesInCompletedStory(0);
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
    await browser.url('/classroom-admin/');
    await waitFor.pageToFullyLoad();
    await diagnosticTestPage.createNewClassroomConfig('Math', 'math');
    await diagnosticTestPage.addTopicIdToClassroomConfig(topicId, 0);
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
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToHomeSection();
    await learnerDashboardPage.expectNumberOfTopicsInSuggestedForYou(1);
    await learnerDashboardPage.expectNumberOfTopicsInContinueWhereYouLeftOff(0);
    await learnerDashboardPage.navigateToGoalsSection();
    await learnerDashboardPage.expectNameOfTopicInEditGoalsToMatch(
      TOPIC_NAME);
    await learnerDashboardPage.addTopicToLearnerGoals();
    await learnerDashboardPage.navigateToGoalsSection();
    await learnerDashboardPage.expectNameOfTopicInCurrentGoalsToMatch(
      `Learn ${TOPIC_NAME}`);
    await learnerDashboardPage.navigateToHomeSection();
    await learnerDashboardPage.expectNumberOfTopicsInContinueWhereYouLeftOff(1);
    await users.logout();
  });

  it('should display all the topics that are partially learnt or learnt ' +
    'in skill proficiency section, learnt topics in completed goals section ' +
    'and completed stories in completed stories section', async function() {
    var TOPIC_NAME = 'Learner Dashboard Topic 2';
    var TOPIC_URL_FRAGMENT_NAME = 'ld-topic-two';
    var TOPIC_DESCRIPTION = 'Topic description';
    await users.createAndLoginCurriculumAdminUser(
      'creator@learnerDashboard2.com', 'learnerDashboard2');
    await createDummyExplorations();
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    await topicsAndSkillsDashboardPage.createTopic(
      TOPIC_NAME, TOPIC_URL_FRAGMENT_NAME, TOPIC_DESCRIPTION, false);
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
    await browser.url('/classroom-admin/');
    await waitFor.pageToFullyLoad();
    await diagnosticTestPage.addTopicIdToClassroomConfig(topicId, 0);

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(2);
    await topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      'Learner Dashboard Skill 2', 'Concept card explanation', false);
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Easy', 'Second explanation for easy difficulty.');
    await skillEditorPage.saveOrPublishSkill('Edited rubrics');
    var url = await browser.getUrl();
    skillId = url.split('/')[4];
    await skillEditorPage.get(skillId);

    for (let i = 0; i < 10; i++) {
      await skillEditorPage.moveToQuestionsTab();
      await skillEditorPage.clickCreateQuestionButton();
      await explorationEditorMainTab.setContent(
        await forms.toRichText('Question 1'), true);
      await explorationEditorMainTab.setInteraction(
        'TextInput', 'Placeholder', 5);
      await explorationEditorMainTab.addResponse(
        'TextInput', await forms.toRichText('Correct Answer'), null, false,
        'FuzzyEquals', ['correct']);
      var responseEditor = await explorationEditorMainTab.getResponseEditor(0);
      await responseEditor.markAsCorrect();
      await (
        await explorationEditorMainTab.getResponseEditor('default')
      ).setFeedback(await forms.toRichText('Try again'));
      await explorationEditorMainTab.addHint('Hint 1');
      await explorationEditorMainTab.addSolution('TextInput', {
        correctAnswer: 'correct',
        explanation: 'It is correct'
      });
      await skillEditorPage.saveQuestion();
      await skillEditorPage.get(skillId);
    }

    await skillEditorPage.moveToQuestionsTab();
    await skillEditorPage.expectNumberOfQuestionsToBe(10);
    await general.closeCurrentTabAndSwitchTo(handle);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(2);
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      'Learner Dashboard Skill 2', TOPIC_NAME);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic(TOPIC_NAME);
    await topicEditorPage.addDiagnosticTestSkill('Learner Dashboard Skill 2');
    await topicEditorPage.addSubtopic(
      'Learner Dashboard Subtopic 2', 'ld-subtopic-two',
      Constants.TEST_SVG_PATH, 'Subtopic content');
    await topicEditorPage.saveTopic('Added subtopic.');
    await topicEditorPage.navigateToTopicEditorTab();
    await topicEditorPage.replacementDragSkillToSubtopic(0);
    await topicEditorPage.saveTopic('Added skill to subtopic.');
    await topicEditorPage.updateMetaTagContent('topic meta tag');
    await topicEditorPage.updatePageTitleFragment('topic page title');
    await topicEditorPage.togglePracticeTab();
    await topicEditorPage.saveTopic('Added meta tag and page title fragment.');
    await topicEditorPage.publishTopic();
    await topicsAndSkillsDashboardPage.editTopic(TOPIC_NAME);
    await topicEditorPage.expectNumberOfStoriesToBe(0);
    await topicEditorPage.createStory(
      'Story 2', 'storytwo',
      'Story description', Constants.TEST_SVG_PATH);
    await storyEditorPage.updateMetaTagContent('story meta tag');
    for (var i = 0; i < 3; i++) {
      await storyEditorPage.createNewChapter(
        `Chapter ${i}`, dummyExplorationIds[i], Constants.TEST_SVG_PATH);
      await storyEditorPage.navigateToChapterWithName(`Chapter ${i}`);
      await storyEditorPage.changeNodeDescription('Chapter description');
      await storyEditorPage.changeNodeOutline(
        await forms.toRichText(`outline ${i}`));
      await storyEditorPage.navigateToStoryEditorTab();
    }
    await storyEditorPage.expectNumberOfChaptersToBe(3);
    await storyEditorPage.saveStory('First save');
    await storyEditorPage.publishStory();
    await storyEditorPage.returnToTopic();
    await topicEditorPage.expectNumberOfStoriesToBe(1);
    await topicAndStoryViewerPage.get(
      'math', TOPIC_URL_FRAGMENT_NAME, 'storytwo');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(0);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(3);
    await topicAndStoryViewerPage.goToChapterIndex(0);
    await explorationPlayerPage.submitAnswer('Continue', null);
    await topicAndStoryViewerPage.get(
      'math', TOPIC_URL_FRAGMENT_NAME, 'storytwo');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(1);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(2);
    await topicAndStoryViewerPage.goToChapterIndex(1);
    await explorationPlayerPage.submitAnswer('Continue', null);
    await topicAndStoryViewerPage.get(
      'math', TOPIC_URL_FRAGMENT_NAME, 'storytwo');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(2);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(1);
    await topicAndStoryViewerPage.goToChapterIndex(2);
    await explorationPlayerPage.submitAnswer('Continue', null);
    /**  There are two topics on the server named Learner Dashboard Topic 1
     * which is linked to a subtopic named Learner Dashboard Subtopic 1 and
     * a story called Story Title and Learner Dashboard Topic 2 which is linked
     * to a subtopic named Learner Dashboard Subtopic 2 and a story called
     * Story 2. Learner Dashboard Subtopic 1 has one skill in it named
     * Learner Dashboard Skill 1 and Learner Dashboard Subtopic 2 has one
     * skill in it named Learner Dashboard Skill 2.
    */
    await topicAndStoryViewerPage.get(
      'math', TOPIC_URL_FRAGMENT_NAME, 'storytwo');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(3);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(0);
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToProgressSection();
    await learnerDashboardPage.expectNameOfTopicInSkillProficiencyToMatch(
      TOPIC_NAME
    );
    await learnerDashboardPage.navigateToProgressSection();
    await learnerDashboardPage.expectNumberOfStoriesInCompletedStory(1);
    await learnerDashboardPage.navigateToGoalsSection();
    await learnerDashboardPage.expectNameOfTopicInCompletedGoalsToMatch(
      TOPIC_NAME);
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
