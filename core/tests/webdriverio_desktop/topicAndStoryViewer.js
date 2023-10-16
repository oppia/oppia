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
 * @fileoverview End-to-end tests for the story viewer.
 */

var action = require('../webdriverio_utils/action.js');
var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');

var ReleaseCoordinatorPage = require(
  '../webdriverio_utils/ReleaseCoordinatorPage.js');
var AdminPage = require('../webdriverio_utils/AdminPage.js');
var Constants = require('../webdriverio_utils/WebdriverioConstants.js');
var TopicsAndSkillsDashboardPage =
  require('../webdriverio_utils/TopicsAndSkillsDashboardPage.js');
var TopicAndStoryViewerPage = require(
  '../webdriverio_utils/TopicAndStoryViewerPage.js');
var TopicViewerPage = require('../webdriverio_utils/TopicViewerPage.js');
var TopicEditorPage = require('../webdriverio_utils/TopicEditorPage.js');
var StoryEditorPage = require('../webdriverio_utils/StoryEditorPage.js');
var SubTopicViewerPage = require('../webdriverio_utils/SubTopicViewerPage.js');
var ExplorationEditorPage =
  require('../webdriverio_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../webdriverio_utils/ExplorationPlayerPage.js');
var SkillEditorPage = require('../webdriverio_utils/SkillEditorPage.js');
var DiagnosticTestPage = require('../webdriverio_utils/DiagnosticTestPage.js');

