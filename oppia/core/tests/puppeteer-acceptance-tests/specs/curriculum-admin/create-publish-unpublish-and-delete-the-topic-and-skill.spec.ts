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

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {ConsoleReporter} from '../../utilities/common/console-reporter';
import {TopicManager} from '../../utilities/user/topic-manager';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

// To ignore console errors that occur when checking if the
// topic link returns a 404 status upon unpublishing.
ConsoleReporter.setConsoleErrorsToIgnore([
  /HttpErrorResponse:.*404 Not Found/,
  /Occurred at http:\/\/localhost:8181\/learn\/staging\/test-topic-one \.?/,
  /http:\/\/localhost:8181\/learn\/staging\/test-topic-one \.?/,
  /Failed to load resource: the server responded with a status of 404 \(Not Found\)/,
]);

describe('Curriculum Admin', function () {
  let curriculumAdmin: CurriculumAdmin & TopicManager & LoggedOutUser;
  let loggedInUser: LoggedInUser;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it('should be able to create a topic.', async function () {
    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.createTopic('Test Topic 1', 'test-topic-one');
    await curriculumAdmin.expectToBeInTopicEditor('Test Topic 1');
  });

  it('should be able to publish a topic', async function () {
    // Add Subtopic.
    await curriculumAdmin.createSubtopicForTopic(
      'Test Subtopic 1',
      'test-subtopic-one',
      'Test Topic 1'
    );

    // Create skill, and add it to diagnostic test.
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

    // Publish topic.
    await curriculumAdmin.publishDraftTopic('Test Topic 1');
    await curriculumAdmin.expectToBeInTopicAndSkillsDashboardPage();
    await curriculumAdmin.expectTopicToBePublishedInTopicsAndSkillsDashboard(
      'Test Topic 1',
      0, // Story added.
      1, // Subtopic added.
      1 // Skill added.
    );

    await curriculumAdmin.openTopicEditor('Test Topic 1');
    await curriculumAdmin.expectUnpublishTopicButtonToBeVisible();
  });

  it('should be able to create a skill', async function () {
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

  it('should be able to unpublish a topic', async function () {
    await curriculumAdmin.unpublishTopic('Test Topic 1');
    await loggedInUser.expectTopicLinkReturns404('test-topic-one');
  });

  it('should be able to delete a topic', async function () {
    await curriculumAdmin.deleteTopic('Test Topic 1');
    await curriculumAdmin.expectTopicNotInTopicsAndSkillDashboard(
      'Test Topic 1'
    );
  });

  it('should be able to delete a skill', async function () {
    // Navigate to the skill editor page and copy the URL to check for 404
    // error afterwards.
    await curriculumAdmin.openSkillEditor('Test Skill 1');
    const pageURL = curriculumAdmin.page.url();
    // User must remove all questions from the skill before deleting it.
    await curriculumAdmin.removeAllQuestionsFromTheSkill('Test Skill 1');
    await curriculumAdmin.deleteSkill('Test Skill 1');
    await curriculumAdmin.expectSkillNotInTopicsAndSkillsDashboard(
      'Test Skill 1'
    );
    await curriculumAdmin.goto(pageURL);
    await curriculumAdmin.expectToBeOnErrorPage(404);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
