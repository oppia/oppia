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
 * @fileoverview Acceptance test to cover learner journey for an exploration that includes sharing of the exploration, generation of attribution, giving feedback, and not be able to report or rate the exploration
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {showMessage} from '../../utilities/common/show-message';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

enum INTERACTION_TYPES {
  CONTINUE_BUTTON = 'Continue Button',
  NUMERIC_INPUT = 'Number Input',
  END_EXPLORATION = 'End Exploration',
}
enum CARD_NAME {
  INTRODUCTION = 'Introduction',
  ALGEBRA_BASICS = 'Algebra Basics',
  FINAL_CARD = 'Final Card',
}

ConsoleReporter.setConsoleErrorsToIgnore([
  "Failed to execute 'convertToSpecifiedUnits' on 'SVGLength': Could not resolve relative length.",
]);

describe('Logged-out User', function () {
  let explorationEditor: ExplorationEditor;
  let loggedInUser: LoggedInUser & LoggedOutUser;
  let explorationId: string | null;

  beforeAll(async function () {
    // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
    // in mobile viewport which is required for testing the feedback messages tab),
    // remove this part of skipping the test and make the test to run in mobile viewport as well.
    // see: https://github.com/oppia/oppia/issues/19443
    if (process.env.MOBILE === 'true') {
      showMessage('Test skipped in mobile viewport');
      return;
    }
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    loggedInUser = await UserFactory.createNewUser(
      'loggedInUser',
      'logged_in_user@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    await explorationEditor.updateCardContent('Introduction to Algebra');
    await explorationEditor.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);

    // Add a new card with a question.
    await explorationEditor.viewOppiaResponses();
    await explorationEditor.directLearnersToNewCard(CARD_NAME.ALGEBRA_BASICS);
    await explorationEditor.saveExplorationDraft();

    // Navigate to the new card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.ALGEBRA_BASICS);
    await explorationEditor.updateCardContent(
      'Enter a negative number greater than -100.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.NUMERIC_INPUT);
    await explorationEditor.addResponsesToTheInteraction(
      INTERACTION_TYPES.NUMERIC_INPUT,
      '-99',
      'Perfect!',
      CARD_NAME.FINAL_CARD,
      true
    );
    await explorationEditor.editDefaultResponseFeedback('Wrong, try again!');

    await explorationEditor.saveExplorationDraft();

    // Navigate to the final card and update its content.
    await explorationEditor.navigateToCard(CARD_NAME.FINAL_CARD);
    await explorationEditor.updateCardContent(
      'We have practiced negative numbers.'
    );
    await explorationEditor.addInteraction(INTERACTION_TYPES.END_EXPLORATION);

    // Navigate back to the introduction card and save the draft.
    await explorationEditor.navigateToCard(CARD_NAME.INTRODUCTION);
    await explorationEditor.saveExplorationDraft();
    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'Algebra Basics',
      'Learn the basics of Algebra',
      'Algorithms'
    );

    if (!explorationId) {
      throw new Error('Error publishing exploration successfully.');
    }
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to give feedback (identified and anonymous), rate the exploration, report at any point, and check feedback updates and exploration editor pages',
    async function () {
      // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
      // in mobile viewport which is required for testing the feedback messages tab),
      // remove this part of skipping the test and make the test to run in mobile viewport as well.
      // see: https://github.com/oppia/oppia/issues/19443
      if (process.env.MOBILE === 'true') {
        showMessage('Test skipped in mobile viewport');
        return;
      }

      await loggedInUser.navigateToCommunityLibraryPage();
      await loggedInUser.searchForLessonInSearchBar('Algebra Basics');
      await loggedInUser.playLessonFromSearchResults('Algebra Basics');

      await loggedInUser.continueToNextCard();
      // Giving anonymous feedback after completing the exploration.
      await loggedInUser.giveFeedback('This state is very informative!', true);
      await loggedInUser.submitAnswer('-40');
      await loggedInUser.continueToNextCard();
      await loggedInUser.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      // Giving identified feedback before completing the exploration on a state.
      await loggedInUser.giveFeedback('This is a great lesson!', false);
      await loggedInUser.reportExploration('It is an ad');
      await loggedInUser.rateExploration(5, 'Nice!', false);

      // Check the exploration editor page.
      await explorationEditor.page.bringToFront();
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.openExplorationInExplorationEditor(
        'Algebra Basics'
      );

      await explorationEditor.navigateToFeedbackTab();
      await explorationEditor.expectNoOfSuggestionsToBe(3);
      await explorationEditor.viewFeedbackThread(1);
      await explorationEditor.expectSuggestionToBeAnonymous(
        'This state is very informative!',
        true
      );
      await explorationEditor.replyToSuggestion('Thanks for the feedback!');
      await explorationEditor.viewFeedbackThread(2);
      await explorationEditor.expectSuggestionToBeAnonymous('Nice!', false);
      await explorationEditor.replyToSuggestion(
        'Thanks for the feedback, We will update!'
      );

      // Check feedback updates page.
      await loggedInUser.page.bringToFront();
      await loggedInUser.navigateToFeedbackUpdatesPage();
      await loggedInUser.viewFeedbackUpdateThread(1);
      await loggedInUser.expectFeedbackAndResponseToMatch(
        'Nice!',
        'Thanks for the feedback, We will update!'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
