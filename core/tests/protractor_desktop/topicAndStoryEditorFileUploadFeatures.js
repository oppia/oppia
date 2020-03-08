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

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');

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
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createTopic(topicName, 'abbrev');
    users.logout();
  });

  beforeEach(function() {
    users.login('creator@topicEditor.com');
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.editTopic(topicName);
  });

  it('should edit topic name, abbreviated topic name, ' +
    'thumbnail and description correctly', function() {
    newTopicName = 'Topic 1 edited';
    topicEditorPage.changeTopicName(newTopicName);
    expect(topicEditorPage.getTopicThumbnailSource())
      .not
      .toEqual(
        topicEditorPage.submitTopicThumbnail('../data/img.png')
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

  afterEach(function() {
    general.checkForConsoleErrors([]);
    users.logout();
  });
});
