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
const INTRODUCTION_CARD_CONTENT: string =
  'This exploration will test your understanding of negative numbers.';
enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  NUMERIC_INPUT = 'Number Input',
  END_EXPLORATION = 'End Exploration',
}
enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  TEST_QUESTION = 'Test Question',
  FINAL_CARD = 'Final Card',
}

describe('Logged-out User', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let loggedOutUser: LoggedOutUser;
  let explorationId: string | null;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_Admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();

    await curriculumAdmin.navigateToCreatorDashboardPage();
    await curriculumAdmin.navigateToExplorationEditorPage();
    await curriculumAdmin.dismissWelcomeModal();
    await curriculumAdmin.updateCardContent(INTRODUCTION_CARD_CONTENT);
    await curriculumAdmin.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with a question.
    await curriculumAdmin.viewOppiaResponses();
    await curriculumAdmin.directLearnersToNewCard('Test Question');
    await curriculumAdmin.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await curriculumAdmin.navigateToCard(CARD_NAME.TEST_QUESTION);
    await curriculumAdmin.updateCardContent(
      'Enter a negative number greater than -100.'
    );
    await curriculumAdmin.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
    await curriculumAdmin.addResponseToTheInteraction(
      INTERACTION_TYPES.NUMERIC_INPUT,
      '-99',
      'Prefect!',
      CARD_NAME.FINAL_CARD,
      true
    );
    await curriculumAdmin.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await curriculumAdmin.navigateToCard(CARD_NAME.FINAL_CARD);
    await curriculumAdmin.updateCardContent(
      'We have practiced negative numbers.'
    );
    await curriculumAdmin.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await curriculumAdmin.navigateToCard(CARD_NAME.INTRODUCTION);
    await curriculumAdmin.saveExplorationDraft();
    explorationId = await curriculumAdmin.publishExplorationWithMetadata(
      'Test Exploration Title 1',
      'Test Exploration Goal',
      'Algebra'
    );
    if (!explorationId) {
      throw new Error('Error publishing exploration successfully.');
    }

    await curriculumAdmin.createTopic('Test Topic 1', 'test-topic-one');
    await curriculumAdmin.createSubtopicForTopic(
      'Test Subtopic 1',
      'test-subtopic-one',
      'Test Topic 1'
    );

    await curriculumAdmin.createSkillForTopic('Test Skill 1', 'Test Topic 1');
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
    await curriculumAdmin.createAndPublishStoryWithChapter(
      'Test Story 1',
      'test-story-one',
      explorationId,
      'Test Topic 1'
    );
    await curriculumAdmin.expectTopicToBePublishedInTopicsAndSkillsDashboard(
      'Test Topic 1',
      1,
      1,
      1
    );

    await curriculumAdmin.createNewClassroom('math', '/math');
    await curriculumAdmin.addTopicToClassroom('math', 'Test Topic 1');
    await curriculumAdmin.publishClassroom('math');
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to complete the learner journey in the math classroom',
    async function () {
      await loggedOutUser.navigateToClassroomPage('math');
      await loggedOutUser.expectTopicsToBePresent(['Algebra']);

      await loggedOutUser.selectTopicToLearn('Algebra');

      await loggedOutUser.selectChapterWithinStoryToLearn();
      // Playing the exploration linked with the chapter selected
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.submitAnswer('-40');
      await loggedOutUser.continueToNextCard();

      // Check the completion message and restart the exploration.
      await loggedOutUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedOutUser.returnToTopicPageAfterCompletingExploration();
      await loggedOutUser.navigateToRevisionTab();
      // Review cards are the subtopic that are created in the topic.
      await loggedOutUser.selectReviewCardToLearn();
      await loggedOutUser.expectReviewCardToHaveContent();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
