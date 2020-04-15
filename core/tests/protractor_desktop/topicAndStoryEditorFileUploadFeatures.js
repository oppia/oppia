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
  var topicName = 'Topic 1';
  var topicId = null;
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

  it('should edit topic name, abbreviated topic name, ' +
    'thumbnail and description correctly', function() {
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createTopic('Topic 1', 'abbrev');
    newTopicName = 'Topic 1 edited';
    topicsAndSkillsDashboardPage.editTopic('Topic 1');
    topicEditorPage.changeTopicName(newTopicName);
    expect(topicEditorPage.getTopicThumbnailSource())
      .not
      .toEqual(
        topicEditorPage.submitTopicThumbnail('../data/test_svg.svg')
          .then(function() {
            return topicEditorPage.getTopicThumbnailSource();
          })
      );
    topicEditorPage.changeAbbreviatedTopicName('short name');
    topicEditorPage.changeTopicDescription('Topic Description');
    topicEditorPage.saveTopic('Changed topic name and description.');

    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.expectTopicNameToBe(newTopicName, 0);

    topicsAndSkillsDashboardPage.editTopic(newTopicName);
    topicEditorPage.expectTopicNameToBe('Topic 1 edited');
    topicEditorPage.expectAbbreviatedTopicNameToBe('short name');
    topicEditorPage.expectTopicDescriptionToBe('Topic Description');
  });

  it('should edit subtopic page contents correctly', function() {
    topicsAndSkillsDashboardPage.createTopic('Topic 2', 'abbrev');
    expect(topicEditorPage.getTopicThumbnailSource())
      .not
      .toEqual(
        topicEditorPage.submitTopicThumbnail('../data/test_svg.svg')
          .then(function() {
            return topicEditorPage.getTopicThumbnailSource();
          })
      );
    topicEditorPage.changeAbbreviatedTopicName('short name');
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
            return topicEditorPage.getSubtopicThumbnailSource();
          }));
    topicEditorPage.saveSubtopic();
    topicEditorPage.saveTopic('Edited subtopic.');

    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.editTopic('Topic 2');
    topicEditorPage.moveToSubtopicsTab();
    topicEditorPage.expectTitleOfSubtopicWithIndexToMatch('Modified Title', 0);
    topicEditorPage.editSubtopicWithIndex(0);
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
  var allowedErrors = [];
  var topicName = 'Topic 0';
  var userEmail = 'creator@chapterTest.com';

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
      userEmail, 'creatorChapterTest');
    dummyExplorationIds = createDummyExplorations(1);
    users.logout();
  });

  beforeEach(function() {
    users.login(userEmail);
  });

  it('should create a basic chapter with a thumbnail.', function() {
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createTopic(topicName, 'abbrev');
    expect(topicEditorPage.getTopicThumbnailSource())
      .not
      .toEqual(
        topicEditorPage.submitTopicThumbnail('../data/test_svg.svg')
          .then(function() {
            return topicEditorPage.getTopicThumbnailSource();
          })
      );
    topicEditorPage.changeAbbreviatedTopicName('short name');
    topicEditorPage.changeTopicDescription('Topic Description');
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
    storyEditorPage.setChapterExplorationId(dummyExplorationIds[0]);
    storyEditorPage.saveStory('First save');
  });

  afterEach(function() {
    general.checkForConsoleErrors(allowedErrors);
    while (allowedErrors.length !== 0) {
      allowedErrors.pop();
    }
  });

  afterAll(function() {
    users.logout();
  });
});
