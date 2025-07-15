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
 * EL.CP. Learner reaches a checkpoint and saves their progress
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {
  ExplorationEditor,
  INTERACTION_TYPES,
} from '../../utilities/user/exploration-editor';

const PROGRESS_URL_VALIDITY_INFO =
  'Use the link below to save progress for 72 hours.';

enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  SECOND_CARD = 'Second Card',
  FINAL_CARD = 'Final Card',
}

describe('Logged-out User', function () {
  let explorationEditor: ExplorationEditor;
  let loggedOutLearner: LoggedOutUser;
  let progressUrl: string;
  let explorationId: string | null;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    loggedOutLearner = await UserFactory.createLoggedOutUser();

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent(
      'Welcome, to the Place Values Exploration.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with a basic algebra problem.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.SECOND_CARD);
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.SECOND_CARD);
    await explorationEditor.setTheStateAsCheckpoint();
    await explorationEditor.updateCardContent(
      'Give fraction with denominator 2.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.FRACTION_INPUT);

    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.FRACTION_INPUT,
      '2',
      'Perfect!',
      CARD_NAME.FINAL_CARD,
      true
    );
    await explorationEditor.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong, try again!'
    );
    await explorationEditor.addHintToState('We can have any numerator.');
    await explorationEditor.addHintToState('Numerator is the number on top.');

    await explorationEditor.addSolutionToState(
      '1/2',
      '1/2 here 1 is the numerator and 2 is the denominator.',
      true
    );
    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.updateCardContent(
      'Congratulations! You have completed the exploration.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
    await explorationEditor.saveExplorationDraft();
    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'What are the Place Values?',
      'Learn basic Mathematics including Place Values',
      'Algebra'
    );
  });

  it('should be able to resume progress using 72-hour link.', async function () {
    await loggedOutLearner.playExploration(explorationId);
    await loggedOutLearner.continueToNextCard();

    await loggedOutLearner.verifyCheckpointModalAppears();
    await loggedOutLearner.openLessonInfoModal();
    await loggedOutLearner.expectLessonInfoToShowRating('Unrated');
    await loggedOutLearner.expectLessonInfoToShowNoOfViews(1);
    await loggedOutLearner.expectLessonInfoToShowLastUpdated();
    await loggedOutLearner.shareExplorationFromLessonInfoModal(
      'Facebook',
      explorationId
    );
    await loggedOutLearner.shareExplorationFromLessonInfoModal(
      'Twitter',
      explorationId
    );

    await loggedOutLearner.reloadPage();
    await loggedOutLearner.expectProgressRemainder(false);

    await loggedOutLearner.continueToNextCard();
    await loggedOutLearner.verifyCheckpointModalAppears();
    await loggedOutLearner.submitAnswer('1/2');

    await loggedOutLearner.openLessonInfoModal();
    await loggedOutLearner.saveProgress();
    await loggedOutLearner.expectSignInButtonToBePresent();
    await loggedOutLearner.expectCreateAccountToBePresent();
    await loggedOutLearner.checkProgressUrlValidityInfo(
      PROGRESS_URL_VALIDITY_INFO
    );
    progressUrl = await loggedOutLearner.copyProgressUrl();

    await loggedOutLearner.startExplorationUsingProgressUrl(progressUrl, false);
    await loggedOutLearner.expectProgressRemainder(true);
    await loggedOutLearner.chooseActionInProgressRemainder('Resume');

    await loggedOutLearner.goBackToPreviousCard();
    await loggedOutLearner.verifyCannotAnswerPreviouslyAnsweredQuestion();
    await loggedOutLearner.continueToNextCard();
    await loggedOutLearner.submitAnswer('1/2');
    await loggedOutLearner.continueToNextCard();
    await loggedOutLearner.expectExplorationCompletionToastMessage(
      'Congratulations for completing this lesson!'
    );
  });

  it('should be able to sign up to permanently save the progress', async function () {
    await loggedOutLearner.signUpFromTheLessonPlayer(
      'learner@example.com',
      'learner'
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
