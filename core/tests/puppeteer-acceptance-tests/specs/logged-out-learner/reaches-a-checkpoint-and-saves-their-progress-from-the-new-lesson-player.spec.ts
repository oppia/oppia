// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * EL.CP.  Learner reaches a checkpoint and saves their progress from the new lesson
 * player.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const ROLES = testConstants.Roles;

enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  FRACTION_INPUT = 'Fraction Input',
  END_EXPLORATION = 'End Exploration',
}

enum CARDS {
  INTRODUCTION_CARD = 'Introduction',
  SECOND_CARD = 'Second Card',
  THIRD_CARD = 'Third Card',
  FINAL_CARD = 'Final',
}

enum EXPLORATION_TITLE {
  PLACE_VALUES = 'What are the Place Values?',
}

describe('Logged-Out Learner', function () {
  let explorationId: string;
  let loggedOutLearner: LoggedOutUser;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(
    async function () {
      loggedOutLearner = await UserFactory.createLoggedOutUser();

      curriculumAdmin = await UserFactory.createNewUser(
        'curriculumAdm',
        'curriculumAdm@example.com',
        [ROLES.CURRICULUM_ADMIN]
      );

      releaseCoordinator = await UserFactory.createNewUser(
        'releaseCoordinator1',
        'releaseCoordinator1@example.com',
        [ROLES.RELEASE_COORDINATOR]
      );

      // Enable the feature flag.
      await releaseCoordinator.enableFeatureFlag('new_lesson_player');

      await curriculumAdmin.navigateToCreatorDashboardPage();
      await curriculumAdmin.navigateToExplorationEditorFromCreatorDashboard();
      // Add Interaction Cards.
      await curriculumAdmin.dismissWelcomeModal();
      await curriculumAdmin.updateCardContent(
        'Welcome, to the Place Values Exploration.'
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await curriculumAdmin.viewOppiaResponses();
      await curriculumAdmin.directLearnersToNewCard(CARDS.SECOND_CARD);

      await curriculumAdmin.navigateToCard(CARDS.SECOND_CARD);
      await curriculumAdmin.updateCardContent(
        "What is 3/6 equal to in it's simplest form?"
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);
      await curriculumAdmin.addResponsesToTheInteraction(
        INTERACTION_TYPES.FRACTION_INPUT,
        '2',
        'Correct!',
        CARDS.THIRD_CARD,
        true
      );
      await curriculumAdmin.editDefaultResponseFeedbackInExplorationEditorPage(
        'Incorrect, try again!'
      );

      // Add 2 hints.
      await curriculumAdmin.addHintToState(
        'This hint 1 to help to answer the question.'
      );
      await curriculumAdmin.addHintToState(
        'This hint 2 to help to answer the question'
      );
      // Add answer with explanation.
      await curriculumAdmin.addSolutionToState('1/2', 'Answer is 1/2.', true);

      await curriculumAdmin.navigateToCard(CARDS.THIRD_CARD);
      await curriculumAdmin.updateCardContent('Good continue learning!!');
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await curriculumAdmin.viewOppiaResponses();
      await curriculumAdmin.directLearnersToNewCard(CARDS.FINAL_CARD);

      await curriculumAdmin.navigateToCard(CARDS.FINAL_CARD);
      await curriculumAdmin.updateCardContent(
        'You have successfully completed the lesson!'
      );
      await curriculumAdmin.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
      await curriculumAdmin.saveExplorationDraft();

      // Mark second card as a checkpoint.
      await curriculumAdmin.navigateToCard(CARDS.SECOND_CARD);
      await curriculumAdmin.setTheStateAsCheckpoint();
      // Mark third Card as a checkpoint.
      await curriculumAdmin.navigateToCard(CARDS.THIRD_CARD);
      await curriculumAdmin.setTheStateAsCheckpoint();

      await curriculumAdmin.saveExplorationDraft(
        'Add checkpoint as second and third card'
      );

      explorationId = await curriculumAdmin.publishExplorationWithMetadata(
        EXPLORATION_TITLE.PLACE_VALUES,
        'Learn basic Mathematics including Place Values',
        'Mathematics'
      );
      if (!explorationId) {
        throw new Error('Exploration ID is null or undefined.');
      }
    },
    // Setup takes more time than default.
    1000000
  );

  it('should be able to resume progress using the 72-hour link', async function () {
    await loggedOutLearner.playLesson(explorationId);
    await loggedOutLearner.clickOnContinueButton();
    await loggedOutLearner.submitFractionInputResponse('1/2');

    // Click on the 'Save' button.
    await loggedOutLearner.clickOnSaveProgressButton();
    await loggedOutLearner.expectSaveProgressModal();
    // Click on 'copy' button.
    await loggedOutLearner.clickOnCopyButton();
    const newTab = await loggedOutLearner.pasteLinkAndResumeLesson();
    // Fraction card content is visible.
    await loggedOutLearner.expectLearnerCardHeading(
      "What is 3/6 equal to in it's simplest form?"
    );
    expect(await loggedOutLearner.isLoginButtonVisible()).toBe(true);
    await newTab.close();
  });

  it('should be able to sign up to permanently save the progress', async function () {
    await loggedOutLearner.clickOnCreateAnAccountInSaveProgressModal();
    await loggedOutLearner.expectToBeOnLoginPage();
    await loggedOutLearner.goThoroughSignUpProcess(
      'learner@example.com',
      'learner'
    );
    await loggedOutLearner.expectProgressReminderModalToBeVisible();
    await loggedOutLearner.clickOnLessonResumeButton();
    expect(await loggedOutLearner.isSaveLessonProgressButtonVisible()).toBe(
      false
    );
    expect(await loggedOutLearner.isProfileAvatarVisible()).toBe(true);
    expect(await loggedOutLearner.isLoginButtonVisible()).toBe(false);
  });
  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
