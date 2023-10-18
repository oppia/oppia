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
 * @fileoverview End-to-end tests for the checkpoint features.
 */

var action = require('../webdriverio_utils/action.js');
var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var workflow = require('../webdriverio_utils/workflow.js');
var waitFor = require('../webdriverio_utils/waitFor.js');

var ReleaseCoordinatorPage = require(
  '../webdriverio_utils/ReleaseCoordinatorPage.js');
var AdminPage = require('../webdriverio_utils/AdminPage.js');
var Constants = require('../webdriverio_utils/WebdriverioConstants.js');
var TopicsAndSkillsDashboardPage =
  require('../webdriverio_utils/TopicsAndSkillsDashboardPage.js');
var TopicAndStoryViewerPage = require(
  '../webdriverio_utils/TopicAndStoryViewerPage.js');
var TopicEditorPage = require('../webdriverio_utils/TopicEditorPage.js');
var StoryEditorPage = require('../webdriverio_utils/StoryEditorPage.js');
var ExplorationEditorPage =
  require('../webdriverio_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../webdriverio_utils/ExplorationPlayerPage.js');
var SkillEditorPage = require('../webdriverio_utils/SkillEditorPage.js');
var DiagnosticTestPage = require('../webdriverio_utils/DiagnosticTestPage.js');

describe('Checkpoints functionality', function() {
  var adminPage = null;
  var releaseCoordinatorPage = null;
  var topicAndStoryViewerPage = null;
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;
  var storyEditorPage = null;
  var explorationPlayerPage = null;
  var dummyExplorationId = '';
  var skillEditorPage = null;

  var createDummyExploration = async function() {
    var EXPLORATION = {
      category: 'English',
      objective: 'The goal is to check checkpoint features functionality.',
      language: 'English'
    };
    await workflow.createAndPublishExplorationWithAdditionalCheckpoints(
      'Exploration - 1',
      EXPLORATION.category,
      EXPLORATION.objective,
      EXPLORATION.language,
      true,
      true
    );
    dummyExplorationId = await general.getExplorationIdFromEditor();
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
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    diagnosticTestPage = new DiagnosticTestPage.DiagnosticTestPage();
    await users.createAndLoginCurriculumAdminUser(
      'creator@storyViewer.com', 'creatorStoryViewer');

    // The below lines enable the checkpoint_celebration flag in prod mode.
    // They should be removed after the checkpoint_celebration flag is
    // deprecated.
    await adminPage.get();
    await adminPage.addRole('creatorStoryViewer', 'release coordinator');
    await releaseCoordinatorPage.getFeaturesTab();
    var checkpointCelebrationFlag = (
      await releaseCoordinatorPage.getCheckpointCelebrationFeatureElement());
    await releaseCoordinatorPage.enableFeature(checkpointCelebrationFlag);

    await createDummyExploration();
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      'Checkpoint features topic', 'topic-cf-one',
      'Description', false);
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
        await action.setValue(
          'Topic ID', elem, topicId, false);
      });

    await browser.url('/classroom-admin/');
    await waitFor.pageToFullyLoad();
    await diagnosticTestPage.createNewClassroomConfig('Math', 'math');
    await diagnosticTestPage.addTopicIdToClassroomConfig(topicId, 0);

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
      'Checkpoint features skill', 'Concept card explanation', false);
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Easy', 'Second explanation for easy difficulty.');
    await skillEditorPage.saveOrPublishSkill('Edited rubrics');
    // A minimum of three questions are required for skill to get assigned in a
    // topic’s diagnostic test.
    await workflow.createQuestion();
    await workflow.createQuestion();
    await workflow.createQuestion();

    await general.closeCurrentTabAndSwitchTo(handle);
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      'Checkpoint features skill', 'Checkpoint features topic');
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic('Checkpoint features topic');
    await topicEditorPage.addDiagnosticTestSkill('Checkpoint features skill');
    await topicEditorPage.addSubtopic(
      'Checkpoint features subtopic', 'subtopic-cf-one',
      Constants.TEST_SVG_PATH, 'Subtopic content');
    await topicEditorPage.addConceptCardToSubtopicExplanation(
      'Checkpoint features skill');
    await topicEditorPage.saveSubtopicExplanation();
    await topicEditorPage.saveTopic('Added subtopic.');
    await topicEditorPage.navigateToTopicEditorTab();
    await topicEditorPage.replacementDragSkillToSubtopic(0);
    await topicEditorPage.saveTopic('Added skill to subtopic.');
    await topicEditorPage.publishTopic();
    await topicsAndSkillsDashboardPage.editTopic('Checkpoint features topic');
    await topicEditorPage.createStory(
      'Checkpoint features story', 'checkpointfeaturesstory',
      'Story description', Constants.TEST_SVG_PATH);
    await storyEditorPage.updateMetaTagContent('story meta tag');
    await storyEditorPage.createNewChapter(
      'Checkpoint features story', dummyExplorationId, Constants.TEST_SVG_PATH);
    await storyEditorPage.navigateToChapterWithName(
      'Checkpoint features story');
    await storyEditorPage.changeNodeDescription('Chapter description');
    await storyEditorPage.changeNodeOutline(
      await forms.toRichText('node outline'));
    await storyEditorPage.navigateToStoryEditorTab();
    await storyEditorPage.saveStory('Added chapter');
    await storyEditorPage.publishStory();
    await users.logout();
  });

  it('should display checkpoint progress modal upon completing a checkpoint',
    async function() {
      await topicAndStoryViewerPage.get(
        'math', 'topic-cf-one', 'checkpointfeaturesstory');
      await topicAndStoryViewerPage.expectCompletedLessonCountToBe(0);

      await topicAndStoryViewerPage.goToChapterIndex(0);
      await explorationPlayerPage.submitAnswer('Continue', null);
      await explorationPlayerPage.dismissLessonInfoTooltip();
      await explorationPlayerPage.submitAnswer('Continue', null);

      await explorationPlayerPage
        .expectCongratulatoryCheckpointMessageToAppear();
      await explorationPlayerPage
        .expectCheckpointProgressMessageToBeDisplayedOnLessonInfoModal();
      await explorationPlayerPage
        .expectCongratulatoryCheckpointMessageToDisappear();
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
