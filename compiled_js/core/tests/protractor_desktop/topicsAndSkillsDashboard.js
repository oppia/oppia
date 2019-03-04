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
 * @fileoverview End-to-end tests for the topics and skills dashboard page.
 */
var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');
var AdminPage = require('../protractor_utils/AdminPage.js');
var TopicsAndSkillsDashboardPage = require('../protractor_utils/TopicsAndSkillsDashboardPage.js');
describe('Topics and skills dashboard functionality', function () {
    var topicsAndSkillsDashboardPage = null;
    beforeAll(function () {
        topicsAndSkillsDashboardPage =
            new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage();
        users.createAdmin('creator@topicsAndSkillsDashboard.com', 'creatorTopicsAndSkillsDashboard');
    });
    beforeEach(function () {
        users.login('creator@topicsAndSkillsDashboard.com');
    });
    it('should add a new topic to list', function () {
        topicsAndSkillsDashboardPage.get();
        topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
        topicsAndSkillsDashboardPage.createTopicWithTitle('Topic 1');
        topicsAndSkillsDashboardPage.get();
        topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
    });
    it('should add a new unpublished skill to list', function () {
        topicsAndSkillsDashboardPage.get();
        topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
        topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(0);
        topicsAndSkillsDashboardPage.createSkillWithDescription('Skill 1');
        topicsAndSkillsDashboardPage.get();
        topicsAndSkillsDashboardPage.navigateToUnpublishedSkillsTab();
        topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(1);
    });
    it('should remove a skill from list once deleted', function () {
        topicsAndSkillsDashboardPage.get();
        topicsAndSkillsDashboardPage.navigateToUnpublishedSkillsTab();
        topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(1);
        topicsAndSkillsDashboardPage.deleteSkillWithIndex(0);
        topicsAndSkillsDashboardPage.get();
        topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
        topicsAndSkillsDashboardPage.expectNumberOfSkillsToBe(0);
    });
    it('should remove a topic from list once deleted', function () {
        topicsAndSkillsDashboardPage.get();
        topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(1);
        topicsAndSkillsDashboardPage.deleteTopicWithIndex(0);
        topicsAndSkillsDashboardPage.get();
        topicsAndSkillsDashboardPage.expectNumberOfTopicsToBe(0);
    });
    // TODO(aks681): Once skill editor tests are done by Nalin, add tests here
    // regarding published skills.
    afterEach(function () {
        general.checkForConsoleErrors([]);
        users.logout();
    });
});
