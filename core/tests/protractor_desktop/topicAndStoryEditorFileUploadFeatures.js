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

  beforeAll(function() {
    topicsAndSkillsDashboardPage =
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage();
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    users.createAndLoginAdminUser(
      'creator@topicEditor.com', 'creatorTopicEditor');
    users.logout();
  });

  beforeEach(function() {
    users.login('creator@topicEditor.com');
    topicsAndSkillsDashboardPage.get();
  });

  it('should edit topic name, thumbnail and description ' +
    'correctly', function() {
    var TOPIC_NAME = 'TASEFUF_1';
    var EDITED_TOPIC_NAME = 'TASEFUF_1 edited';
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createTopic(TOPIC_NAME, false);
    NEW_TOPIC_NAME = EDITED_TOPIC_NAME;
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.editTopic(TOPIC_NAME);
    topicEditorPage.changeTopicName(NEW_TOPIC_NAME);
    expect(topicEditorPage.getTopicThumbnailSource())
      .not
      .toEqual(
        topicEditorPage.submitTopicThumbnail('../data/test_svg.svg')
          .then(function() {
            return topicEditorPage.getTopicThumbnailSource();
          })
      );
    topicEditorPage.changeTopicDescription('Topic Description');
    topicEditorPage.saveTopic('Changed topic name and description.');

    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.expectTopicNameToBe(NEW_TOPIC_NAME, 0);

    topicsAndSkillsDashboardPage.editTopic(NEW_TOPIC_NAME);
    topicEditorPage.expectTopicNameToBe(EDITED_TOPIC_NAME);
    topicEditorPage.expectTopicDescriptionToBe('Topic Description');
  });

  it('should edit subtopic page contents correctly', function() {
    var TOPIC_NAME = 'TASEFUF_2';
    var defaultThumbnailImageSrc = null;
    topicsAndSkillsDashboardPage.createTopic(TOPIC_NAME, false);
    topicEditorPage.getTopicThumbnailSource().then(function(name) {
      defaultThumbnailImageSrc = name;
    });
    expect(topicEditorPage.getTopicThumbnailSource())
      .not
      .toEqual(
        topicEditorPage.submitTopicThumbnail('../data/test_svg.svg')
          .then(function() {
            return topicEditorPage.getTopicThumbnailSource();
          })
      );
    topicEditorPage.changeTopicDescription('Topic Description');
    topicEditorPage.saveTopic('Changed topic name and description.');
    topicEditorPage.moveToSubtopicsTab();
    topicEditorPage.addSubtopic('Subtopic 1');
    topicEditorPage.editSubtopicWithIndex(0);
    topicEditorPage.changeSubtopicTitle('Modified Title');
    topicEditorPage.changeSubtopicPageContents(
      forms.toRichText('Subtopic Contents'));
    expect(topicEditorPage.getSubtopicThumbnailSource())
      .not.toEqual(
        topicEditorPage.submitSubtopicThumbnail('../data/test_svg.svg')
          .then(function() {
            return topicEditorPage.getTopicThumbnailSource();
          }));
    topicEditorPage.saveSubtopic();
    topicEditorPage.saveTopic('Edited subtopic.');

    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.editTopic(TOPIC_NAME);
    expect(topicEditorPage.getTopicThumbnailSource()).not.toEqual(
      defaultThumbnailImageSrc);
    topicEditorPage.expectTopicDescriptionToBe('Topic Description');

    topicEditorPage.moveToSubtopicsTab();
    topicEditorPage.expectTitleOfSubtopicWithIndexToMatch('Modified Title', 0);
    topicEditorPage.editSubtopicWithIndex(0);
    expect(topicEditorPage.getSubtopicThumbnailSource()).not.toEqual(
      defaultThumbnailImageSrc);
    topicEditorPage.expectSubtopicPageContentsToMatch('Subtopic Contents');
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
    users.logout();
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
  var TOPIC_NAME = 'TASEFUF_3';
  var USER_EMAIL = 'creator@chapterTest.com';

  var createDummyExplorations = function(numExplorations) {
    var ids = [];
    for (var i = 0; i < numExplorations; i++) {
      var info = dummyExplorationInfo.slice();
      info[0] += i.toString();
      workflow.createAndPublishExploration.apply(workflow, info);
      browser.getCurrentUrl().then(function(url) {
        var id = url.split('/')[4].replace('#', '');
        ids.push(id);
      });
    }
    return ids;
  };

  beforeAll(function() {
    topicsAndSkillsDashboardPage =
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage();
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    users.createAndLoginAdminUser(
      USER_EMAIL, 'creatorChapterTest');
    dummyExplorationIds = createDummyExplorations(1);
    users.logout();
  });

  beforeEach(function() {
    users.login(USER_EMAIL);
  });

  it('should create a basic chapter with a thumbnail.', function() {
    topicsAndSkillsDashboardPage.get();
    var defaultThumbnailImageSrc = null;
    topicsAndSkillsDashboardPage.createTopic(TOPIC_NAME, false);
    topicEditorPage.getTopicThumbnailSource().then(function(name) {
      defaultThumbnailImageSrc = name;
    });
    expect(topicEditorPage.getTopicThumbnailSource())
      .not
      .toEqual(
        topicEditorPage.submitTopicThumbnail('../data/test_svg.svg')
          .then(function() {
            return topicEditorPage.getTopicThumbnailSource();
          })
      );
    topicEditorPage.changeTopicDescription('Topic Description');
    topicEditorPage.expectTopicDescriptionToBe('Topic Description');
    topicEditorPage.saveTopic('Changed topic name and description.');
    topicEditorPage.createStory('Story 0');
    expect(storyEditorPage.getStoryThumbnailSource())
      .not
      .toEqual(
        storyEditorPage.submitStoryThumbnail('../data/test_svg.svg')
          .then(function() {
            return storyEditorPage.getStoryThumbnailSource();
          })
      );
    storyEditorPage.createInitialChapter('Chapter 1');
    storyEditorPage.selectInitialChapterByName('Chapter 1');
    expect(storyEditorPage.getChapterThumbnailSource())
      .not
      .toEqual(
        storyEditorPage.submitChapterThumbnail('../data/test_svg.svg')
          .then(function() {
            return storyEditorPage.getChapterThumbnailSource();
          })
      );
    storyEditorPage.changeNodeOutline(forms.toRichText('First outline'));
    storyEditorPage.expectNodeOutlineToMatch('First outline');
    storyEditorPage.setChapterExplorationId(dummyExplorationIds[0]);
    storyEditorPage.expectChapterExplorationIdToBe(dummyExplorationIds[0]);
    storyEditorPage.saveStory('First save');
    // Check if the thumbnail images persist on reload.
    browser.refresh();
    general.scrollToTop();
    expect(storyEditorPage.getStoryThumbnailSource()).not.toEqual(
      defaultThumbnailImageSrc);
    general.scrollToTop();
    expect(storyEditorPage.getChapterThumbnailSource()).not.toEqual(
      defaultThumbnailImageSrc);
  });

  afterAll(function() {
    users.logout();
  });
});
