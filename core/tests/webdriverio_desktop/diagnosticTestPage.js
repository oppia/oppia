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
 * @fileoverview End-to-end tests for the diagnostic test page.
 */

var action = require('../webdriverio_utils/action.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');

var AdminPage = require('../webdriverio_utils/AdminPage.js');
var ClassroomPage = require('../webdriverio_utils/ClassroomPage.js');
var DiagnosticTestPage = require('../webdriverio_utils/DiagnosticTestPage');
var ExplorationPlayerPage = require(
  '../webdriverio_utils/ExplorationPlayerPage.js');
var SkillEditorPage = require('../webdriverio_utils/SkillEditorPage.js');
var TopicsAndSkillsDashboardPage = require(
  '../webdriverio_utils/TopicsAndSkillsDashboardPage.js');
var TopicEditorPage = require('../webdriverio_utils/TopicEditorPage.js');

describe('Diagnostic test page functionality', function() {
  var adminPage = null;
  var classroomPage = null;
  var diagnosticTestPage = null;
  var explorationPlayerPage = null;
  var skillEditorPage = null;
  var topicsAndSkillsDashboardPage = null;
  var topicEditorPage = null;

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    classroomPage = new ClassroomPage.ClassroomPage();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    diagnosticTestPage = new DiagnosticTestPage.DiagnosticTestPage();
    skillEditorPage = new SkillEditorPage.SkillEditorPage();
    topicsAndSkillsDashboardPage = (
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
    topicEditorPage = (
      new TopicEditorPage.TopicEditorPage());

    await users.createAndLoginCurriculumAdminUser(
      'creator@diagnosticTestPage.com', 'creatorDignosticTestPage');
    var handle = await browser.getWindowHandle();
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.createTopic(
      'Diagnostic test addition', 'add', 'Addition of numbers', false);
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
        await action.setValue(
          'Topic ID', elem, topicId, false);
      });
    await classroomPage.get('math');
    // Even if the topic is unpublished, an unclickable tile is shown
    // currently.
    await classroomPage.expectNumberOfTopicsToBe(1);
    await topicsAndSkillsDashboardPage.get();

    (
      await
      topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
        'Diagnostic test skill', 'Concept card explanation', false));
    await skillEditorPage.addRubricExplanationForDifficulty(
      'Easy', 'Explanation for easy difficulty.');
    await skillEditorPage.saveOrPublishSkill('Edited rubrics');
    // A minimum of three questions are required for skill to get assigned in
    // a topic’s diagnostic test.
    await workflow.createQuestion();
    await workflow.createQuestion();
    await workflow.createQuestion();

    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToSkillsTab();
    await topicsAndSkillsDashboardPage.assignSkillToTopic(
      'Diagnostic test skill', 'Diagnostic test addition');
    await topicsAndSkillsDashboardPage.get();
    await topicsAndSkillsDashboardPage.navigateToTopicWithIndex(0);

    await topicEditorPage.addDiagnosticTestSkill('Diagnostic test skill');

    await topicEditorPage.addSubtopic(
      'Subtopic for Diagnostic test addition', 'subtopic-one',
      '../data/test2_svg.svg', 'Subtopic content');
    await topicEditorPage.saveTopic('Added subtopic.');

    await topicEditorPage.navigateToTopicEditorTab();
    await topicEditorPage.navigateToReassignModal();

    await topicEditorPage.dragSkillToSubtopic('Diagnostic test skill', 0);
    await topicEditorPage.saveRearrangedSkills();
    await topicEditorPage.saveTopic('Added skill to subtopic.');

    await topicEditorPage.publishTopic();
    await classroomPage.get('math');
    await classroomPage.expectNumberOfTopicsToBe(1);

    await browser.url('/classroom-admin/');
    await waitFor.pageToFullyLoad();
    await diagnosticTestPage.createNewClassroomConfig('Math', 'math');
    await diagnosticTestPage.addTopicIdToClassroomConfig(topicId, 0);
  });

  it(
    'should be able to submit correct answer and get no topic recommendation',
    async function() {
      await classroomPage.get('math');
      await classroomPage.launchDiagnosticTestPage();
      await waitFor.pageToFullyLoad();
      await diagnosticTestPage.startDiagnosticTest();
      await explorationPlayerPage.submitAnswer('TextInput', 'correct');
      await diagnosticTestPage.expectNumberOfRecommendedTopicsToBe(0);
    });

  it(
    'should be able to skip questions and a get topic recommendation',
    async function() {
      await classroomPage.get('math');
      await classroomPage.launchDiagnosticTestPage();
      await waitFor.pageToFullyLoad();
      await diagnosticTestPage.startDiagnosticTest();
      await explorationPlayerPage.skipQuestion();
      // Skipping question functionality is similar to incorrect attempt.
      await explorationPlayerPage.submitAnswer('TextInput', 'wrong answer');
      await diagnosticTestPage.expectNumberOfRecommendedTopicsToBe(1);
    });

  it(
    'should be able to submit correct answer after incorrect attempt',
    async function() {
      await classroomPage.get('math');
      await classroomPage.launchDiagnosticTestPage();
      await waitFor.pageToFullyLoad();
      await diagnosticTestPage.startDiagnosticTest();
      // Skipping question functionality is similar to incorrect attempt.
      await explorationPlayerPage.skipQuestion();
      await explorationPlayerPage.submitAnswer('TextInput', 'correct');
      await diagnosticTestPage.expectNumberOfRecommendedTopicsToBe(0);
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });

  afterAll(async function() {
    await users.logout();
  });
});
