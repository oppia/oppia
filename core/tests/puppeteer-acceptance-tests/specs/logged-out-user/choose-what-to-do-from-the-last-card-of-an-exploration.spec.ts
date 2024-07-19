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
 * @fileoverview Acceptance Test for the learner journey in the math classroom.
 * The test includes:
 * - Setup: Creation of exploration, topic, subtopic, skill, story, and classroom by a curriculum admin.
 * - User Journey: Navigation to classroom, selection of topic, completion of exploration, and review of a card by a logged-out user.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Logged-out User', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let loggedOutUser: LoggedOutUser;
  let explorationId1: string | null;
  let explorationId2: string | null;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();

    explorationId1 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'negative-numbers'
      );

    explorationId2 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'positive-numbers'
      );

    await curriculumAdmin.createTopic('Algebra I', 'algebra-one');
    await curriculumAdmin.createSubtopicForTopic(
      'Negative Numbers',
      'negative-numbers',
      'Algebra I'
    );

    await curriculumAdmin.createSkillForTopic('Negative Numbers', 'Algebra I');
    await curriculumAdmin.createQuestionsForSkill('Negative Numbers', 10);
    await curriculumAdmin.assignSkillToSubtopicInTopicEditor(
      'Negative Numbers',
      'Negative Numbers',
      'Algebra I'
    );
    // await curriculumAdmin.enablePracticeTabForSkill('Negative Numbers');
    await curriculumAdmin.addSkillToDiagnosticTest(
      'Negative Numbers',
      'Algebra I'
    );

    await curriculumAdmin.publishDraftTopic('Algebra I');
    await curriculumAdmin.createAndPublishStoryWithChapter(
      'Algebra Story',
      'algebra-story',
      'Understanding Negative Numbers',
      explorationId1 as string,
      'Algebra I'
    );
    await curriculumAdmin.createAndPublishStoryWithChapter(
      'Algebra Story',
      'algebra-story',
      'Understanding Positive Numbers',
      explorationId2 as string,
      'Algebra I'
    );

    await curriculumAdmin.createNewClassroom('Math', 'math');
    await curriculumAdmin.updateClassroom(
      'Math',
      'Teaser text',
      'Course details',
      'Topic list intro'
    );
    await curriculumAdmin.addTopicToClassroom('Math', 'Algebra I');
    await curriculumAdmin.publishClassroom('Math');
    await curriculumAdmin.timeout(2147483647);
  }, 2147483647);

  it(
    'should be able to navigate through the learner journey from the last state of an exploration',
    async function () {
      // Navigate to the math classroom and select a topic
      await loggedOutUser.navigateToClassroomPage('math');
      await loggedOutUser.expectTopicsToBePresent(['Algebra I']);
      await loggedOutUser.selectAndOpenTopic('Algebra I');

      // Select a chapter within the story to learn
      await loggedOutUser.selectChapterWithinStoryToLearn(
        'Algebra Story',
        'Understanding Negative Numbers'
      );

      // Play the exploration linked with the chapter selected
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.submitAnswer('-40');
      await loggedOutUser.continueToNextCard();

      // Check the completion message and restart the exploration
      await loggedOutUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      // Load the next chapter upon clicking the “Next chapter” card on the last state
      await loggedOutUser.loadNextChapterFromLastState();

      // Load the practice session page upon clicking the practice session card on the last state
      await loggedOutUser.loadPracticeSessionFromLastState();

      // Return to the story from the last state
      await loggedOutUser.returnToStoryFromLastState();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
