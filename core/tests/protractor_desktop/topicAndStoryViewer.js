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
 * @fileoverview End-to-end tests for the story viewer.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var Constants = require('../protractor_utils/ProtractorConstants.js');
var TopicsAndSkillsDashboardPage =
  require('../protractor_utils/TopicsAndSkillsDashboardPage.js');
var TopicAndStoryViewerPage = require(
  '../protractor_utils/TopicAndStoryViewerPage.js');
var TopicEditorPage = require('../protractor_utils/TopicEditorPage.js');
var StoryEditorPage = require('../protractor_utils/StoryEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');

describe('Story viewer functionality', function() {
  var adminPage = null;
  var topicAndStoryViewerPage = null;
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;
  var storyEditorPage = null;
  var explorationPlayerPage = null;
  var dummyExplorationIds = [];

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    topicAndStoryViewerPage = (
      new TopicAndStoryViewerPage.TopicAndStoryViewerPage());
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
  });

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
        true
      );
      dummyExplorationIds.push(await general.getExplorationIdFromEditor());
    }
  };

  it('should save story progress on login.', async function() {
    await users.createAndLoginAdminUser(
      'creator@storyViewer.com', 'creatorStoryViewer');
    await adminPage.editConfigProperty(
      'Make classroom page accessible.',
      'Boolean', async function(elem) {
        await elem.setValue(true);
      });
    await createDummyExplorations();
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      'Topic TASV1', 'topic-tasv-one', 'Description', false);
    await topicEditorPage.submitTopicThumbnail(Constants.TEST_SVG_PATH, true);
    await topicEditorPage.updateMetaTagContent('topic meta tag');
    await topicEditorPage.updatePageTitleFragment('topic page title');
    await topicEditorPage.saveTopic('Added thumbnail.');
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
        'Skill TASV1', 'Concept card explanation', false));
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
    await users.logout();
    await topicAndStoryViewerPage.get(
      'math', 'topic-tasv-one', 'story-player-tasv-one');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(0);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(3);
    await topicAndStoryViewerPage.goToChapterIndex(0);
    await explorationPlayerPage.submitAnswer('Continue', null);
    await topicAndStoryViewerPage.login(
      'newStoryViewer@storyviewer.com', 'newStoryViewer');
    await explorationPlayerPage.submitAnswer('Continue', null);
    await topicAndStoryViewerPage.get(
      'math', 'topic-tasv-one', 'story-player-tasv-one');
    await topicAndStoryViewerPage.expectCompletedLessonCountToBe(2);
    await topicAndStoryViewerPage.expectUncompletedLessonCountToBe(1);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
