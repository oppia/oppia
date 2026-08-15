// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * CA. Create, publish, unpublish, and delete a topic and a skill.
 */

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {LoggedInUser} from '../../utilities/user/logged-in-user';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

test.describe.configure({mode: 'serial'});

test.describe('Curriculum Admin', function () {
  let curriculumAdmin: CurriculumAdmin;
  let loggedInUser: LoggedInUser;

  test.beforeAll(async function ({browser}) {
    test.setTimeout(DEFAULT_SPEC_TIMEOUT_MSECS);
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      browser,
      [ROLES.CURRICULUM_ADMIN]
    );

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com',
      browser
    );
  });

  test('should be able to create a topic.', async function () {
    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createTopic('Test Topic 1', 'test-topic-one');
    await curriculumAdmin.expectToBeInTopicEditor('Test Topic 1');
  });

  test('should be able to publish a topic', async function () {
    await curriculumAdmin.createSubtopicForTopic(
      'Test Subtopic 1',
      'test-subtopic-one',
      'Test Topic 1'
    );

    await curriculumAdmin.createSkillForTopic(
      'Test Skill 1',
      'Test Topic 1',
      false
    );
    await curriculumAdmin.createQuestionsForSkill('Test Skill 1', 3);
    await curriculumAdmin.assignSkillToSubtopicInTopicEditor(
      'Test Skill 1',
      'Test Subtopic 1',
      'Test Topic 1'
    );
    await curriculumAdmin.addSkillToDiagnosticTest(
      'Test Skill 1',
      'Test Topic 1'
    );

    await curriculumAdmin.publishDraftTopic('Test Topic 1');
    await curriculumAdmin.expectToBeInTopicAndSkillsDashboardPage();
    await curriculumAdmin.expectTopicToBePublishedInTopicsAndSkillsDashboard(
      'Test Topic 1',
      0,
      1,
      1
    );

    await curriculumAdmin.openTopicEditor('Test Topic 1');
    await curriculumAdmin.expectUnpublishTopicButtonToBeVisible();
  });

  test('should be able to create a skill', async function () {
    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.navigateToSkillsTab();

    await curriculumAdmin.clickOnCreateNewSkillButtonInSkillDashboard();
    await curriculumAdmin.fillSkillDetailsInNewSkillModal(
      'Test Skill 2',
      'Test Review Material'
    );
    const newPage = await curriculumAdmin.clickOnElementAndGetNewPage('Save');
    await curriculumAdmin.expectToBeInSkillEditorPage(newPage);
  });

  test('should be able to unpublish a topic', async function () {
    await curriculumAdmin.unpublishTopic('Test Topic 1');
    await loggedInUser.expectTopicLinkReturns404('test-topic-one');
  });

  test('should be able to delete a topic', async function () {
    await curriculumAdmin.deleteTopic('Test Topic 1');
    await curriculumAdmin.expectTopicNotInTopicsAndSkillDashboard(
      'Test Topic 1'
    );
  });

  test('should be able to delete a skill', async function () {
    await curriculumAdmin.openSkillEditor('Test Skill 1');
    const pageURL = curriculumAdmin.page.url();
    await curriculumAdmin.removeAllQuestionsFromTheSkill('Test Skill 1');
    await curriculumAdmin.deleteSkill('Test Skill 1');
    await curriculumAdmin.expectSkillNotInTopicsAndSkillsDashboard(
      'Test Skill 1'
    );
    await curriculumAdmin.goto(pageURL);
    await curriculumAdmin.expectToBeOnErrorPage(404);
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
