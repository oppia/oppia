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
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();

    await curriculumAdmin.navigateToCreatorDashboardPage();
    await curriculumAdmin.navigateToExplorationEditorPage();
    await curriculumAdmin.dismissWelcomeModal();
    await curriculumAdmin.updateCardContent('Introduction to Algebra');
    await curriculumAdmin.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with a question.
    await curriculumAdmin.viewOppiaResponses();
    await curriculumAdmin.directLearnersToNewCard('Algebra Basics');
    await curriculumAdmin.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await curriculumAdmin.navigateToCard('Algebra Basics');
    await curriculumAdmin.updateCardContent(
      'Enter a negative number greater than -100.'
    );
    await curriculumAdmin.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
    await curriculumAdmin.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMERIC_INPUT,
      '-99',
      'Perfect!',
      CARD_NAME.FINAL_CARD,
      true
    );
    await curriculumAdmin.addOppiaResponsesForWrongAnswers('Wrong, try again!');

    await curriculumAdmin.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await curriculumAdmin.navigateToCard(CARD_NAME.FINAL_CARD);
    await curriculumAdmin.updateCardContent(
      'We have practiced negative numbers.'
    );
    await curriculumAdmin.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await curriculumAdmin.navigateToCard('Introduction to Algebra');
    await curriculumAdmin.saveExplorationDraft();
    explorationId = await curriculumAdmin.publishExplorationWithMetadata(
      'Algebra Basics',
      'Learn the basics of Algebra',
      'Algebra'
    );
    if (!explorationId) {
      throw new Error('Error publishing exploration successfully.');
    }

    await curriculumAdmin.createTopic('Algebra I', 'algebra-one');
    await curriculumAdmin.createSubtopicForTopic(
      'Negative Numbers',
      'negative-numbers',
      'Algebra I'
    );

    await curriculumAdmin.createSkillForTopic('Negative Numbers', 'Algebra I');
    await curriculumAdmin.createQuestionsForSkill('Negative Numbers', 3);
    await curriculumAdmin.assignSkillToSubtopicInTopicEditor(
      'Negative Numbers',
      'Negative Numbers',
      'Algebra I'
    );
    await curriculumAdmin.addSkillToDiagnosticTest(
      'Negative Numbers',
      'Algebra I'
    );

    await curriculumAdmin.publishDraftTopic('Algebra I');
    await curriculumAdmin.createAndPublishStoryWithChapter(
      'Algebra Story',
      'algebra-story',
      'Understanding Negative Numbers',
      explorationId,
      'Algebra I'
    );
    await curriculumAdmin.expectTopicToBePublishedInTopicsAndSkillsDashboard(
      'Algebra I',
      1,
      1,
      1
    );

    await curriculumAdmin.createNewClassroom('Math', '/math');
    await curriculumAdmin.addTopicToClassroom('Math', 'Algebra I');
    await curriculumAdmin.publishClassroom('Math');
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to complete the learner journey in the math classroom',
    async function () {
      await loggedOutUser.navigateToClassroomPage('math');
      await loggedOutUser.expectTopicsToBePresent(['Algebra I']);

      await loggedOutUser.selectAndOpenTopic('Algebra I');

      await loggedOutUser.selectChapterWithinStoryToLearn(
        'Algebra Story',
        'Understanding Negative Numbers'
      );

      // Playing the exploration linked with the chapter selected.
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.submitAnswer('-40');
      await loggedOutUser.continueToNextCard();

      // Check the completion message and restart the exploration.
      await loggedOutUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      // Returning to the topic page from the exploration player itself.
      await loggedOutUser.returnToTopicPageAfterCompletingExploration();
      await loggedOutUser.navigateToRevisionTab();
      // Review cards are the subtopic that are created in the topic.
      await loggedOutUser.selectReviewCardToLearn('Negative Numbers');
      await loggedOutUser.expectReviewCardToHaveContent(
        'Negative Numbers',
        'Subtopic creation description text for Negative Numbers'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
