// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for the skill editor page.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var TopicsAndSkillsDashboardPage =
  require('../protractor_utils/TopicsAndSkillsDashboardPage.js');
var SkillEditorPage =
  require('../protractor_utils/SkillEditorPage.js');

describe('Skill Editor functionality', function() {
  var topicsAndSkillsDashboardPage = null;
  var skillEditorPage = null;

  beforeAll(function() {
    users.createAdmin('test@example.com',
      'skillEditor');
    topicsAndSkillsDashboardPage =
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage();
    skillEditorPage =
      new SkillEditorPage.SkillEditorPage();
  });

  beforeEach(function() {
    users.login('test@example.com');

    topicsAndSkillsDashboardPage.get();
    topicsAndSkillsDashboardPage.createSkillWithDescription('Test Skill');
  });

  it('should edit concept card explanation', function() {
    skillEditorPage.editConceptCard('Test concept card explanation');

    skillEditorPage.expectConceptCardExplanationToMatch(
      'Test concept card explanation');
  });

  it('should create and delete worked examples', function() {
    skillEditorPage.addWorkedExample('Example 1');
    skillEditorPage.addWorkedExample('Example 2');

    skillEditorPage.expectWorkedExampleSummariesToMatch([
      'Example 1', 'Example 2']);

    skillEditorPage.deleteWorkedExample(0);

    skillEditorPage.expectWorkedExampleSummariesToMatch(['Example 2']);
  });

  it('should create and delete misconceptions', function() {
    skillEditorPage.addMisconception(
      'Misconception 1', 'Notes 1', 'Feedback 1');
    skillEditorPage.addMisconception(
      'Misconception 2', 'Notes 2', 'Feedback 2');

    skillEditorPage.expectNumberOfMisconceptionsToBe(2);

    skillEditorPage.deleteMisconception(1);

    skillEditorPage.expectNumberOfMisconceptionsToBe(1);
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
    users.logout();
  });
});
