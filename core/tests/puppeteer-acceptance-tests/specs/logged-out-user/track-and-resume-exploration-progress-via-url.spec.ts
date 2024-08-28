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
 * User Journey: Lesson info modal usage, progress tracking, state answering, progress URL generation and usage.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const PROGRESS_URL_VALIDITY_INFO =
  'Use the link below to save progress for 72 hours.';

enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  NUMERIC_INPUT = 'Number Input',
  END_EXPLORATION = 'End Exploration',
}
enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  TEST_QUESTION = 'Test Question',
  REVISION_CARD = 'Revision Card',
  FINAL_CARD = 'Final Card',
}

describe('Logged-out User', function () {
  let explorationEditor: ExplorationEditor;
  let loggedOutUser: LoggedOutUser;
  let progressUrl: string;
  let explorationId: string | null;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent(
      'We will be learning positive numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with a question.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard('Test Question');
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.TEST_QUESTION);
    await explorationEditor.updateCardContent(
      'Enter a negative number greater than -100.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMERIC_INPUT,
      '-99',
      'Prefect!',
      CARD_NAME.REVISION_CARD,
      true
    );
    await explorationEditor.editDefaultResponseFeedback('Wrong, try again!');
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and Revision content.
    await explorationEditor.navigateToCard(CARD_NAME.REVISION_CARD);
    await explorationEditor.updateCardContent(
      'Positive numbers are greater than zero.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.setTheStateAsCheckpoint();
    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.updateCardContent(
      'We have practiced positive numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
    await explorationEditor.saveExplorationDraft();

    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'Positive Numbers',
      'Learn positive numbers.',
      'Algebra',
      'growth'
    );

    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to check progress, answer states, generate and use progress URL in the exploration player.',
    async function () {
      await loggedOutUser.navigateToCommunityLibraryPage();
      await loggedOutUser.searchForLessonInSearchBar('Positive Numbers');
      await loggedOutUser.playLessonFromSearchResults('Positive Numbers');

      await loggedOutUser.continueToNextCard();

      await loggedOutUser.openLessonInfoModal();
      await loggedOutUser.expectLessonInfoToShowRating('Unrated');
      await loggedOutUser.expectLessonInfoToShowNoOfViews(1);
      await loggedOutUser.expectLessonInfoToShowLastUpdated();
      await loggedOutUser.expectLessonInfoToShowTags(['growth']);
      await loggedOutUser.expectNoSaveProgressBeforeCheckpointInfo();

      await loggedOutUser.shareExplorationFromLessonInfoModal(
        'Facebook',
        explorationId
      );
      await loggedOutUser.shareExplorationFromLessonInfoModal(
        'Twitter',
        explorationId
      );

      await loggedOutUser.closeLessonInfoModal();

      await loggedOutUser.submitAnswer('-25');
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.verifyCheckpointModalAppears();

      await loggedOutUser.reloadPage();
      await loggedOutUser.expectProgressRemainder(false);

      await loggedOutUser.continueToNextCard();
      await loggedOutUser.submitAnswer('-35');
      await loggedOutUser.continueToNextCard();

      await loggedOutUser.openLessonInfoModal();
      await loggedOutUser.saveProgress();
      await loggedOutUser.expectSignInButtonToBePresent();
      await loggedOutUser.expectCreateAccountToBePresent();
      await loggedOutUser.checkProgressUrlValidityInfo(
        PROGRESS_URL_VALIDITY_INFO
      );
      progressUrl = await loggedOutUser.copyProgressUrl();

      await loggedOutUser.startExplorationUsingProgressUrl(progressUrl);
      await loggedOutUser.expectProgressRemainder(true);
      await loggedOutUser.chooseActionInProgressRemainder('Resume');

      await loggedOutUser.goBackToPreviousCard();
      await loggedOutUser.verifyCannotAnswerPreviouslyAnsweredQuestion();
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.continueToNextCard();
      await loggedOutUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
