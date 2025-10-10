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
 * TM.SE Assign, unassign, merge skills in skills dashboard.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

describe('Topic Manager', function () {
  let topicManager: TopicManager;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;

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

  it('should be able to assign a skill to topic', async function () {
    await topicManager.navigateToTopicAndSkillsDashboardPage();
    await topicManager.navigateToSkillsTab();
    await topicManager.assignSkillToTopic(
      'Subtraction',
      'Arithmetic Operations'
    );
    await topicManager.expectToastMessageToBe(
      'The skill has been assigned to the topic.'
    );
    await topicManager.expectSkillAssignedToTopic(
      'Subtraction',
      'Arithmetic Operations'
    );
  });

  it('should be able to unassign a skill from a topic', async function () {
    await topicManager.unassignSkillFromTopic(
      'Subtraction',
      'Arithmetic Operations'
    );
    await topicManager.expectToastMessageToBe(
      'The skill has been unassigned to the topic.'
    );

    await topicManager.expectSkillAssignedToTopic('Subtraction', 'Unassigned');
  });

  it('should be able to merge skills', async function () {
    await topicManager.clickOnMergeSkill('Subtraction');
    await topicManager.fillSkillNameInSkillSelectionModal('Addition');
    await topicManager.expectSkillInSkillSelectionModalToBeVisible('Addition');
    await topicManager.expectSkillInSkillSelectionModalToBeVisible(
      'Subtraction',
      false
    );
    await topicManager.selectSkillAndClickOnDoneInSkillSelectionModal(
      'Addition'
    );
    await topicManager.expectToastMessageToBe('Merged Skills.');
    await topicManager.expectFilteredSkills(['Addition']);
    await topicManager.expectFilteredSkills(['Subtration'], false);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
