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
 * @fileoverview End-to-end tests for file upload features in the classroom
 * page.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');


var AdminPage = require('../webdriverio_utils/AdminPage.js');
var ClassroomPage = require('../webdriverio_utils/ClassroomPage.js');
var DiagnosticTestPage = require('../webdriverio_utils/DiagnosticTestPage.js');
var SkillEditorPage = require('../webdriverio_utils/SkillEditorPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');
var TopicsAndSkillsDashboardPage = require(
  '../webdriverio_utils/TopicsAndSkillsDashboardPage.js');
var TopicEditorPage = require('../webdriverio_utils/TopicEditorPage.js');

describe('Classroom page functionality', function() {
  var adminPage = null;
  var classroomPage = null;
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;
  var skillEditorPage = null;

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    classroomPage = new ClassroomPage.ClassroomPage();
    diagnosticTestPage = new DiagnosticTestPage.DiagnosticTestPage();
    libraryPage = new LibraryPage.LibraryPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    topicEditorPage = (
      new TopicEditorPage.TopicEditorPage());

    await users.createAndLoginCurriculumAdminUser(
      'creator@classroomPage.com', 'creatorClassroomPage');
  });

  afterAll(async function() {
    await users.logout();
  });

  it('should add a new published topic to the Math classroom',
    async function() {
      var handle = await browser.getWindowHandle();
      await topicsAndSkillsDashboardPage.get();
      await topicsAndSkillsDashboardPage.createTopic(
        'Topic 1', 'topic-one', 'Description', false);
      await topicEditorPage.submitTopicThumbnail('../data/test2_svg.svg', true);
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
      await classroomPage.get('math');
      // Even if the topic is unpublished, an unclickable tile is shown
      // currently.
      await classroomPage.expectNumberOfTopicsToBe(1);
      await topicsAndSkillsDashboardPage.get();
      (
        await
        topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
          'Skill 1', 'Concept card explanation', false));
      await skillEditorPage.addRubricExplanationForDifficulty(
        'Easy', 'Second explanation for easy difficulty.');
      await skillEditorPage.saveOrPublishSkill('Edited rubrics');
      // A minimum of three questions are required for skill to get assigned in
      // a topic’s diagnostic test.
      await workflow.createQuestion();
      await workflow.createQuestion();
      await workflow.createQuestion();

      await topicsAndSkillsDashboardPage.get();
      await topicsAndSkillsDashboardPage.navigateToSkillsTab();
      await topicsAndSkillsDashboardPage.assignSkillToTopic(
        'Skill 1', 'Topic 1');
      await topicsAndSkillsDashboardPage.get();
      await topicsAndSkillsDashboardPage.navigateToTopicWithIndex(0);

      await topicEditorPage.addDiagnosticTestSkill('Skill 1');

      await topicEditorPage.addSubtopic(
        'Subtopic 1', 'subtopic-one', '../data/test2_svg.svg',
        'Subtopic content');
      await topicEditorPage.saveTopic('Added subtopic.');

      await topicEditorPage.navigateToTopicEditorTab();
      await topicEditorPage.replacementDragSkillToSubtopic(0);
      await topicEditorPage.saveTopic('Added skill to subtopic.');

      await topicEditorPage.publishTopic();
      await classroomPage.get('math');
      await classroomPage.expectNumberOfTopicsToBe(1);
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
