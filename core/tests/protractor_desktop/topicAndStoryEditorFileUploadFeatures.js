// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for file upload feature in the topic editor
 * page.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

var TopicsAndSkillsDashboardPage =
  require('../protractor_utils/TopicsAndSkillsDashboardPage.js');
var TopicEditorPage = require('../protractor_utils/TopicEditorPage.js');
var StoryEditorPage = require('../protractor_utils/StoryEditorPage.js');
var SkillEditorPage = require('../protractor_utils/SkillEditorPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');

describe('Topic editor functionality', function() {
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;
  var explorationEditorPage = null;

  beforeAll(async function() {
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    await users.createAndLoginAdminUser(
      'creator@topicEditor.com', 'creatorTopicEditor');
    await users.logout();
  });

  beforeEach(async function() {
    await users.login('creator@topicEditor.com');
    await topicsAndSkillsDashboardPage.get();
  });

  it('should edit topic name, thumbnail and description ' +
    'correctly', async function() {
    var TOPIC_NAME = 'TASEFUF_1';
    var TOPIC_DESCRIPTION = 'TASEFUF_1 description';
    var EDITED_TOPIC_NAME = 'TASEFUF_1 edited';
    var NEW_TOPIC_NAME = EDITED_TOPIC_NAME;
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(TOPIC_NAME,
      TOPIC_DESCRIPTION, false);
    await topicEditorPage.changeTopicName(NEW_TOPIC_NAME);
    var defaultThumbnailImageSrc = (
      await topicEditorPage.getTopicThumbnailSource());
    await topicEditorPage.submitTopicThumbnail('../data/test2_svg.svg', true);
    var updatedThumbnailImageSrc = (
      await topicEditorPage.getTopicThumbnailSource());
    expect(defaultThumbnailImageSrc).not.toEqual(updatedThumbnailImageSrc);
    await topicEditorPage.changeTopicDescription('Topic Description');
    await topicEditorPage.saveTopic('Changed topic name and description.');

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.expectTopicNameToBe(NEW_TOPIC_NAME, 0);

    await topicsAndSkillsDashboardPage.editTopic(NEW_TOPIC_NAME);
    await topicEditorPage.expectTopicNameToBe(EDITED_TOPIC_NAME);
    await topicEditorPage.expectTopicDescriptionToBe('Topic Description');
  });

  it('should edit subtopic page contents correctly', async function() {
    var TOPIC_NAME = 'TASEFUF_2';
    var TOPIC_DESCRIPTION = 'TASEFUF_2 description';

    await topicsAndSkillsDashboardPage.createTopic(
      TOPIC_NAME, TOPIC_DESCRIPTION, false);
    var defaultThumbnailSrc = (
      await topicEditorPage.getTopicThumbnailSource());
    await topicEditorPage.submitTopicThumbnail('../data/test2_svg.svg', true);
    var updatedTopicThumbnailSrc = (
      await topicEditorPage.getTopicThumbnailSource());
    expect(defaultThumbnailSrc).not.toEqual(updatedTopicThumbnailSrc);
    await topicEditorPage.changeTopicDescription('Topic Description');
    await topicEditorPage.saveTopic('Changed topic name and description.');
    await topicEditorPage.moveToSubtopicsTab();
    await topicEditorPage.addSubtopic('Subtopic 1');
    await topicEditorPage.editSubtopicWithIndex(0);
    await topicEditorPage.changeSubtopicTitle('Modified Title');
    await topicEditorPage.changeSubtopicPageContents(
      await forms.toRichText('Subtopic Contents'));
    await topicEditorPage.submitSubtopicThumbnail(
      '../data/test2_svg.svg', false);
    var updatedSubtopicThumbnailSrc = (
      await topicEditorPage.getSubtopicThumbnailSource());
    expect(defaultThumbnailSrc).not.toEqual(updatedSubtopicThumbnailSrc);
    await topicEditorPage.saveSubtopic();
    await topicEditorPage.saveTopic('Edited subtopic.');

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.editTopic(TOPIC_NAME);
    expect(await topicEditorPage.getTopicThumbnailSource()).not.toEqual(
      defaultThumbnailSrc);
    await topicEditorPage.expectTopicDescriptionToBe('Topic Description');

    await topicEditorPage.moveToSubtopicsTab();
    await topicEditorPage.expectTitleOfSubtopicWithIndexToMatch(
      'Modified Title', 0);
    await topicEditorPage.editSubtopicWithIndex(0);
    expect(await topicEditorPage.getSubtopicThumbnailSource()).not.toEqual(
      defaultThumbnailSrc);
    await topicEditorPage.expectSubtopicPageContentsToMatch(
      'Subtopic Contents');
  });

  it('should publish and unpublish a story correctly', async function() {
    var TOPIC_NAME = 'TASEFUF_3';
    var TOPIC_DESCRIPTION = 'TASEFUF_3 description';
    await topicsAndSkillsDashboardPage.createTopic(TOPIC_NAME,
      TOPIC_DESCRIPTION, false);

    await topicEditorPage.expectNumberOfStoriesToBe(0);
    await topicEditorPage.createStory('Story Title');
    await storyEditorPage.returnToTopic();

    await topicEditorPage.expectNumberOfStoriesToBe(1);
    await topicEditorPage.expectStoryPublicationStatusToBe('No', 0);
    await topicEditorPage.navigateToStoryWithIndex(0);
    var defaultThumbnailImageSrc = (
      await storyEditorPage.getStoryThumbnailSource());
    await storyEditorPage.submitStoryThumbnail('../data/test2_svg.svg');
    expect(await storyEditorPage.getStoryThumbnailSource()).not.toEqual(
      defaultThumbnailImageSrc);
    await storyEditorPage.saveStory('Added thumbnail.');
    await storyEditorPage.publishStory();
    await storyEditorPage.returnToTopic();

    await topicEditorPage.expectStoryPublicationStatusToBe('Yes', 0);
    await topicEditorPage.navigateToStoryWithIndex(0);
    expect(await storyEditorPage.getStoryThumbnailSource()).not.toEqual(
      defaultThumbnailImageSrc);
    await storyEditorPage.unpublishStory();
    await storyEditorPage.returnToTopic();

    await topicEditorPage.expectStoryPublicationStatusToBe('No', 0);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });
});