describe('Topic and Story viewer functionality', function() {
  var adminPage = null;
  var releaseCoordinatorPage = null;
  var topicAndStoryViewerPage = null;
  var topicViewerPage = null;
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;
  var storyEditorPage = null;
  var subTopicViewerPage = null;
  var explorationPlayerPage = null;
  var dummyExplorationIds = [];
  var skillId = null;
  var skillEditorPage = null;

  var createDummyExplorations = async function() {
    var EXPLORATION = {
      category: 'English',
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

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    releaseCoordinatorPage = (
      new ReleaseCoordinatorPage.ReleaseCoordinatorPage());
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    topicAndStoryViewerPage = (
      new TopicAndStoryViewerPage.TopicAndStoryViewerPage());
    topicViewerPage = new TopicViewerPage.TopicViewerPage();
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    subTopicViewerPage = new SubTopicViewerPage.SubTopicViewerPage();
    diagnosticTestPage = new DiagnosticTestPage.DiagnosticTestPage();
    await users.createAndLoginCurriculumAdminUser(
      'creator@storyViewer.com', 'creatorStoryViewer');

    // The below lines enable the end_chapter_celebration flag in prod mode.
    // They should be removed after the end_chapter_celebration flag is
    // deprecated.
    await adminPage.get();
    await adminPage.addRole('creatorStoryViewer', 'release coordinator');
    await releaseCoordinatorPage.getFeaturesTab();
    var endChapterFlag = (
      await releaseCoordinatorPage.getEndChapterCelebrationFeatureElement());
    await releaseCoordinatorPage.enableFeature(endChapterFlag);

    await createDummyExplorations();
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      'Topic TASV1', 'topic-tasv-one', 'Description', false);
    await topicEditorPage.submitTopicThumbnail(Constants.TEST_SVG_PATH, true);
    await topicEditorPage.updateMetaTagContent('topic meta tag');
    await topicEditorPage.updatePageTitleFragment('topic page title');
    await topicEditorPage.saveTopic('Added thumbnail.');
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
    await topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      'Skill TASV1', 'Concept card explanation', false);
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

    await general.closeCurrentTabAndSwitchTo(handle);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      'Skill TASV1', 'Topic TASV1');
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic('Topic TASV1');
    await topicEditorPage.togglePracticeTab();
    await topicEditorPage.addDiagnosticTestSkill('Skill TASV1');
    await topicEditorPage.addSubtopic(
      'Subtopic TASV1', 'subtopic-tasv-one', Constants.TEST_SVG_PATH,
      'Subtopic content');
    await topicEditorPage.addConceptCardToSubtopicExplanation('Skill TASV1');
    await topicEditorPage.saveSubtopicExplanation();
    await topicEditorPage.saveTopic('Added subtopic.');
    await topicEditorPage.navigateToTopicEditorTab();
    await topicEditorPage.replacementDragSkillToSubtopic(0);
    await topicEditorPage.saveTopic('Added skill to subtopic.');
    await topicEditorPage.publishTopic();
    await topicsAndSkillsDashboardPage.editTopic('Topic TASV1');
    await topicEditorPage.createStory(
      'Story TASV1', 'storyplayertasvone', 'Story description',
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
    await users.logout();
  });

  it('should play through story and save progress on login.', async function() {
    await topicAndStoryViewerPage.get(
      'math', 'topic-tasv-one', 'storyplayertasvone');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(0);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(3);
    await topicAndStoryViewerPage.goToChapterIndex(0);
    await explorationPlayerPage.submitAnswer('Continue', null);

    // Signing up with the login button should redirect the user back to the
    // exploration.
    var loginButton = $('.e2e-test-login-button');
    await action.click('Login button', loginButton);
    await users.createAndLoginUser(
      'newStoryViewer@storyviewer.com', 'newStoryViewer', false);

    await explorationPlayerPage.submitAnswer('Continue', null);
    await topicAndStoryViewerPage.get(
      'math', 'topic-tasv-one', 'storyplayertasvone');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(2);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(1);
    await users.logout();
  });

  it('should dismiss sign-up section and load practice session page upon' +
  'clicking the practice session card on the last state.', async function() {
    await topicAndStoryViewerPage.get(
      'math', 'topic-tasv-one', 'storyplayertasvone');

    await topicAndStoryViewerPage.goToChapterIndex(0);
    await explorationPlayerPage.submitAnswer('Continue', null);

    await topicAndStoryViewerPage.waitForSignUpSection();
    await topicAndStoryViewerPage.dismissSignUpSection();
    await topicAndStoryViewerPage.waitForSignUpSectionToDisappear();

    await waitFor.clientSideRedirection(async() => {
      // Click the practice session card to trigger redirection.
      await topicAndStoryViewerPage.goToPracticeSessionFromRecommendations();
    }, (url) => {
      // Wait until the URL has changed to that of the practice tab.
      return (/practice/.test(url));
    }, async() => {
      // Wait until the practice tab is loaded.
      await topicAndStoryViewerPage.waitForPracticeTabContainer();
    });
  });

  it('should load the next chapter upon clicking the next chapter ' +
    'card on the last state.',
  async function() {
    await topicAndStoryViewerPage.get(
      'math', 'topic-tasv-one', 'storyplayertasvone');

    await topicAndStoryViewerPage.goToChapterIndex(0);
    await explorationPlayerPage.submitAnswer('Continue', null);

    await waitFor.clientSideRedirection(async() => {
      // Click the next chapter card to trigger redirection.
      await topicAndStoryViewerPage.goToNextChapterFromRecommendations();
    }, (url) => {
      // Wait until the URL has changed to that of the next chapter.
      return (/node_id=node_2/.test(url));
    }, async() => {
      // Wait until the conversation-skin of the next chapter is loaded.
      await topicAndStoryViewerPage.waitForConversationSkinCardsContainer();
    });
  });

  it(
    'should check for topic description, stories and revision cards',
    async function() {
      await users.createAndLoginCurriculumAdminUser(
        'creator1@storyViewer.com', 'creatorStoryViewer1');
      await topicViewerPage.get('math', 'Topic TASV1');
      await topicViewerPage.expectTopicInformationToBe('Description');
      await topicViewerPage.expectStoryCountToBe(1);
      await topicViewerPage.moveToRevisionTab();
      await subTopicViewerPage.expectRevisionCardCountToBe(1);
      await subTopicViewerPage.get('Subtopic TASV1');
      await subTopicViewerPage.expectConceptCardCountToBe(1);
      await subTopicViewerPage.getConceptCard();
      await subTopicViewerPage.expectConceptCardInformationToBe(
        'Concept card explanation');
      await skillEditorPage.get(skillId);
      await workflow.createQuestion();
      await skillEditorPage.get(skillId);
      await skillEditorPage.moveToQuestionsTab();
      await topicViewerPage.get('math', 'Topic TASV1');
      await topicViewerPage.moveToPracticeTab();
      await topicViewerPage.selectSkillForPractice('Subtopic TASV1');

      await waitFor.clientSideRedirection(async() => {
        // Start practice to trigger redirection to practice session page.
        await topicViewerPage.startPractice();
      }, (url) => {
        // Wait until the URL has changed to /practice.
        return (/practice/.test(url));
      }, async() => {
        await topicAndStoryViewerPage.waitForPracticeSessionContainer();
      });

      for (let i = 0; i < 10; i++) {
        await explorationPlayerPage.submitAnswer('TextInput', 'correct');
        await explorationPlayerPage.clickThroughToNextCard();
      }
      await topicViewerPage.expectMessageAfterCompletion(
        'Session complete. Well done!'
      );
      await users.logout();
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
