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
 * @fileoverview Acceptance Test for the journey of a topic manager. The journey includes editing skill description and concept card explanation, adding and deleting worked examples, adding and deleting misconceptions, managing prerequisite skills, editing rubrics, and publishing the topic again.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {TopicManager} from '../../utilities/user/topic-manager';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Topic Manager User Journey', function () {
  let topicManager: TopicManager;
  let curriculumAdmin: CurriculumAdmin;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_Admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    await curriculumAdmin.createTopic('Addition', 'add');
    await curriculumAdmin.createSkillForTopic(
      'Single Digit Addition',
      'Addition'
    );
    await curriculumAdmin.createSkillForTopic(
      'Double Digit Addition',
      'Addition'
    );

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Addition'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to update the concept card explanation(review material), add and delete worked examples, add delete misconceptions, manage prerequisite skills, edit rubrics, and publish the skill again.',
    async function () {
      await topicManager.navigateToTopicAndSkillsDashboardPage();
      await topicManager.openSkillEditor('Double Digit Addition');
      await topicManager.updateReviewMaterial(
        'Review material text content for Double Digit Addition.'
      );

      await topicManager.addWorkedExample('Add 2 and 3', '2+3=5.');
      await topicManager.deleteWorkedExample('Add 2 and 3');

      await topicManager.addMisconception(
        'Addition Misconception',
        'Some might think 2+3=23.',
        'The correct answer is 5.'
      );
      await topicManager.deleteMisconception('Addition Misconception');

      await topicManager.addPrerequisiteSkillInSkillEditor(
        'Single Digit Addition'
      );
      await topicManager.removePrerequisiteSkill('Single Digit Addition');

      await topicManager.updateRubric('Easy', 'Student can add single digits.');
      await topicManager.publishUpdatedSkill('Updated everything');
      await topicManager.openSkillEditor('Double Digit Addition');

      await topicManager.verifyWorkedExamplePresent('Add 2 and 3', false);
      await topicManager.verifyMisconceptionPresent(
        'Addition Misconception',
        false
      );
      await topicManager.verifyPrerequisiteSkillPresent('', false);

      await topicManager.previewConceptCard();
      await topicManager.expectConceptCardPreviewToHave(
        'Double Digit Addition',
        'Review material text content for Double Digit Addition.'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
