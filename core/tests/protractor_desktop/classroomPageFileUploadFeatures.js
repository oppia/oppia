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
 * @fileoverview End-to-end tests for file upload features in the classroom
 * page.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var ClassroomPage = require('../protractor_utils/ClassroomPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');
var TopicsAndSkillsDashboardPage = require(
  '../protractor_utils/TopicsAndSkillsDashboardPage.js');
var TopicEditorPage = require('../protractor_utils/TopicEditorPage.js');

describe('Classroom page functionality', function() {
  var adminPage = null;
  var classroomPage = null;
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    classroomPage = new ClassroomPage.ClassroomPage();
    libraryPage = new LibraryPage.LibraryPage();
    topicsAndSkillsDashboardPage =
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage();
    topicEditorPage =
      new TopicEditorPage.TopicEditorPage();

    users.createAndLoginAdminUser(
      'creator@classroomPage.com', 'creatorClassroomPage');
  });

  beforeEach(function() {
    users.login('creator@classroomPage.com');
  });

  it('should add a new published topic to the Math classroom', function() {
    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createTopic('Topic 1', 'abbrev');
    topicEditorPage.submitTopicThumbnail('../data/img.png');
    topicEditorPage.saveTopic('Added thumbnail.');
    browser.getCurrentUrl().then(function(url) {
      var topicId = url.split('/')[4].slice(0, -1);
      adminPage.editConfigProperty(
        'The set of topic IDs for each classroom page.',
        'List',
        function(elem) {
          elem.editItem(0, 'Dictionary').editEntry(1, 'List').addItem(
            'Unicode').setValue(topicId);
        });
      classroomPage.get('Math');
      classroomPage.expectNumberOfTopicsToBe(0);
      topicsAndSkillsDashboardPage.get();
      topicsAndSkillsDashboardPage.navigateToTopicWithIndex(0);
      topicEditorPage.publishTopic();
      classroomPage.get('Math');
      classroomPage.expectNumberOfTopicsToBe(1);
    });
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
