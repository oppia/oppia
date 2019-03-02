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
 * @fileoverview End-to-end tests for the topic editor page.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var TopicsAndSkillsDashboardPage =
  require('../protractor_utils/TopicsAndSkillsDashboardPage.js');
var TopicEditorPage = require('../protractor_utils/TopicEditorPage.js');
var StoryEditorPage = require('../protractor_utils/StoryEditorPage.js');

describe('Topic editor functionality', function() {
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;
  var storyEditorPage = null;
  var topicId = null;

  beforeAll(function() {
    topicsAndSkillsDashboardPage =
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage();
    topicEditorPage = new TopicEditorPage.TopicEditorPage();
    storyEditorPage = new StoryEditorPage.StoryEditorPage();
    users.createAndLoginAdminUser(
      'creator@topicEditor.com', 'creatorTopicEditor');
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createTopicWithTitle('Topic 1');
    browser.getCurrentUrl().then(function(url) {
      topicId = url.split('/')[4];
    });
  });

  beforeEach(function() {
    users.login('creator@topicEditor.com');
    topicEditorPage.get(topicId);
  });

  it('should edit topic name and description correctly', function() {
    topicEditorPage.changeTopicName('Topic 1 edited');
    topicEditorPage.changeTopicDescription('Topic Description');
    topicEditorPage.saveTopic('Changed topic name and description.');

    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.expectTopicNameToBe('Topic 1 edited', 0);

    topicEditorPage.get(topicId);
    topicEditorPage.expectTopicNameToBe('Topic 1 edited');
    topicEditorPage.expectTopicDescriptionToBe('Topic Description');
  });

  it('should add and delete subtopics correctly', function() {
    topicEditorPage.moveToSubtopicsTab();
    topicEditorPage.addSubtopic('Subtopic 1');
    topicEditorPage.expectNumberOfSubtopicsToBe(1);
    topicEditorPage.saveTopic('Added subtopic.');

    topicEditorPage.get(topicId);
    topicEditorPage.moveToSubtopicsTab();
    topicEditorPage.expectNumberOfSubtopicsToBe(1);
    topicEditorPage.deleteSubtopicWithIndex(0);
    topicEditorPage.expectNumberOfSubtopicsToBe(0);
  });

  it('should add a canonical story to topic correctly', function() {
    topicEditorPage.expectNumberOfStoriesToBe(0);
    topicEditorPage.createStory('Story Title');
    storyEditorPage.returnToTopic();

    topicEditorPage.expectNumberOfStoriesToBe(1);
  });

  it('should edit story title, description and notes correctly', function() {
    topicEditorPage.navigateToStoryWithIndex(0);
    storyEditorPage.changeStoryNotes(forms.toRichText('Story notes'));
    storyEditorPage.changeStoryTitle('Story Title Edited');
    storyEditorPage.changeStoryDescription('Story Description');
    storyEditorPage.saveStory('Changed story title, description and notes');

    storyEditorPage.returnToTopic();
    topicEditorPage.expectStoryTitleToBe('Story Title Edited', 0);
    topicEditorPage.navigateToStoryWithIndex(0);

    storyEditorPage.expectTitleToBe('Story Title Edited');
    storyEditorPage.expectDescriptionToBe('Story Description');
    storyEditorPage.expectNotesToBe(forms.toRichText('Story notes'));
  });

  it('should add and remove nodes (chapters) from a story', function() {
    topicEditorPage.navigateToStoryWithIndex(0);
    storyEditorPage.expectNumberOfChaptersToBe(0);
    storyEditorPage.createInitialChapter('Chapter 1');
    storyEditorPage.expectNumberOfChaptersToBe(1);

    storyEditorPage.createNewDestinationChapter('Chapter 2');
    storyEditorPage.expectNumberOfChaptersToBe(2);
    storyEditorPage.deleteChapterWithIndex(1);
    storyEditorPage.expectNumberOfChaptersToBe(1);
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
    users.logout();
  });
});
