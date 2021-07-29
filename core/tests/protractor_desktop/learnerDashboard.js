// Copyright 2018 The Oppia Authors. All Rights Reserved.
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

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var TopicsAndSkillsDashboardPage =
  require('../protractor_utils/TopicsAndSkillsDashboardPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LearnerDashboardPage =
  require('../protractor_utils/LearnerDashboardPage.js');
var AdminPage = require('../protractor_utils/AdminPage.js');
var TopicEditorPage = require('../protractor_utils/TopicEditorPage.js');
var StoryEditorPage = require('../protractor_utils/StoryEditorPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var SubscriptionDashboardPage =
  require('../protractor_utils/SubscriptionDashboardPage.js');
var TopicAndStoryViewerPage = require(
  '../protractor_utils/TopicAndStoryViewerPage.js');
var forms = require('../protractor_utils/forms.js');
const { browser } = require('protractor');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var Constants = require('../protractor_utils/ProtractorConstants.js');
var SkillEditorPage = require('../protractor_utils/SkillEditorPage.js');

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
      category: 'Learning',
      objective: 'The goal is to check story viewer functionality.',
      language: 'English'
    };

    for (var i = 1; i <= 3; i++) {
      await workflow.createAndPublishTwoCardExploration(
        `Exploration TASV1 - ${i}`,
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
  });

  it('should display learners subscriptions', async function() {
    var driver = browser.driver;
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
    await subscriptionDashboardPage.navigateToSubscriptionButton();
    await subscriptionDashboardPage.navigateToUserSubscriptionPage(creator2Id);
    await subscriptionDashboardPage.navigateToSubscriptionButton();

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
    await driver.findElement(
      by.css('.protractor-test-subscriptions-section'));
    // The last user (creatorName) that learner subsribes to is placed first
    // in the list.
    await learnerDashboardPage.expectSubscriptionFirstNameToMatch('creator...');
    // The first user (collectionAdm) that learner subscribes to is placed
    // last in the list.
    await learnerDashboardPage.expectSubscriptionLastNameToMatch('collect...');
    await users.logout();
  });

  it('should display learner feedback threads', async function() {
    await users.createUser(
      'learner2@learnerDashboard.com', 'learner2learnerDashboard');
    await users.createUser(
      'feedbackAdm@learnerDashboard.com', 'feedbackAdmlearnerDashboard');
    await users.login('feedbackAdm@learnerDashboard.com');
    await workflow.createAndPublishExploration(
      'BUS101',
      'Business',
      'Learn about different business regulations around the world.',
      'English',
      true
    );
    await users.logout();

    await users.login('learner2@learnerDashboard.com');
    var feedback = 'A good exploration. Would love to see a few more questions';
    await libraryPage.get();
    await libraryPage.findExploration('BUS101');
    await libraryPage.playExploration('BUS101');
    await explorationPlayerPage.submitFeedback(feedback);

    // Verify feedback thread is created.
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToFeedbackSection();
    await learnerDashboardPage.expectFeedbackExplorationTitleToMatch('BUS101');
    await learnerDashboardPage.navigateToFeedbackThread();
    await learnerDashboardPage.expectFeedbackMessageToMatch(feedback);
    await users.logout();
  });

  it('should add exploration to play later list', async function() {
    var driver = browser.driver;
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
    await driver.findElement(
      by.css('.protractor-test-play-later-section'));
    await learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      EXPLORATION_FRACTION);
    await libraryPage.get();
    await libraryPage.findExploration(EXPLORATION_SINGING);
    await libraryPage.addSelectedExplorationToPlaylist();
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToCommunityLessonsSection();
    await driver.findElement(
      by.css('.protractor-test-play-later-section'));
    await learnerDashboardPage.expectTitleOfExplorationSummaryTileToMatch(
      EXPLORATION_SINGING);
    await users.logout();
  });

  it('should display all the topics on server in edit goals and suggested ' +
    'for you section and selected topics in current goals and continue where ' +
    'you left off section', async function() {
    var driver = browser.driver;
    var TOPIC_NAME = 'Topic 1';
    var TOPIC_URL_FRAGMENT_NAME = 'topic-one';
    var TOPIC_DESCRIPTION = 'Topic description';
    await users.createAndLoginCurriculumAdminUser(
      'creator@learnerDashboard1.com', 'learnerDashboard1');
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      TOPIC_NAME, TOPIC_URL_FRAGMENT_NAME, TOPIC_DESCRIPTION, false);
    await topicEditorPage.expectNumberOfStoriesToBe(0);
    await topicEditorPage.createStory(
      'Story Title', 'story-one', 'Story description',
      '../data/test_svg.svg');
    await storyEditorPage.returnToTopic();

    await topicEditorPage.expectNumberOfStoriesToBe(1);
    await topicEditorPage.expectStoryPublicationStatusToBe('No', 0);
    await topicEditorPage.navigateToStoryWithIndex(0);
    await storyEditorPage.updateMetaTagContent('story meta tag');
    await storyEditorPage.saveStory('Added thumbnail.');
    await storyEditorPage.publishStory();
    await storyEditorPage.returnToTopic();
    await topicEditorPage.expectStoryPublicationStatusToBe('Yes', 0);

    var url = await browser.getCurrentUrl();
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
    (
      await
      topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
        'Skill 1', 'Concept card explanation', false));
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      'Skill 1', 'Topic 1');
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToTopicWithIndex(0);
    await topicEditorPage.addSubtopic(
      'Subtopic 1', 'subtopic-one', '../data/test2_svg.svg',
      'Subtopic content');
    await topicEditorPage.saveTopic('Added subtopic.');

    await topicEditorPage.navigateToTopicEditorTab();
    await topicEditorPage.navigateToReassignModal();

    await topicEditorPage.dragSkillToSubtopic('Skill 1', 0);
    await topicEditorPage.saveRearrangedSkills();
    await topicEditorPage.saveTopic('Added skill to subtopic.');

    await topicEditorPage.updateMetaTagContent('meta tag content');
    await topicEditorPage.updatePageTitleFragment('fragment');
    await topicEditorPage.saveTopic('Added meta tag.');

    await topicEditorPage.publishTopic();
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToHomeSection();
    await learnerDashboardPage.expectCountOfTopicInSuggestedForYou(1);
    await learnerDashboardPage.navigateToGoalsSection();
    await driver.findElement(
      by.css('.protractor-test-edit-goals-section'));
    await learnerDashboardPage.expectNameOfTopicInEditGoalsToMatch(
      TOPIC_NAME);
    await driver.findElement(By.css(
      '.protractor-test-add-topic-to-current-goals-button')).click();
    await learnerDashboardPage.navigateToGoalsSection();
    await learnerDashboardPage.expectNameOfTopicInCurrentGoalsToMatch(
      `Learn ${TOPIC_NAME}`);
    await learnerDashboardPage.navigateToHomeSection();
    await learnerDashboardPage.expectCountOfTopicInContinueWhereYouLeftOff(1);
    await users.logout();
  });

  it('should display all the topics on that are partially learnt or learnt ' +
    'in skill proficiency section', async function() {
    await users.createAndLoginCurriculumAdminUser(
      'creator@learnerDashboard2.com', 'learnerDashboard2');
    await createDummyExplorations();
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      'Topic TASV1', 'topic-tasv-one', 'Description', false);
    var url = await browser.getCurrentUrl();
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
    await topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      'Skill TASV1', 'Concept card explanation', false);
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Easy', 'Second explanation for easy difficulty.');
    await skillEditorPage.saveOrPublishSkill('Edited rubrics');
    var url = await browser.getCurrentUrl();
    skillId = url.split('/')[4];
    await skillEditorPage.get(skillId);

    await skillEditorPage.moveToQuestionsTab();
    await skillEditorPage.clickCreateQuestionButton();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Question 1'));
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
    await general.closeCurrentTabAndSwitchTo(handle);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      'Skill TASV1', 'Topic TASV1');
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic('Topic TASV1');
    await topicEditorPage.addSubtopic(
      'Subtopic TASV1', 'subtopic-tasv-one', Constants.TEST_SVG_PATH,
      'Subtopic content');
    await topicEditorPage.saveTopic('Added subtopic.');
    await topicEditorPage.navigateToTopicEditorTab();
    await topicEditorPage.navigateToReassignModal();
    await topicEditorPage.dragSkillToSubtopic('Skill TASV1', 0);
    await topicEditorPage.saveRearrangedSkills();
    await topicEditorPage.saveTopic('Added skill to subtopic.');
    await topicEditorPage.updateMetaTagContent('topic meta tag');
    await topicEditorPage.updatePageTitleFragment('topic page title');
    await topicEditorPage.togglePracticeTab();
    await topicEditorPage.saveTopic('Added thumbnail.');
    await topicEditorPage.publishTopic();
    await topicsAndSkillsDashboardPage.editTopic('Topic TASV1');
    await topicEditorPage.createStory(
      'Story TASV1', 'story-player-tasv-one', 'Story description',
      Constants.TEST_SVG_PATH);
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
    await storyEditorPage.saveStory('First save');
    await storyEditorPage.publishStory();
    await topicAndStoryViewerPage.get(
      'math', 'topic-tasv-one', 'story-player-tasv-one');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(0);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(3);
    await topicAndStoryViewerPage.goToChapterIndex(0);
    await explorationPlayerPage.submitAnswer('Continue', null);
    await topicAndStoryViewerPage.get(
      'math', 'topic-tasv-one', 'story-player-tasv-one');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(1);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(2);
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToProgressSection();
    await learnerDashboardPage.expectNameOfTopicInSkillProficiencyToMatch(
      'Topic TASV1'
    );
    await users.logout();
  });

  it('should display all the completed stories in Completed stories section ' +
    'and completed topics in Completed goals section', async function() {
    await users.createAndLoginCurriculumAdminUser(
      'creator@learnerDashboard3.com', 'learnerDashboard3');
    await createDummyExplorations();
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      'Topic TASV2', 'topic-tasv-two', 'Description', false);
    var url = await browser.getCurrentUrl();
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
    await topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      'Skill TASV2', 'Concept card explanation', false);
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Easy', 'Second explanation for easy difficulty.');
    await skillEditorPage.saveOrPublishSkill('Edited rubrics');
    var url = await browser.getCurrentUrl();
    skillId = url.split('/')[4];
    await skillEditorPage.get(skillId);

    await skillEditorPage.moveToQuestionsTab();
    await skillEditorPage.clickCreateQuestionButton();
    await explorationEditorMainTab.setContent(
      await forms.toRichText('Question 1'));
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
    await general.closeCurrentTabAndSwitchTo(handle);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      'Skill TASV2', 'Topic TASV2');
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic('Topic TASV2');
    await topicEditorPage.addSubtopic(
      'Subtopic TASV2', 'subtopic-tasv-two', Constants.TEST_SVG_PATH,
      'Subtopic content');
    await topicEditorPage.saveTopic('Added subtopic.');
    await topicEditorPage.navigateToTopicEditorTab();
    await topicEditorPage.navigateToReassignModal();
    await topicEditorPage.dragSkillToSubtopic('Skill TASV2', 0);
    await topicEditorPage.saveRearrangedSkills();
    await topicEditorPage.saveTopic('Added skill to subtopic.');
    await topicEditorPage.updateMetaTagContent('topic meta tag');
    await topicEditorPage.updatePageTitleFragment('topic page title');
    await topicEditorPage.togglePracticeTab();
    await topicEditorPage.saveTopic('Added thumbnail.');
    await topicEditorPage.publishTopic();
    await topicsAndSkillsDashboardPage.editTopic('Topic TASV2');
    await topicEditorPage.createStory(
      'Story TASV2', 'story-player-tasv-two', 'Story description',
      Constants.TEST_SVG_PATH);
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
    await storyEditorPage.saveStory('First save');
    await storyEditorPage.publishStory();
    await topicAndStoryViewerPage.get(
      'math', 'topic-tasv-two', 'story-player-two');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(0);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(3);
    await topicAndStoryViewerPage.goToChapterIndex(0);
    await explorationPlayerPage.submitAnswer('Continue', null);
    await topicAndStoryViewerPage.get(
      'math', 'topic-tasv-two', 'story-player-tasv-two');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(1);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(2);
    await topicAndStoryViewerPage.goToChapterIndex(1);
    await explorationPlayerPage.submitAnswer('Continue', null);
    await topicAndStoryViewerPage.get(
      'math', 'topic-tasv-two', 'story-player-tasv-two');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(2);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(1);
    await topicAndStoryViewerPage.goToChapterIndex(2);
    await explorationPlayerPage.submitAnswer('Continue', null);
    await topicAndStoryViewerPage.get(
      'math', 'topic-tasv-two', 'story-player-tasv-two');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(3);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(0);
    await learnerDashboardPage.get();
    await learnerDashboardPage.navigateToProgressSection();
    await learnerDashboardPage.expectCountOfStoryInCompletedStory(1);
    await learnerDashboardPage.navigateToGoalsSection();
    await learnerDashboardPage.expectNameOfTopicInCompletedGoalsToMatch(
      'Topic TASV2');
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
