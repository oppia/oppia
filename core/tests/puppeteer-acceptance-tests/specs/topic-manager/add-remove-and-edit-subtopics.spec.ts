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
 * TM.TE Add, remove, and edit the subtopics of a topic.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

describe('Topic Manager', function () {
  let topicManager: TopicManager & ExplorationEditor & CurriculumAdmin;
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
    await curriculumAdmin.createTopic(
      'Arithmetic Operations',
      'arithmetic-operation'
    );
    await curriculumAdmin.createSubtopicForTopic(
      'Addition',
      'addition',
      'Arithmetic Operations'
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

  it('should be able to add and delete a subtopic in a topic', async function () {
    await topicManager.openTopicEditor('Arithmetic Operations');
    await topicManager.createSubtopicForTopic(
      'Subtraction',
      'subtraction',
      'Arithmetic Operations'
    );
    await topicManager.openTopicEditor('Arithmetic Operations');
    await topicManager.verifySubtopicPresenceInTopic('Subtraction');

    // Delete the subtopic.
    await topicManager.deleteSubtopicFromTopic(
      'Subtraction',
      'Arithmetic Operations'
    );
    await topicManager.saveTopicDraft('Arithmetic Operations', 'Updated topic');
    await topicManager.openTopicEditor('Arithmetic Operations');
    await topicManager.verifySubtopicPresenceInTopic('Addition');
    await topicManager.verifySubtopicPresenceInTopic(
      'Subtraction', // Subtopic Name.
      null, // Check in the same topic.
      false // Should not exist.
    );
  });

  it('should be able to edit and preview subtopic', async function () {
    await topicManager.openSubtopicEditor('Addition');
    await topicManager.editSubTopicDetails(
      'Intro to Addition and Subtraction',
      'intro-add-subtract',
      'This is introduction to Addition and Subtraction.',
      testConstants.data.profilePicture
    );
    await topicManager.expectScreenshotToMatch(
      'updatedAdditionSubtopic',
      __dirname
    );

    await topicManager.saveTopicDraft('Arithmetic Operations', 'Updated topic');
    await topicManager.expectToastMessageToBe('Changes Saved.');

    await topicManager.navigateToSubtopicPreviewTab(
      'Intro to Addition and Subtraction',
      'Arithmetic Operations'
    );
    await topicManager.expectSubtopicPreviewToHave(
      'Intro to Addition and Subtraction',
      'This is introduction to Addition and Subtraction.'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