describe('Chapter editor functionality', function() {
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;
  var storyEditorPage = null;
  var explorationEditorPage = null;
  var dummyExplorationIds = [];
  var dummyExplorationInfo = [
    'Dummy exploration', 'Algorithm', 'Learn more about oppia', 'English'];
  var TOPIC_NAME = 'TASEFUF_4';
  var USER_EMAIL = 'creator@chapterTest.com';

  var createDummyExplorations = async function(numExplorations) {
    var ids = [];
    for (var i = 0; i < numExplorations; i++) {
      var info = dummyExplorationInfo.slice();
      info[0] += i.toString();
      await workflow.createAndPublishExploration.apply(workflow, info);
      var url = await browser.getCurrentUrl();
      var id = url.split('/')[4].replace('#', '');
      ids.push(id);
    }
    return ids;
  };

  beforeAll(async function() {
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    await users.createAndLoginAdminUser(
      USER_EMAIL, 'creatorChapterTest');
    dummyExplorationIds = await createDummyExplorations(1);
    await users.logout();
  });

  beforeEach(async function() {
    await users.login(USER_EMAIL);
  });

  it('should create a basic chapter with a thumbnail.', async function() {
    await topicsAndSkillsDashboardPage.get();
    var defaultThumbnailImageSrc = null;
    await topicsAndSkillsDashboardPage.createTopic(TOPIC_NAME,
      'Topic description', false);
    defaultThumbnailImageSrc = await topicEditorPage.getTopicThumbnailSource();
    await topicEditorPage.submitTopicThumbnail('../data/test2_svg.svg', true);
    expect(await topicEditorPage.getTopicThumbnailSource()).not.toEqual(
      defaultThumbnailImageSrc);
    await topicEditorPage.changeTopicDescription('Topic Description');
    await topicEditorPage.expectTopicDescriptionToBe('Topic Description');
    await topicEditorPage.saveTopic('Changed topic name and description.');
    await topicEditorPage.createStory('Story 0');
    await storyEditorPage.submitStoryThumbnail('../data/test2_svg.svg');
    expect(await storyEditorPage.getStoryThumbnailSource()).not.toEqual(
      defaultThumbnailImageSrc);
    await storyEditorPage.createInitialChapter('Chapter 1');
    await storyEditorPage.selectInitialChapterByName('Chapter 1');
    await storyEditorPage.submitChapterThumbnail(
      '../data/test2_svg.svg', false);
    expect(await storyEditorPage.getChapterThumbnailSource()).not.toEqual(
      defaultThumbnailImageSrc);
    await storyEditorPage.changeNodeOutline(
      await forms.toRichText('First outline'));
    await storyEditorPage.expectNodeOutlineToMatch('First outline');
    await storyEditorPage.setChapterExplorationId(dummyExplorationIds[0]);
    await storyEditorPage.expectChapterExplorationIdToBe(
      dummyExplorationIds[0]);
    await storyEditorPage.saveStory('First save');
    // Check if the thumbnail images persist on reload.
    await browser.refresh();
    await general.scrollToTop();
    expect(await storyEditorPage.getStoryThumbnailSource()).not.toEqual(
      defaultThumbnailImageSrc);
    await general.scrollToTop();
    expect(await storyEditorPage.getChapterThumbnailSource()).not.toEqual(
      defaultThumbnailImageSrc);
  });

  afterAll(async function() {
    await users.logout();
  });
});
