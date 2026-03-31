// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * TM.TD. Access dashboard using Profile Dropdown.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

describe('Topic Manager', function () {
  let topicManager: TopicManager & LoggedInUser;
  let curriculumAdmin: CurriculumAdmin &
    ExplorationEditor &
    TopicManager &
    LoggedInUser;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_adm@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    const explorationId =
      await curriculumAdmin.createAndPublishExplorationWithCards(
        'Solving problems without a calculator',
        'Mathematics'
      );
    await curriculumAdmin.createAndPublishTopic(
      'Arithmetic Operations',
      'Addition',
      'Addition'
    );
    await curriculumAdmin.addStoryToTopic(
      'The Broken Calculator',
      'the-broken-calculator',
      'Arithmetic Operations'
    );
    await curriculumAdmin.addChapter(
      'Solving problems without a calculator',
      explorationId
    );
    await curriculumAdmin.createAndPublishClassroom(
      'Maths',
      'maths',
      'Arithmetic Operations'
    );

    // Create more topics and skills.
    await curriculumAdmin.createTopic('Whole Numbers', 'whole-numbers');
    await curriculumAdmin.createSkillFromSkillsDashboard(
      'Subtraction',
      'Review Material for Subtraction'
    );
    await curriculumAdmin.createSkillFromSkillsDashboard(
      'Word Problems',
      'Review Material for Word Problems'
    );

    // Create topic manager user.
    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Arithmetic Operations'
    );
  }, 600000);

  it('should be able to access topic and skills dashboard using the profile menu', async function () {
    await topicManager.page.reload();
    await topicManager.clickOnProfileDropdown();
    await topicManager.expectProfileDropdownToContainElementWithContent(
      'Topics and Skills Dashboard'
    );
    await topicManager.clickOnTopicAndSkillsOptionInProfileMenu();
    await topicManager.expectScreenshotToMatch(
      'topicsAndSkillsDashboard',
      __dirname
    );
  });

  it('should be able to view the topic with no rights', async function () {
    await topicManager.openTopicEditor('Whole Numbers');

    // Verify that the breadcrumb contains read only text.
    if (!topicManager.isViewportAtMobileWidth()) {
      await topicManager.expectNavbarBreadcrumbToContain(
        "View only mode, you don't have rights to edit this topic"
      );
    }
    await topicManager.expectTopicNameAndTopicURLInputToBeDisabled();
  });

  it('should be able to filter topics and skills', async function () {
    // Filter topics by status.
    await topicManager.navigateToTopicsAndSkillsDashboardPage();
    await topicManager.filterTopicsByStatus('Published');
    await topicManager.expectFilteredTopics(['Arithmetic Operations']);
    await topicManager.expectFilteredTopics(['Whole Numbers'], false);

    // Sort topics by date created.
    await topicManager.resetTopicFilter();
    await topicManager.sortTopics('Newly Created');
    await topicManager.expectFilteredTopicsInOrder([
      'Whole Numbers',
      'Arithmetic Operations',
    ]);
    await topicManager.sortTopics('Oldest Created');
    await topicManager.expectFilteredTopicsInOrder([
      'Arithmetic Operations',
      'Whole Numbers',
    ]);

    // Filter topics by keyword.
    await topicManager.resetTopicFilter();
    await topicManager.filterTopicsByKeyword('Numbers');
    await topicManager.expectFilteredTopics(['Whole Numbers']);
    await topicManager.expectFilteredTopics(['Arithmetic Operations'], false);

    // Navigate to the skills tab.
    await topicManager.navigateToSkillsTab();
    await topicManager.expectKeywordsSelectedToBe([]);

    // Filter skills by status.
    await topicManager.filterSkillsByStatus('Assigned');
    await topicManager.expectFilteredSkills(['Subtraction'], false);

    // Sort skills by date created.
    await topicManager.resetTopicFilter();
    await topicManager.sortSkills('Oldest Created');
    await topicManager.expectFilteredSkillsInOrder([
      'Addition',
      'Subtraction',
      'Word Problems',
    ]);
    await topicManager.sortSkills('Newly Created');
    await topicManager.expectFilteredSkillsInOrder([
      'Word Problems',
      'Subtraction',
      'Addition',
    ]);

    // Filter skills by keyword.
    await topicManager.resetTopicFilter();
    await topicManager.filterSkillsByKeyword('tion');
    await topicManager.expectFilteredSkills(['Addition', 'Subtraction']);
    await topicManager.expectFilteredSkills(['Word Problems'], false);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
