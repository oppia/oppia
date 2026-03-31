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
 * TM.SE Edit and republish the skill.
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
  }, 750000);

  it('should be able to edit and republish the skill', async function () {
    // Add worked example to the skill.
    await topicManager.openSkillEditor('Subtraction');
    // TODO(#23231): Add worked example and save.
    // Also, uncomment the below line.
    // await this.expectSaveChangesInSkillEditorToBe('enabled');
    await topicManager.expectScreenshotToMatch('skillEditor', __dirname);

    // Add a misconception to the skill.
    // TODO(#23231): Uncomment the below line, once the issue is fixed.
    // await topicManager.publishUpdatedSkill('Added worked example to the skill');
    await topicManager.addMisconception(
      "You can't subtract a fraction from a whole number.",
      'We have practiced subtracting fractions from whole numbers.',
      'Feedback for subtracting fractions from whole numbers.',
      true
    );
    await topicManager.expectSaveChangesInSkillEditorToBe('enabled');

    // Add explaination for a difficulty rubric.
    await topicManager.publishUpdatedSkill('Added misconception to the skill');
    await topicManager.updateRubric('Easy', 'This is for easy questions.');
    await topicManager.expectSaveChangesInSkillEditorToBe('enabled');

    // Add prerequisite skill.
    await topicManager.publishUpdatedSkill('Added difficulty rubric.');
    await topicManager.addPrerequisiteSkillInSkillEditor('Addition');
    await topicManager.expectSaveChangesInSkillEditorToBe('enabled');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
